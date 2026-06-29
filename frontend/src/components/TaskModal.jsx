import { useState } from "react";
import toast from "react-hot-toast";
import { createTask, updateTask } from "../services/taskService";
import { suggestEstimate } from "../services/aiService";

const STATUSES = ["todo", "in-progress", "done"];
const PRIORITIES = ["low", "medium", "high"];

const inputCls = "w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

export default function TaskModal({ boardId, task, prefill, onClose, onSaved }) {
  const isEditing = !!task;

  // prefill from AI quick-add takes priority over blank defaults
  const init = prefill || {};

  const [title, setTitle] = useState(task?.title || init.title || "");
  const [description, setDescription] = useState(task?.description || init.description || "");
  const [status, setStatus] = useState(task?.status || init.status || "todo");
  const [priority, setPriority] = useState(task?.priority || init.priority || "medium");
  const [dueDate, setDueDate] = useState(
    task?.dueDate
      ? new Date(task.dueDate).toISOString().split("T")[0]
      : init.dueDate || ""
  );
  const [effort, setEffort] = useState(task?.estimatedEffort || init.estimatedEffort || "");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const handleSuggest = async () => {
    if (!title.trim()) { toast.error("Enter a title first so AI has something to work with"); return; }
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const res = await suggestEstimate(title, description);
      setAiSuggestion(res.data);
    } catch {
      toast.error("AI service unavailable – try again");
    } finally {
      setAiLoading(false);
    }
  };

  const acceptSuggestion = () => {
    if (!aiSuggestion) return;
    const effortLabel = aiSuggestion.effortHours
      ? `${aiSuggestion.effort} (~${aiSuggestion.effortHours}h)`
      : aiSuggestion.effort;
    setEffort(effortLabel);
    if (aiSuggestion.suggestedDueDate) setDueDate(aiSuggestion.suggestedDueDate);
    setAiSuggestion(null);
    toast.success("Suggestion applied!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const payload = { title, description, status, priority, dueDate: dueDate || null, estimatedEffort: effort, board: boardId };
    try {
      const res = isEditing ? await updateTask(task._id, payload) : await createTask(payload);
      toast.success(isEditing ? "Task updated!" : "Task created!");
      onSaved(res.data, isEditing);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
          {isEditing ? "Edit Task" : "New Task"}
        </h2>
        {prefill && !isEditing && (
          <p className="text-xs text-violet-600 dark:text-violet-400 mb-4 flex items-center gap-1">
            ✨ Pre-filled by AI — review and adjust before saving
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className={labelCls}>Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" className={inputCls} autoFocus />
          </div>

          <div className="mb-4">
            <label className={labelCls}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details…" rows={2} className={`${inputCls} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s === "todo" ? "To Do" : s === "in-progress" ? "In Progress" : "Done"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Effort</label>
              <input type="text" value={effort} onChange={(e) => setEffort(e.target.value)} placeholder="e.g. M (~4h)" className={inputCls} />
            </div>
          </div>

          {/* AI Suggest */}
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">✨ AI Estimate</span>
              <button
                type="button"
                onClick={handleSuggest}
                disabled={aiLoading}
                className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
              >
                {aiLoading ? "Thinking…" : "Suggest estimate"}
              </button>
            </div>
            {aiSuggestion && (
              <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-blue-100 dark:border-blue-900">
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">
                  <strong>Effort:</strong> {aiSuggestion.effort}{aiSuggestion.effortHours ? ` (~${aiSuggestion.effortHours}h)` : ""}
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">
                  <strong>Suggested due:</strong> {aiSuggestion.suggestedDueDate}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 italic">{aiSuggestion.reasoning}</p>
                {aiSuggestion.fallback && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">⚠ Using fallback — configure GEMINI_API_KEY for smart estimates</p>
                )}
                <button type="button" onClick={acceptSuggestion} className="text-sm px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                  Accept suggestion
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors">
              {saving ? "Saving…" : isEditing ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
