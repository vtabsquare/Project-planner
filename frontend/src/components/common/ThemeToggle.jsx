import React from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ darkMode, onToggle }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onToggle();
      }}
      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center"
      title="Toggle Visual Mode"
    >
      {darkMode ? (
        <Sun className="w-4 h-4 text-amber-500" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600" />
      )}
    </button>
  );
}
