import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-center items-start w-1/2 px-16 bg-blue-600 dark:bg-blue-700">
        <div className="text-white">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">TaskFlow</h1>
          <p className="text-blue-100 text-xl mb-8 max-w-sm leading-relaxed">
            Smart task management with AI-powered estimates and drag-and-drop boards.
          </p>
          <div className="space-y-3 text-blue-100 text-sm">
            <div className="flex items-center gap-2">✅ <span>Kanban boards with drag & drop</span></div>
            <div className="flex items-center gap-2">✨ <span>AI-powered task estimates</span></div>
            <div className="flex items-center gap-2">📊 <span>Analytics dashboard</span></div>
            <div className="flex items-center gap-2">🔍 <span>Global task search</span></div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col justify-center items-center flex-1 px-6 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <h1 className="text-4xl font-extrabold text-blue-600">TaskFlow</h1>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Welcome back</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Sign in to your workspace</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                <input type="email" placeholder="you@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" required />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <input type="password" placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-bold transition-all shadow-sm hover:shadow-md">
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <p className="text-center mt-6 text-slate-600 dark:text-slate-400 text-sm">
              No account?{" "}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
