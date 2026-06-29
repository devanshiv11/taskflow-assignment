import { useEffect, useState, useCallback } from "react";
import { getActivity } from "../services/activityService";

const ACTION_CONFIG = {
  created:   { icon: "✅", color: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" },
  updated:   { icon: "✏️", color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" },
  deleted:   { icon: "🗑️", color: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400" },
  moved:     { icon: "↗️", color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400" },
  completed: { icon: "🏁", color: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400" },
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ActivityPanel({ boardId, open, onClose, refreshTrigger }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    try {
      const res = await getActivity(boardId);
      setLogs(res.data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  // Reload whenever panel opens or a task action happens
  useEffect(() => {
    if (open) load();
  }, [open, refreshTrigger, load]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={onClose}
        />
      )}

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 z-40 flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-slate-100">Activity</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              title="Refresh"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              🔄
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-lg leading-none p-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Log list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">No activity yet</p>
              <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Actions on tasks will appear here</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, i) => {
                const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.updated;
                return (
                  <div key={log._id || i} className="flex gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
                    {/* Icon badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{log.detail}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-slate-400 dark:text-slate-500">{timeAgo(log.createdAt)}</span>
                        {log.user?.name && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">{log.user.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-300 dark:text-slate-600 text-center">Last 50 events</p>
        </div>
      </div>
    </>
  );
}
