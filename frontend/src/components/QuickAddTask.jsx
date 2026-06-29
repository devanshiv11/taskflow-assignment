import { useState } from "react";
import toast from "react-hot-toast";
import { parseTask } from "../services/aiService";

export default function QuickAddTask({ onParsed }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await parseTask(input);
      onParsed(res.data);
      if (res.data.fallback) {
        toast("AI unavailable — task pre-filled with defaults", { icon: "⚠️" });
      } else {
        toast.success("AI parsed your task!");
      }
      setInput("");
      setOpen(false);
    } catch {
      toast.error("Failed to parse task");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
        title="Add task using natural language"
      >
        ✨ Quick Add
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl px-3 py-2 w-full sm:w-auto"
    >
      <span className="text-base shrink-0">✨</span>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder='e.g. "fix login bug, high priority, due friday"'
        className="flex-1 min-w-0 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        autoFocus
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !input.trim()}
        className="shrink-0 px-3 py-1 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-xs rounded-lg font-medium transition-colors"
      >
        {loading ? "…" : "Go"}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setInput(""); }}
        className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm"
      >
        ✕
      </button>
    </form>
  );
}
