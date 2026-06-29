import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const PRIORITY_STYLES = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  low: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
};

export default function TaskCard({ task, onEdit, onDelete, onMove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id, data: { status: task.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const moveLabels = { todo: "To Do", "in-progress": "In Progress", done: "Done" };
  const moveOptions = {
    todo: ["in-progress", "done"],
    "in-progress": ["todo", "done"],
    done: ["todo", "in-progress"],
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 mb-3 group hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-2 mb-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none"
          title="Drag to move"
          tabIndex={-1}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="4" cy="3" r="1.2"/><circle cx="10" cy="3" r="1.2"/>
            <circle cx="4" cy="7" r="1.2"/><circle cx="10" cy="7" r="1.2"/>
            <circle cx="4" cy="11" r="1.2"/><circle cx="10" cy="11" r="1.2"/>
          </svg>
        </button>

        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-snug flex-1">
          {task.title}
        </h3>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(task)}
            title="Edit"
            className="text-xs p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >✏️</button>
          <button
            onClick={() => onDelete(task._id)}
            title="Delete"
            className="text-xs p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500"
          >🗑️</button>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2 ml-5">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-2 ml-5">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
        {task.estimatedEffort && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            ⏱ {task.estimatedEffort}
          </span>
        )}
      </div>

      {task.dueDate && (
        <p className={`text-xs mb-2 ml-5 font-medium ${isOverdue ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
          {isOverdue ? "⚠ Overdue · " : "📅 "}{formatDate(task.dueDate)}
        </p>
      )}

      {/* Move buttons — kept as fallback for accessibility */}
      <div className="flex gap-1 mt-2 ml-5 flex-wrap">
        {moveOptions[task.status]?.map((target) => (
          <button
            key={target}
            onClick={() => onMove(task._id, target)}
            className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-400 text-slate-500 dark:text-slate-400 rounded-lg transition-colors"
          >
            → {moveLabels[target]}
          </button>
        ))}
      </div>
    </div>
  );
}
