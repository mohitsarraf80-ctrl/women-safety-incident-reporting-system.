import {
  ArrowRight,
  BellRing,
  ClipboardList,
  FilePlus2,
  FolderOpen,
  KeyRound,
  LifeBuoy,
  MapPin,
  SearchCheck,
  ShieldCheck,
  Siren,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { incidentApi } from '../api';
import { toApiError } from '../api/client';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState, ErrorState, TableSkeleton } from '../components/common/States';
import { StatCard } from '../components/common/StatCard';
import { useAuth } from '../context/AuthContext';
import type { IncidentSummary } from '../types/api';
import { formatDateTime, relativeTime } from '../utils/format';

const quickActions = [
  { to: '/report', label: 'Report an incident', description: 'Anonymous or from your account', icon: FilePlus2, tone: 'brand' as const },
  { to: '/sos', label: 'Emergency SOS', description: 'Record an urgent alert', icon: Siren, tone: 'red' as const },
  { to: '/track', label: 'Track a report', description: 'Use a Report ID and code', icon: SearchCheck, tone: 'teal' as const },
  { to: '/my-reports', label: 'My reports', description: 'Everything linked to your account', icon: FolderOpen, tone: 'slate' as const },
];

export default function CitizenDashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    incidentApi
      .myReports()
      .then(setReports)
      .catch((problem) => setError(toApiError(problem).detail ?? 'Could not load your reports.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const open = reports.filter((report) => !['RESOLVED', 'CLOSED'].includes(report.status)).length;
  const critical = reports.filter((report) => report.priority === 'CRITICAL').length;
  const latest = reports[0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Citizen dashboard"
        title={`Welcome, ${user?.displayName ?? 'there'}`}
        description="Report an incident, follow a case, or check what happened to a report you already submitted."
        actions={
          <Link to="/report">
            <Button icon={<FilePlus2 className="h-4 w-4" />}>Report an incident</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
          >
            <span
              className={[
                'flex h-10 w-10 items-center justify-center rounded-xl',
                action.tone === 'red' ? 'bg-red-50 text-red-600' : action.tone === 'teal' ? 'bg-accent-50 text-accent-700' : action.tone === 'slate' ? 'bg-slate-100 text-slate-600' : 'bg-brand-50 text-brand-700',
              ].join(' ')}
            >
              <action.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-slate-900">
              {action.label}
              <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{action.description}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My reports" value={reports.length} icon={ClipboardList} loading={loading} />
        <StatCard label="Open cases" value={open} icon={BellRing} tone="amber" loading={loading} hint="Not resolved or closed" />
        <StatCard label="Critical priority" value={critical} icon={ShieldCheck} tone="red" loading={loading} />
        <StatCard
          label="Latest update"
          value={latest ? relativeTime(latest.updatedAt) : '—'}
          icon={MapPin}
          tone="teal"
          loading={loading}
          hint={latest ? latest.reportId : 'No reports yet'}
        />
      </div>

      <Card>
        <CardHeader
          title="Your recent reports"
          description="Only reports linked to your account are shown. Anonymous reports are not listed here."
          actions={
            <Link to="/my-reports">
              <Button variant="outline" size="sm">View all</Button>
            </Link>
          }
        />
        {loading ? (
          <TableSkeleton rows={3} columns={4} />
        ) : error ? (
          <CardBody>
            <ErrorState message={error} onRetry={load} />
          </CardBody>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No reports linked to your account"
            description="Reports you submit while signed in will appear here. Anonymous reports are intentionally not linked to your identity."
            action={
              <Link to="/report">
                <Button size="sm" icon={<FilePlus2 className="h-4 w-4" />}>Report an incident</Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {reports.slice(0, 4).map((report) => (
              <li key={report.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-semibold text-slate-900">{report.reportId}</p>
                    <StatusBadge status={report.status} label={report.statusLabel} />
                    <PriorityBadge priority={report.priority} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {report.typeLabel} · {report.zoneName ?? 'Location not specified'} · {formatDateTime(report.submittedAt)}
                  </p>
                </div>
                <Link to="/my-reports" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
                  Details →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Keep your tracking code safe" />
          <CardBody className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="flex gap-2">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              The tracking code is shown only once, right after submission, and is stored as a BCrypt hash. Save it in
              a password manager if you want to track the case later.
            </p>
            <p className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              Anyone with both the Report ID and the code can view the status page, so treat the pair as a password.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="When to use SOS" />
          <CardBody className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="flex gap-2">
              <Siren className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              SOS records an urgent alert for the safety desk with your location if you allow it. In immediate danger,
              call local emergency services first.
            </p>
            <p className="flex gap-2">
              <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              This is a college prototype: no police, ambulance or NGO is notified automatically.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
