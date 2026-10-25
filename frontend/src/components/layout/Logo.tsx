import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

export function Logo({
  variant = 'dark',
  className,
  compact = false,
}: {
  variant?: 'dark' | 'light';
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link to="/" className={cn('flex items-center gap-2.5', className)} aria-label="Women Safety home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
        <ShieldCheck className="h-5 w-5" />
      </span>
      {!compact ? (
        <span className="leading-tight">
          <span
            className={cn(
              'block text-sm font-semibold tracking-tight',
              variant === 'dark' ? 'text-white' : 'text-slate-900',
            )}
          >
            Women Safety
          </span>
          <span
            className={cn(
              'block text-[10px] font-medium uppercase tracking-[0.14em]',
              variant === 'dark' ? 'text-slate-400' : 'text-slate-500',
            )}
          >
            Incident Reporting
          </span>
        </span>
      ) : null}
    </Link>
  );
}
