import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, closestCorners,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";

import Navbar from "../components/Navbar";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import QuickAddTask from "../components/QuickAddTask";
import ActivityPanel from "../components/ActivityPanel";
import { getTasks, deleteTask, updateTask } from "../services/taskService";
import { getBoards } from "../services/boardService";

const COLUMNS = [
  { id: "todo",        label: "To Do",       color: "bg-slate-50 dark:bg-slate-800/60",      badge: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300", dot: "bg-slate-400" },
  { id: "in-progress", label: "In Progress", color: "bg-blue-50 dark:bg-blue-950/40",         badge: "bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-300",    dot: "bg-blue-500" },
  { id: "done",        label: "Done",        color: "bg-emerald-50 dark:bg-emerald-950/40",   badge: "bg-emerald-200 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
];

const PAGE_LIMIT = 8;

export default function Board() {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);

  // Per-column task state
  const [colState, setColState] = useState({
    todo:          { tasks: [], page: 1, hasMore: false, loading: false },
    "in-progress": { tasks: [], page: 1, hasMore: false, loading: false },
    done:          { tasks: [], page: 1, hasMore: false, loading: false },
  });

  const [showModal, setShowModal]     = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [prefillData, setPrefillData] = useState(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityTick, setActivityTick] = useState(0);
  const [activeTask, setActiveTask]   = useState(null);
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("created");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Load a single column page
  const loadColumn = useCallback(async (status, page = 1, append = false) => {
    setColState((prev) => ({
      ...prev,
      [status]: { ...prev[status], loading: true },
    }));
    try {
      const res = await getTasks(id, status, page, PAGE_LIMIT);
      const { tasks, pagination } = res.data;
      setColState((prev) => ({
        ...prev,
        [status]: {
          tasks: append ? [...prev[status].tasks, ...tasks] : tasks,
          page,
          hasMore: pagination.hasMore,
          loading: false,
        },
      }));
    } catch {
      setColState((prev) => ({ ...prev, [status]: { ...prev[status], loading: false } }));
    }
  }, [id]);

  useEffect(() => {
    const init = async () => {
      try {
        const boardsRes = await getBoards();
        setBoard(boardsRes.data.find((b) => b._id === id) || null);
      } catch { /* ignore */ }
      await Promise.all(["todo", "in-progress", "done"].map((s) => loadColumn(s, 1)));
      setLoading(false);
    };
    init();
  }, [id, loadColumn]);

  const loadMore = (status) => {
    const { page, loading: colLoading, hasMore } = colState[status];
    if (colLoading || !hasMore) return;
    loadColumn(status, page + 1, true);
  };

  // Refresh a column from page 1 (after mutation)
  const refreshColumn = (status) => loadColumn(status, 1, false);

  // ── Mutations ──────────────────────────────────────────────
  const handleSaved = (savedTask, wasEditing) => {
    if (wasEditing) {
      // Task may have changed status — refresh both old and new columns
      setColState((prev) => {
        const newState = { ...prev };
        Object.keys(newState).forEach((s) => {
          newState[s] = {
            ...newState[s],
            tasks: newState[s].tasks.map((t) => t._id === savedTask._id ? savedTask : t)
                                    .filter((t) => t.status === s),
          };
        });
        return newState;
      });
      refreshColumn(savedTask.status);
    } else {
      refreshColumn(savedTask.status);
    }
    setShowModal(false);
    setEditingTask(null);
    setPrefillData(null);
    setActivityTick((t) => t + 1);
  };

  const handleDelete = async (taskId, taskStatus) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await deleteTask(taskId);
      setColState((prev) => ({
        ...prev,
        [taskStatus]: {
          ...prev[taskStatus],
          tasks: prev[taskStatus].tasks.filter((t) => t._id !== taskId),
        },
      }));
      toast.success("Task deleted");
      setActivityTick((t) => t + 1);
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleMove = async (taskId, oldStatus, newStatus) => {
    try {
      const res = await updateTask(taskId, { status: newStatus });
      setColState((prev) => ({
        ...prev,
        [oldStatus]: { ...prev[oldStatus], tasks: prev[oldStatus].tasks.filter((t) => t._id !== taskId) },
        [newStatus]: { ...prev[newStatus], tasks: [res.data, ...prev[newStatus].tasks] },
      }));
      setActivityTick((t) => t + 1);
    } catch {
      toast.error("Failed to move task");
    }
  };

  // ── DnD ───────────────────────────────────────────────────
  const handleDragStart = ({ active }) => {
    for (const s of Object.keys(colState)) {
      const found = colState[s].tasks.find((t) => t._id === active.id);
      if (found) { setActiveTask(found); return; }
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const draggedTask = Object.values(colState).flatMap((c) => c.tasks).find((t) => t._id === active.id);
    if (!draggedTask) return;
    const targetStatus = COLUMNS.find((c) => c.id === over.id)
      ? over.id
      : Object.values(colState).flatMap((c) => c.tasks).find((t) => t._id === over.id)?.status;
    if (!targetStatus || draggedTask.status === targetStatus) return;

    // Optimistic
    setColState((prev) => ({
      ...prev,
      [draggedTask.status]: { ...prev[draggedTask.status], tasks: prev[draggedTask.status].tasks.filter((t) => t._id !== draggedTask._id) },
      [targetStatus]: { ...prev[targetStatus], tasks: [{ ...draggedTask, status: targetStatus }, ...prev[targetStatus].tasks] },
    }));

    try {
      await updateTask(draggedTask._id, { status: targetStatus });
      setActivityTick((t) => t + 1);
    } catch {
      toast.error("Failed to move task");
      // revert
      setColState((prev) => ({
        ...prev,
        [draggedTask.status]: { ...prev[draggedTask.status], tasks: [draggedTask, ...prev[draggedTask.status].tasks] },
        [targetStatus]: { ...prev[targetStatus], tasks: prev[targetStatus].tasks.filter((t) => t._id !== draggedTask._id) },
      }));
    }
  };

  // ── Filter / sort (client-side on loaded tasks) ───────────
  const filtered = (tasks) => {
    let list = [...tasks];
    if (filterPriority !== "all") list = list.filter((t) => t.priority === filterPriority);
    if (sortBy === "dueDate") list.sort((a, b) => (!a.dueDate ? 1 : !b.dueDate ? -1 : new Date(a.dueDate) - new Date(b.dueDate)));
    else if (sortBy === "priority") list.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));
    return list;
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-48 mb-6 animate-pulse" />
        <div className="grid md:grid-cols-3 gap-5">
          {[1,2,3].map((i) => <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-72 animate-pulse shadow-sm" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Link to="/dashboard" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm shrink-0 hover:underline">
              ← Boards
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">{board?.title || "Board"}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setEditingTask(null); setPrefillData(null); setShowModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-md"
            >
              <span className="text-base leading-none">+</span> Add Task
            </button>
            <QuickAddTask onParsed={(p) => { setEditingTask(null); setPrefillData(p); setShowModal(true); }} />
            <button
              onClick={() => setActivityOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium transition-all shadow-sm"
            >
              📋 Activity
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 mb-6 p-3 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All priorities</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="created">⏱ Newest first</option>
            <option value="dueDate">📅 Due date</option>
            <option value="priority">⚡ Priority</option>
          </select>
          {(filterPriority !== "all" || sortBy !== "created") && (
            <button onClick={() => { setFilterPriority("all"); setSortBy("created"); }}
              className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 rounded-lg transition-colors">
              ✕ Reset
            </button>
          )}
        </div>

        {/* Kanban */}
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid md:grid-cols-3 gap-5">
            {COLUMNS.map((col) => {
              const { tasks, hasMore, loading: colLoading } = colState[col.id];
              const displayTasks = filtered(tasks);
              return (
                <DroppableColumn
                  key={col.id}
                  col={col}
                  tasks={displayTasks}
                  hasMore={hasMore}
                  colLoading={colLoading}
                  onLoadMore={() => loadMore(col.id)}
                  onEdit={(task) => { setEditingTask(task); setPrefillData(null); setShowModal(true); }}
                  onDelete={(taskId) => handleDelete(taskId, col.id)}
                  onMove={handleMove}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-blue-400 p-4 rotate-2 opacity-95 cursor-grabbing">
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{activeTask.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {showModal && (
        <TaskModal boardId={id} task={editingTask} prefill={prefillData}
          onClose={() => { setShowModal(false); setEditingTask(null); setPrefillData(null); }}
          onSaved={handleSaved} />
      )}

      <ActivityPanel boardId={id} open={activityOpen} onClose={() => setActivityOpen(false)} refreshTrigger={activityTick} />
    </div>
  );
}

// ── Droppable column ──────────────────────────────────────────
function DroppableColumn({ col, tasks, hasMore, colLoading, onLoadMore, onEdit, onDelete, onMove }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div ref={setNodeRef}
      className={`rounded-2xl border transition-all ${col.color} ${isOver ? "border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/30" : "border-slate-200 dark:border-slate-700"}`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
          <h2 className="font-bold text-slate-700 dark:text-slate-200 text-sm">{col.label}</h2>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
          {tasks.length}{hasMore ? "+" : ""}
        </span>
      </div>

      {/* Tasks */}
      <div className="p-3 min-h-[5rem]">
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 && !colLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-2xl opacity-30">📭</span>
              <p className="text-xs text-slate-400 dark:text-slate-500">Drop tasks here</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task._id} task={task}
                onEdit={onEdit}
                onDelete={() => onDelete(task._id)}
                onMove={(taskId, newStatus) => onMove(taskId, task.status, newStatus)}
              />
            ))
          )}
        </SortableContext>

        {/* Load more */}
        {hasMore && (
          <button
            onClick={onLoadMore}
            disabled={colLoading}
            className="w-full mt-2 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white/60 dark:bg-slate-700/40 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 transition-all"
          >
            {colLoading ? "Loading…" : "Load more ↓"}
          </button>
        )}
      </div>
    </div>
  );
}
