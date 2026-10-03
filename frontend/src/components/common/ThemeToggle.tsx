import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
      className={`inline-flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 shadow-sm ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-400" aria-hidden="true" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-600" aria-hidden="true" />
      )}
    </button>
  );
};
