import React from 'react';

export interface TableWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const TableWrapper: React.FC<TableWrapperProps> = ({ children, className = '' }) => (
  <div
    className={`w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 shadow-sm ${className}`}
  >
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
        {children}
      </table>
    </div>
  </div>
);
