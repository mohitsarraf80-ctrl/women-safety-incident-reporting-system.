import { AlertCircle, Inbox, Loader2, RefreshCw, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-600', className)} aria-hidden />;
}

export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-3 text-sm text-slate-500">
      <Spinner className="h-7 w-7" />
      <p>{label}…</p>
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 px-6 py-10 text-center">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 max-w-md text-sm text-slate-600">
          {message ?? 'The request could not be completed. Please try again.'}
        </p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" />}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description ? <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden">
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-5 py-4">
            {Array.from({ length: columns }).map((__, columnIndex) => (
              <div
                key={columnIndex}
                className={cn(
                  'h-4 animate-pulse rounded bg-slate-100',
                  columnIndex === 0 ? 'w-24' : columnIndex === columns - 1 ? 'w-16' : 'flex-1',
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
