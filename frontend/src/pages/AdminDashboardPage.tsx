import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock,
  Flame,
  MapPinned,
  RefreshCw,
  ShieldAlert,
  Siren,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api';
import { toApiError } from '../api/client';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState, ErrorState, TableSkeleton } from '../components/common/States';
import { StatCard } from '../components/common/StatCard';
import { useToast } from '../components/common/Toast';
import type { DashboardSummary, IncidentSummary } from '../types/api';
import { PRIORITIES, PRIORITY_CHART_COLORS, PRIORITY_DOT, STATUSES } from '../utils/constants';
import { cn } from '../utils/cn';
import { formatDateTime, relativeTime } from '../utils/format';

export default function AdminDashboardPage() {
  const toast = useToast();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recent, setRecent] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [dashboard, incidents] = await Promise.all([
        adminApi.summary(),
        adminApi.incidents({ size: 6, sort: 'severity', direction: 'desc' }),
      ]);
      setSummary(dashboard);
      setRecent(incidents.content);
    } catch (problem) {
      const message = toApiError(problem).detail ?? 'The dashboard could not be loaded.';
      setError(message);
      if (silent) toast.error('Refresh failed', message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(true), 30000);
    return () => window.clearInterval(interval);
  }, [load]);

  const totalPriority = summary ? Object.values(summary.priorityBreakdown).reduce((sum, value) => sum + value, 0) : 0;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Safety operations"
        title="Dashboard"
        description="Live counts from MySQL. The queue is ordered by severity, and an administrator can always escalate a case manually."
        actions={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Auto-refresh 30s
            </span>
            <Button variant="outline" size="sm" onClick={() => void load(true)} icon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
          </>
        }
      />

      {error && !summary ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total incidents" value={summary?.totalIncidents ?? 0} icon={TrendingUp} loading={loading} />
            <StatCard label="Received today" value={summary?.todayIncidents ?? 0} icon={Clock} tone="teal" loading={loading} />
            <StatCard label="Pending review" value={summary?.pendingIncidents ?? 0} icon={BellRing} tone="amber" loading={loading} hint="Submitted or under review" />
            <StatCard label="Critical priority" value={summary?.criticalIncidents ?? 0} icon={Flame} tone="red" loading={loading} hint="Includes manual escalations" />
            <StatCard label="Active SOS alerts" value={summary?.activeSosAlerts ?? 0} icon={Siren} tone="red" loading={loading} hint="SOS cases still open" />
            <StatCard label="Hotspots (30 days)" value={summary?.hotspotsDetected ?? 0} icon={MapPinned} tone="brand" loading={loading} hint="Mean + 1 SD threshold" />
            <StatCard label="Resolved" value={summary?.resolvedIncidents ?? 0} icon={CheckCircle2} tone="teal" loading={loading} hint="Resolved or closed" />
            <StatCard label="Failed alerts" value={summary?.failedAlerts ?? 0} icon={AlertTriangle} tone="amber" loading={loading} hint="Needs a delivery retry" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader title="Priority mix" description="Severity bands across all stored incidents." />
              <CardBody className="space-y-4">
                {PRIORITIES.map((priority) => {
                  const value = summary?.priorityBreakdown[priority.value] ?? 0;
                  const percent = totalPriority ? Math.round((value / totalPriority) * 100) : 0;
                  return (
                    <div key={priority.value}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[priority.value])} />
                          {priority.label}
                          <span className="text-slate-400">({priority.range})</span>
                        </span>
                        <span className="font-semibold text-slate-900">{value}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percent}%`, backgroundColor: PRIORITY_CHART_COLORS[priority.value] }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="pt-1 text-xs text-slate-500">
                  {totalPriority === 0
                    ? 'No incidents stored yet. Seed the dev database or submit a report to see live data.'
                    : `${totalPriority} incidents grouped by computed priority.`}
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Case pipeline" description="Current status of every incident." />
              <CardBody>
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.map((status) => (
                    <div key={status.value} className="rounded-xl border border-slate-200 p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{status.label}</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">
                        {summary?.statusBreakdown[status.value] ?? 0}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <ShieldAlert className="h-3.5 w-3.5" /> Manual escalation is always available
                  </p>
                  A low severity score never prevents an administrator from raising a case to CRITICAL.
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Most urgent open reports"
              description="Ordered by severity score, then submission time."
              actions={
                <Link to="/admin/incidents">
                  <Button variant="outline" size="sm">Open incident queue</Button>
                </Link>
              }
            />
            {loading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : recent.length === 0 ? (
              <EmptyState
                icon={ShieldAlert}
                title="No incidents yet"
                description="The database is empty. Submit a report or enable the dev seeder to populate the demonstration dataset."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Report</th>
                      <th className="px-5 py-3 font-medium">Category</th>
                      <th className="px-5 py-3 font-medium">Zone</th>
                      <th className="px-5 py-3 font-medium">Priority</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recent.map((incident) => (
                      <tr key={incident.id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-3">
                          <Link to={`/admin/incidents/${incident.id}`} className="font-mono text-xs font-semibold text-brand-700 hover:text-brand-800">
                            {incident.reportId}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-slate-700">{incident.typeLabel}</td>
                        <td className="px-5 py-3 text-slate-500">{incident.zoneName ?? '—'}</td>
                        <td className="px-5 py-3"><PriorityBadge priority={incident.priority} /></td>
                        <td className="px-5 py-3"><StatusBadge status={incident.status} label={incident.statusLabel} /></td>
                        <td className="px-5 py-3 text-xs text-slate-500" title={formatDateTime(incident.submittedAt)}>
                          {relativeTime(incident.submittedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {summary ? (
              <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
                Generated {formatDateTime(summary.generatedAt)} · unassigned active cases: {summary.unassignedActive}
              </div>
            ) : null}
          </Card>
        </>
      )}
    </div>
  );
}
