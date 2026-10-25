import { Building2, ClipboardList, RefreshCw, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { responderApi } from '../api';
import { toApiError } from '../api/client';
import { AvailabilityBadge, PriorityBadge, StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Field, Select, Textarea } from '../components/common/Field';
import { Modal } from '../components/common/Modal';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState, ErrorState, TableSkeleton } from '../components/common/States';
import { StatCard } from '../components/common/StatCard';
import { useToast } from '../components/common/Toast';
import type { IncidentDetail, IncidentStatus, IncidentSummary, Responder } from '../types/api';
import { formatDateTime } from '../utils/format';

export default function ResponderQueuePage() {
  const toast = useToast();
  const [profile, setProfile] = useState<Responder | null>(null);
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<IncidentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [nextStatus, setNextStatus] = useState<IncidentStatus | ''>('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [responderProfile, page] = await Promise.all([
        responderApi.profile(),
        responderApi.incidents(0, 50),
      ]);
      setProfile(responderProfile);
      setIncidents(page.content);
    } catch (problem) {
      setError(toApiError(problem).detail ?? 'The responder queue could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openIncident = async (id: number) => {
    setDetailLoading(true);
    try {
      const detail = await responderApi.incident(id);
      setSelected(detail);
      setNextStatus(detail.allowedNextStatuses[0] ?? '');
      setNote('');
    } catch (problem) {
      toast.error('Could not open case', toApiError(problem).detail ?? 'The case could not be loaded.');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!selected || !nextStatus) return;
    setSaving(true);
    try {
      const updated = await responderApi.updateStatus(selected.id, nextStatus, note.trim() || undefined);
      setSelected(updated);
      setIncidents((current) =>
        current.map((item) =>
          item.id === updated.id
            ? { ...item, status: updated.status, statusLabel: updated.statusLabel, updatedAt: updated.updatedAt }
            : item,
        ),
      );
      setNote('');
      toast.success('Status updated', `Case ${updated.reportId} is now ${updated.statusLabel}.`);
    } catch (problem) {
      toast.error('Update rejected', toApiError(problem).detail ?? 'The status transition was not allowed.');
    } finally {
      setSaving(false);
    }
  };

  const active = incidents.filter((incident) => ['ASSIGNED', 'IN_PROGRESS'].includes(incident.status)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Responder portal"
        title={profile ? profile.displayName : 'Assigned cases'}
        description="You can view and update only the cases assigned to your responder profile."
        actions={<Button variant="outline" size="sm" onClick={() => void load()} icon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>}
      />

      {loading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Active cases" value={active} icon={ClipboardList} tone="brand" />
            <StatCard label="Total assigned" value={profile?.totalAssignments ?? incidents.length} icon={ShieldCheck} tone="teal" />
            <StatCard
              label="Availability"
              value={profile ? profile.availability.toLowerCase() : '—'}
              icon={Building2}
              tone={profile?.availability === 'AVAILABLE' ? 'teal' : 'amber'}
            />
            <StatCard label="Organisation" value={profile?.organisation ?? '—'} icon={Building2} tone="slate" />
          </div>

          <Card>
            <CardHeader title="Assigned incidents" description="Open a case to review details and move it through the lifecycle." />
            {incidents.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No cases assigned"
                description="When an administrator assigns a case to your responder profile it will appear here."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {incidents.map((incident) => (
                  <li key={incident.id}>
                    <button
                      type="button"
                      onClick={() => void openIncident(incident.id)}
                      className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-slate-900">{incident.reportId}</span>
                          <PriorityBadge priority={incident.priority} />
                          <StatusBadge status={incident.status} label={incident.statusLabel} />
                          {incident.sosTriggered ? <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">SOS</span> : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {incident.typeLabel} · {incident.zoneName ?? 'No zone'} · {formatDateTime(incident.submittedAt)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-brand-700">Open case →</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
            Responders can update the status of assigned cases only. Assignment, escalation and responder management stay
            with administrators. Every change is written to the incident's status history with your name.
          </div>
        </>
      )}

      <Modal
        open={Boolean(selected) || detailLoading}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.reportId}` : 'Loading case…'}
        description={selected ? `${selected.typeLabel} · ${selected.zoneName ?? 'No zone'}` : undefined}
        size="lg"
      >
        {selected ? (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={selected.priority} />
              <StatusBadge status={selected.status} label={selected.statusLabel} />
              <span className="text-xs text-slate-500">Score {selected.severityScore}/100</span>
              {selected.sosTriggered ? <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">SOS</span> : null}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Description</p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-700">{selected.description}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Location</p>
                <p className="mt-1 text-slate-700">{selected.zoneName ?? 'Not provided'}</p>
                {selected.latitude != null && selected.longitude != null ? (
                  <p className="font-mono text-[11px] text-slate-500">
                    {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Incident time</p>
                <p className="mt-1 text-slate-700">{formatDateTime(selected.occurredAt)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Status history</p>
              <ol className="mt-2 space-y-2 border-l border-slate-200 pl-4">
                {selected.history.map((event, index) => (
                  <li key={`${event.status}-${index}`}>
                    <p className="text-sm font-medium text-slate-900">{event.statusLabel}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(event.changedAt)} · {event.actorLabel}</p>
                    {event.note ? <p className="text-xs text-slate-600">{event.note}</p> : null}
                  </li>
                ))}
              </ol>
            </div>

            {selected.allowedNextStatuses.length > 0 ? (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Update this case</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Next status" htmlFor="responder-status">
                    <Select id="responder-status" value={nextStatus} onChange={(event) => setNextStatus(event.target.value as IncidentStatus)}>
                      {selected.allowedNextStatuses.map((status) => (
                        <option key={status} value={status}>{status.replaceAll('_', ' ').toLowerCase()}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Note" htmlFor="responder-note" hint={nextStatus === 'RESOLVED' ? 'Required, at least 10 characters.' : 'Optional.'}>
                    <Textarea id="responder-note" className="min-h-[38px]" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} />
                  </Field>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => void updateStatus()} loading={saving}>Save status</Button>
                </div>
              </div>
            ) : (
              <p className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
                This case is closed; no further transitions are available.
              </p>
            )}

            {selected.evidence.length > 0 ? (
              <p className="text-xs text-slate-500">
                {selected.evidence.length} evidence file(s) are available to authorised staff on the administrator detail page.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Loading case…</p>
        )}
      </Modal>
    </div>
  );
}
