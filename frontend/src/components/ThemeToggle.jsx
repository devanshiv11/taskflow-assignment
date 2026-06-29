import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle dark mode"
      className={`relative inline-flex items-center w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
        dark ? "bg-blue-600" : "bg-slate-300"
      }`}
    >
      {/* 🌙 left side, ☀️ right side */}
      <span className="absolute left-1 text-[11px] select-none pointer-events-none">🌙</span>
      <span className="absolute right-1 text-[11px] select-none pointer-events-none">☀️</span>

      {/* Thumb: left=2px for dark (covers 🌙), right=2px for light (covers ☀️) */}
      <span
        className={`absolute top-0.5 bottom-0.5 w-6 bg-white rounded-full shadow-md transition-all duration-300 ${
          dark ? "left-0.5" : "left-[calc(100%-1.625rem)]"
        }`}
      />
    </button>
  );
}
