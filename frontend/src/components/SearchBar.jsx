import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { searchTasks } from "../services/taskService";

const STATUS_LABEL = { todo: "To Do", "in-progress": "In Progress", done: "Done" };
const PRIORITY_COLOR = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  low: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
};

function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSearch = useCallback(async (q, priority, status) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const filters = {};
      if (priority !== "all") filters.priority = priority;
      if (status !== "all") filters.status = status;
      const res = await searchTasks(q, filters);
      setResults(res.data);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useDebounce(doSearch, 350);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    debouncedSearch(val, filterPriority, filterStatus);
  };

  const handleFilterChange = (priority, status) => {
    setFilterPriority(priority);
    setFilterStatus(status);
    if (query.trim()) doSearch(query, priority, status);
  };

  const handleSelect = (task) => {
    navigate(`/board/${task.board._id}`);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") { setOpen(false); setQuery(""); }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-sm">
      {/* Search input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">🔍</span>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search tasks…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 animate-pulse">…</span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-2 w-full min-w-[22rem] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">

          {/* Filters */}
          <div className="flex gap-2 p-3 border-b border-slate-100 dark:border-slate-700">
            <select
              value={filterPriority}
              onChange={(e) => handleFilterChange(e.target.value, filterStatus)}
              className="flex-1 text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange(filterPriority, e.target.value)}
              className="flex-1 text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">No tasks found</p>
            ) : (
              results.map((task) => (
                <button
                  key={task._id}
                  onClick={() => handleSelect(task)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-50 dark:border-slate-700/50 last:border-0 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{task.description}</p>
                      )}
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate">
                        📋 {task.board?.title}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {STATUS_LABEL[task.status]}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {results.length > 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2 border-t border-slate-100 dark:border-slate-700">
              {results.length} result{results.length !== 1 ? "s" : ""} — click to open board
            </p>
          )}
        </div>
      )}
    </div>
  );
}
