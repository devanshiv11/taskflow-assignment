import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { updateBoard, deleteBoard } from "../services/boardService";

export default function BoardCard({ board, onDeleted, onUpdated }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [saving, setSaving] = useState(false);

  const handleRename = async (e) => {
    e.stopPropagation();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await updateBoard(board._id, { title });
      onUpdated(res.data);
      setEditing(false);
    } catch {
      toast.error("Failed to rename board");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${board.title}"? All tasks will be removed.`)) return;
    try {
      await deleteBoard(board._id);
      toast.success("Board deleted");
      onDeleted(board._id);
    } catch {
      toast.error("Failed to delete board");
    }
  };

  const createdDate = new Date(board.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div
      onClick={() => !editing && navigate(`/board/${board._id}`)}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow hover:shadow-md transition-shadow p-5 cursor-pointer group relative"
    >
      {editing ? (
        <div onClick={(e) => e.stopPropagation()} className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename(e)}
            className="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button onClick={handleRename} disabled={saving} className="text-sm text-blue-600 font-medium hover:text-blue-800">Save</button>
          <button onClick={() => { setEditing(false); setTitle(board.title); }} className="text-sm text-slate-400 hover:text-slate-600">Cancel</button>
        </div>
      ) : (
        <>
          <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-100 pr-16 truncate">{board.title}</h2>
          {board.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{board.description}</p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Created {createdDate}</p>
          <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); }}
              title="Rename"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 text-sm"
            >✏️</button>
            <button
              onClick={handleDelete}
              title="Delete"
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 text-sm"
            >🗑️</button>
          </div>
        </>
      )}
    </div>
  );
}
