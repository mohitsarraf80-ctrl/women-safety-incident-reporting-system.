import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

const tones = {
  brand: 'bg-brand-50 text-brand-700',
  teal: 'bg-accent-50 text-accent-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  slate: 'bg-slate-100 text-slate-600',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'brand',
  loading,
  footer,
}: {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  hint?: ReactNode;
  tone?: keyof typeof tones;
  loading?: boolean;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          {loading ? (
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          )}
          {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
        </div>
        {Icon ? (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      {footer ? <div className="mt-3 border-t border-slate-100 pt-3">{footer}</div> : null}
    </div>
  );
}
