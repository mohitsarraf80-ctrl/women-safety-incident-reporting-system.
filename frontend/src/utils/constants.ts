import type {
  AlertStatus,
  IncidentStatus,
  IncidentType,
  PriorityLevel,
  ResponderAvailability,
} from '../types/api';

export const INCIDENT_TYPES: {
  value: IncidentType;
  label: string;
  baseScore: number;
  description: string;
}[] = [
  {
    value: 'VERBAL_HARASSMENT',
    label: 'Verbal harassment',
    baseScore: 20,
    description: 'Comments, gestures, threats or verbal abuse.',
  },
  {
    value: 'CYBER_HARASSMENT',
    label: 'Cyber harassment',
    baseScore: 30,
    description: 'Online abuse, stalking or sharing private information.',
  },
  {
    value: 'STALKING',
    label: 'Stalking',
    baseScore: 35,
    description: 'Being followed, watched or repeatedly contacted.',
  },
  {
    value: 'ASSAULT',
    label: 'Assault',
    baseScore: 60,
    description: 'Physical violence or an attempt to cause harm.',
  },
  {
    value: 'SEXUAL_ASSAULT',
    label: 'Sexual assault',
    baseScore: 80,
    description: 'Any unwanted sexual act or contact.',
  },
  {
    value: 'OTHER',
    label: 'Other safety concern',
    baseScore: 20,
    description: 'Poor lighting, unsafe routes or another concern.',
  },
];

export const PRIORITIES: { value: PriorityLevel; label: string; range: string }[] = [
  { value: 'LOW', label: 'Low', range: 'score below 30' },
  { value: 'MEDIUM', label: 'Medium', range: 'score 30-49' },
  { value: 'HIGH', label: 'High', range: 'score 50-69' },
  { value: 'CRITICAL', label: 'Critical', range: 'score 70-100' },
];

export const STATUSES: { value: IncidentStatus; label: string }[] = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

export const PRIORITY_STYLES: Record<PriorityLevel, string> = {
  LOW: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  MEDIUM: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  HIGH: 'bg-orange-50 text-orange-800 ring-orange-600/25',
  CRITICAL: 'bg-red-50 text-red-700 ring-red-600/25',
};

export const PRIORITY_DOT: Record<PriorityLevel, string> = {
  LOW: 'bg-emerald-500',
  MEDIUM: 'bg-amber-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-600',
};

export const PRIORITY_CHART_COLORS: Record<PriorityLevel, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#dc2626',
};

export const STATUS_STYLES: Record<IncidentStatus, string> = {
  SUBMITTED: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  UNDER_REVIEW: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  ASSIGNED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  IN_PROGRESS: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  RESOLVED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  CLOSED: 'bg-slate-100 text-slate-500 ring-slate-500/20',
};

export const AVAILABILITY_STYLES: Record<ResponderAvailability, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  BUSY: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  UNAVAILABLE: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export const ALERT_STATUS_STYLES: Record<AlertStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  SENT: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  FAILED: 'bg-red-50 text-red-700 ring-red-600/25',
  SIMULATED: 'bg-sky-50 text-sky-700 ring-sky-600/20',
};

export const CHART_PALETTE = ['#4f46e5', '#0d9488', '#f59e0b', '#dc2626', '#7c3aed', '#64748b'];

export const DEMO_ACCOUNTS = [
  { role: 'Administrator', email: 'admin@demo.local' },
  { role: 'Responder', email: 'responder@demo.local' },
  { role: 'Citizen', email: 'citizen@demo.local' },
];

export const DEMO_PASSWORD = 'Demo@12345';
export const DEMO_TRACKING_CODE = 'DEMO-TRACK-2026';
