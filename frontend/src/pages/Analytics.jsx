import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import Navbar from "../components/Navbar";
import { getAnalytics } from "../services/analyticsService";

const STATUS_COLORS  = ["#94a3b8", "#3b82f6", "#22c55e"];
const PRIORITY_COLORS = ["#ef4444", "#f59e0b", "#22c55e"];

function StatCard({ label, value, sub, color = "text-slate-800 dark:text-slate-100" }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 flex flex-col gap-1">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then((res) => setData(res.data))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 h-24 animate-pulse" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 h-72 animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const completionRate = data.totalTasks > 0
    ? Math.round((data.byStatus.find((s) => s.name === "Done")?.value / data.totalTasks) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Analytics</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Tasks"   value={data.totalTasks}   sub="across all boards" />
          <StatCard label="Total Boards"  value={data.totalBoards}  />
          <StatCard label="Completion"    value={`${completionRate}%`} sub="tasks done" color="text-green-600 dark:text-green-400" />
          <StatCard
            label="Overdue"
            value={data.overdueCount}
            sub="need attention"
            color={data.overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-100"}
          />
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Tasks by Status — Pie */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Tasks by Status</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                  {data.byStatus.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Tasks by Priority — Pie */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Tasks by Priority</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.byPriority} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                  {data.byPriority.map((_, i) => <Cell key={i} fill={PRIORITY_COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Tasks per Board — Bar (spans full width) */}
          {data.perBoard.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 md:col-span-2">
              <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Tasks per Board</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.perBoard} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total"     fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="done"  name="Completed" fill="#22c55e" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>

        {/* Empty state */}
        {data.totalTasks === 0 && (
          <div className="text-center py-16 mt-4">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-slate-500 dark:text-slate-400">No tasks yet — create some tasks to see analytics.</p>
          </div>
        )}
      </main>
    </div>
  );
}
