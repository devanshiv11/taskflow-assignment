import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 text-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <p className="text-8xl font-bold text-blue-600 mb-4">404</p>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Page not found</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">That page doesn't exist or was moved.</p>
      <Link
        to="/dashboard"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
