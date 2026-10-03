import React from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
}) => (
  <div
    className={`rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 backdrop-blur-md shadow-sm p-6 transition-all ${className}`}
  >
    {(title || action) && (
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-700/40">
        <div>
          {title && (
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </div>
);
