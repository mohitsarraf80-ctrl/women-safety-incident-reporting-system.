const dateTime = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
});

const dateOnly = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return `${dateTime.format(parsed)} IST`;
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return dateOnly.format(parsed);
}

export function formatTime(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

export function relativeTime(value?: string | null): string {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return formatDate(value);
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function titleCase(value?: string | null): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Value for an <input type="datetime-local"> using the browser's local clock. */
export function toDateTimeLocalValue(date = new Date()): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

/** ISO strings for the API from a datetime-local value. */
export function toIso(value: string): string {
  return new Date(value).toISOString();
}

/** ISO boundary for a date input (start of day / end of day, local time). */
export function dayBoundaryIso(date: string, endOfDay = false): string {
  const parsed = new Date(`${date}T${endOfDay ? '23:59:59' : '00:00:00'}`);
  return parsed.toISOString();
}

export function formatHours(hours: number): string {
  if (!hours || hours <= 0) return '0 h';
  if (hours < 24) return `${hours.toFixed(1)} h`;
  const days = Math.floor(hours / 24);
  const remaining = Math.round(hours % 24);
  return `${days} d ${remaining} h`;
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
