import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 flex items-center gap-4">
      {/* Logo */}
      <Link to="/dashboard" className="text-xl font-bold text-blue-600 tracking-tight shrink-0">
        TaskFlow
      </Link>

      {/* Search — grows to fill middle */}
      {user && (
        <div className="flex-1 hidden sm:flex justify-center">
          <SearchBar />
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto shrink-0">
        <Link
          to="/analytics"
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors hidden sm:block"
        >
          Analytics
        </Link>
        {user && (
          <span className="text-sm text-slate-500 dark:text-slate-400 hidden md:block">
            Hi, <span className="font-medium text-slate-700 dark:text-slate-200">{user.name}</span>
          </span>
        )}
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
