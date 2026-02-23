'use client';

import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, actions, children, className = '' }: CardProps) {
  return (
    <section
      className={`flex flex-col gap-4 rounded-3xl border border-zinc-100 bg-white px-6 py-5 shadow-sm shadow-zinc-200 backdrop-blur transition-colors duration-150 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20 ${className}`}
    >
      {(title || actions) && (
        <header className="flex flex-row items-center justify-between gap-3">
          {title && <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</p>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
