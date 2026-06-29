import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import BoardCard from "../components/BoardCard";
import CreateBoardModal from "../components/CreateBoardModal";
import { getBoards } from "../services/boardService";
import { getAnalytics } from "../services/analyticsService";
import { useAuth } from "../context/AuthContext";

function StatPill({ icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl px-5 py-4 shadow-sm border border-slate-100 dark:border-slate-700`}>
      <span className={`text-2xl w-10 h-10 flex items-center justify-center rounded-xl ${color}`}>{icon}</span>
      <div>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    Promise.all([getBoards(), getAnalytics()])
      .then(([boardsRes, statsRes]) => {
        setBoards(boardsRes.data);
        setStats(statsRes.data);
      })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (b) => { setBoards((p) => [b, ...p]); setShowModal(false); };
  const handleDeleted = (id) => setBoards((p) => p.filter((b) => b._id !== id));
  const handleUpdated = (u) => setBoards((p) => p.map((b) => b._id === u._id ? u : b));

  const completionRate = stats?.totalTasks > 0
    ? Math.round((stats.byStatus?.find((s) => s.name === "Done")?.value / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Greeting hero */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-3xl p-8 mb-8 shadow-lg">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute -bottom-14 -right-4 w-36 h-36 bg-white/5 rounded-full" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-blue-200 text-sm font-medium mb-1">{getGreeting()},</p>
              <h1 className="text-3xl font-extrabold text-white">{user?.name || "there"} 👋</h1>
              <p className="text-blue-100 mt-2 text-sm">
                {boards.length === 0
                  ? "Create your first board to get started."
                  : `You have ${boards.length} board${boards.length !== 1 ? "s" : ""} · ${stats?.totalTasks || 0} tasks total`}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="shrink-0 flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-md hover:shadow-lg"
            >
              <span className="text-lg leading-none">+</span> New Board
            </button>
          </div>
        </div>

        {/* Stats row */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[1,2,3,4].map((i) => <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-20 animate-pulse shadow-sm" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatPill icon="📋" label="Total Boards"  value={stats.totalBoards}  color="bg-blue-100 dark:bg-blue-900/40" />
            <StatPill icon="✅" label="Total Tasks"   value={stats.totalTasks}   color="bg-green-100 dark:bg-green-900/40" />
            <StatPill icon="🏁" label="Completed"     value={`${completionRate}%`} color="bg-purple-100 dark:bg-purple-900/40" />
            <StatPill icon="⚠️" label="Overdue"       value={stats.overdueCount} color={stats.overdueCount > 0 ? "bg-red-100 dark:bg-red-900/40" : "bg-slate-100 dark:bg-slate-700"} />
          </div>
        )}

        {/* Board section header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">
            {boards.length > 0 ? "Your Boards" : ""}
          </h2>
        </div>

        {/* Board grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 h-32 animate-pulse shadow-sm" />
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-24 bg-white/70 dark:bg-slate-800/40 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-6xl mb-4">🗂️</p>
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">No boards yet</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Create your first board to start organizing tasks.</p>
            <button onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md text-sm">
              Create your first board
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <BoardCard key={board._id} board={board} onDeleted={handleDeleted} onUpdated={handleUpdated} />
            ))}
            {/* Add board card */}
            <button
              onClick={() => setShowModal(true)}
              className="flex flex-col items-center justify-center gap-2 bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl p-5 h-32 transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">➕</span>
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400">New Board</span>
            </button>
          </div>
        )}
      </main>

      {showModal && <CreateBoardModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  );
}
