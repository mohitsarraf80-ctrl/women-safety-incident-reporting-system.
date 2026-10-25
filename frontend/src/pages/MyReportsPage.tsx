import { Eye, FilePlus2, FolderOpen, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { incidentApi } from '../api';
import { toApiError } from '../api/client';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState, ErrorState, TableSkeleton } from '../components/common/States';
import type { IncidentDetail, IncidentSummary } from '../types/api';
import { formatDateTime } from '../utils/format';

export default function MyReportsPage() {
  const [reports, setReports] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<IncidentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      setSelected(await incidentApi.detail(id));
    } catch {
      // The list stays usable even if a single detail request fails.
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My reports"
        title="Reports linked to your account"
        description="Anonymous reports are never linked to an identity, so they do not appear here. Use the tracking page for those."
        actions={
          <Link to="/report">
            <Button icon={<FilePlus2 className="h-4 w-4" />}>New report</Button>
          </Link>
        }
      />

      <Card>
        <CardHeader
          title={`${reports.length} ${reports.length === 1 ? 'report' : 'reports'}`}
          description="Newest first. Open a report to see its status history."
        />
        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : error ? (
          <CardBody><ErrorState message={error} onRetry={load} /></CardBody>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Nothing here yet"
            description="Submit a report while signed in and it will appear in this list with its full status history."
            action={<Link to="/report"><Button size="sm">Report an incident</Button></Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Report</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Priority</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-900">{report.reportId}</td>
                    <td className="px-5 py-3 text-slate-700">{report.typeLabel}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{formatDateTime(report.submittedAt)}</td>
                    <td className="px-5 py-3"><PriorityBadge priority={report.priority} /></td>
                    <td className="px-5 py-3"><StatusBadge status={report.status} label={report.statusLabel} /></td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(report.id)} icon={<Eye className="h-4 w-4" />}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(selected) || detailLoading}
        onClose={() => setSelected(null)}
        title={selected ? `Report ${selected.reportId}` : 'Loading report…'}
        description={selected ? `${selected.typeLabel} · ${selected.zoneName ?? 'Location not specified'}` : undefined}
        size="lg"
      >
        {selected ? (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status} label={selected.statusLabel} />
              <PriorityBadge priority={selected.priority} />
              <span className="text-xs text-slate-500">Score {selected.severityScore}/100</span>
              {selected.escalated ? <span className="text-xs font-semibold text-red-600">Manually escalated</span> : null}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Description</p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-700">{selected.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Incident time</p>
                <p className="mt-1 text-slate-700">{formatDateTime(selected.occurredAt)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Location</p>
                <p className="mt-1 flex items-center gap-1.5 text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {selected.zoneName ?? 'Not provided'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Status history</p>
              <ol className="mt-2 space-y-3 border-l border-slate-200 pl-4">
                {selected.history.map((event, index) => (
                  <li key={`${event.status}-${index}`}>
                    <p className="text-sm font-medium text-slate-900">{event.statusLabel}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(event.changedAt)} · {event.actorLabel}</p>
                    {event.note ? <p className="mt-0.5 text-xs text-slate-600">{event.note}</p> : null}
                  </li>
                ))}
              </ol>
            </div>

            {selected.responder ? (
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                Assigned to <span className="font-semibold text-slate-900">{selected.responder.displayName}</span> (
                {selected.responder.organisation})
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Loading…</p>
        )}
      </Modal>
    </div>
  );
}
