import type { ReactNode } from 'react';
import type { AlertStatus, IncidentStatus, PriorityLevel, ResponderAvailability } from '../../types/api';
import {
  ALERT_STATUS_STYLES,
  AVAILABILITY_STYLES,
  PRIORITY_DOT,
  PRIORITY_STYLES,
  STATUS_STYLES,
} from '../../utils/constants';
import { cn } from '../../utils/cn';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand';

const tones: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  danger: 'bg-red-50 text-red-700 ring-red-600/25',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset',
        PRIORITY_STYLES[priority],
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[priority])} aria-hidden />
      {priority}
    </span>
  );
}

export function StatusBadge({ status, label }: { status: IncidentStatus; label?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        STATUS_STYLES[status],
      )}
    >
      {label ?? status.replace('_', ' ').toLowerCase()}
    </span>
  );
}

export function AvailabilityBadge({ availability }: { availability: ResponderAvailability }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        AVAILABILITY_STYLES[availability],
      )}
    >
      {availability.charAt(0) + availability.slice(1).toLowerCase()}
    </span>
  );
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        ALERT_STATUS_STYLES[status],
      )}
    >
      {status === 'SIMULATED' ? 'Simulated' : status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
