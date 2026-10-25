import {
  ArrowLeft,
  Building2,
  Download,
  FileText,
  Flame,
  MapPin,
  MessageSquarePlus,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../api';
import { api, toApiError } from '../api/client';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Field, Select, Textarea } from '../components/common/Field';
import { Modal } from '../components/common/Modal';
import { PageHeader } from '../components/common/PageHeader';
import { ErrorState, PageLoader } from '../components/common/States';
import { useToast } from '../components/common/Toast';
import type { IncidentDetail, IncidentStatus, Responder } from '../types/api';
import { formatBytes, formatDateTime } from '../utils/format';

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const incidentId = Number(id);
  const toast = useToast();

  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [nextStatus, setNextStatus] = useState<IncidentStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);

  const [responderId, setResponderId] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);

  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');

  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detail, responderList] = await Promise.all([
        adminApi.incident(incidentId),
        adminApi.responders().catch(() => [] as Responder[]),
      ]);
      setIncident(detail);
      setResponders(responderList);
      setNextStatus(detail.allowedNextStatuses[0] ?? '');
      setResponderId(detail.responder ? String(detail.responder.id) : '');
    } catch (problem) {
      setError(toApiError(problem).detail ?? 'The incident could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    if (Number.isFinite(incidentId)) {
      void load();
    }
  }, [incidentId, load]);

  if (!Number.isFinite(incidentId)) {
    return <ErrorState title="Invalid incident" message="The incident identifier in the URL is not a number." />;
  }
  if (loading) return <PageLoader label="Loading incident" />;
  if (error || !incident) {
    return <ErrorState message={error ?? 'Incident not found.'} onRetry={() => void load()} />;
  }

  const refreshWith = (updated: IncidentDetail, message: string) => {
    setIncident(updated);
    toast.success(message);
    setStatusOpen(false);
    setAssignOpen(false);
    setEscalateOpen(false);
    setStatusNote('');
    setEscalateReason('');
  };

  const submitStatus = async () => {
    if (!nextStatus) return;
    setBusy(true);
    try {
      const updated = await adminApi.updateStatus(incident.id, nextStatus, statusNote.trim() || undefined);
      refreshWith(updated, `Status changed to ${updated.statusLabel}.`);
    } catch (problem) {
      toast.error('Status not changed', toApiError(problem).detail ?? 'The transition was rejected.');
    } finally {
      setBusy(false);
    }
  };

  const submitAssign = async () => {
    if (!responderId) return;
    setBusy(true);
    try {
      const updated = await adminApi.assign(incident.id, Number(responderId));
      refreshWith(updated, 'Responder assigned.');
    } catch (problem) {
      toast.error('Assignment failed', toApiError(problem).detail ?? 'The responder could not be assigned.');
    } finally {
      setBusy(false);
    }
  };

  const submitEscalate = async () => {
    if (escalateReason.trim().length < 5) {
      toast.error('Reason required', 'Give at least a short reason for the manual escalation.');
      return;
    }
    setBusy(true);
    try {
      const updated = await adminApi.escalate(incident.id, escalateReason.trim());
      refreshWith(updated, 'Incident escalated to CRITICAL.');
    } catch (problem) {
      toast.error('Escalation failed', toApiError(problem).detail ?? 'The incident could not be escalated.');
    } finally {
      setBusy(false);
    }
  };

  const submitNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try {
      const updated = await adminApi.addNote(incident.id, note.trim());
      setIncident(updated);
      setNote('');
      toast.success('Note added', 'Internal notes are only visible to authorised staff.');
    } catch (problem) {
      toast.error('Note not saved', toApiError(problem).detail ?? 'The note could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const downloadEvidence = async (downloadUrl: string, filename: string) => {
    try {
      const path = downloadUrl.replace(/^\/api/, '');
      const response = await api.get<Blob>(path, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (problem) {
      toast.error('Download failed', toApiError(problem).detail ?? 'The evidence file could not be downloaded.');
    }
  };

  const resolutionRequired = nextStatus === 'RESOLVED';

  return (
    <div className="space-y-6">
      <Link to="/admin/incidents" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to incident queue
      </Link>

      <PageHeader
        eyebrow="Incident detail"
        title={incident.reportId}
        description={`${incident.typeLabel} · submitted ${formatDateTime(incident.submittedAt)}`}
        actions={
          <>
            <PriorityBadge priority={incident.priority} />
            <StatusBadge status={incident.status} label={incident.statusLabel} />
            {incident.escalated ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-800 ring-1 ring-inset ring-orange-600/25">
                <Flame className="h-3 w-3" /> Escalated
              </span>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Reported incident"
              description={incident.anonymous ? 'Anonymous report — no identity is stored' : 'Identified report'}
            />
            <CardBody className="space-y-5">
              <div className="flex flex-wrap gap-2 text-xs">
                {incident.sosTriggered ? (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-700">SOS activated</span>
                ) : null}
                {incident.requiresImmediateAssistance ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">Assistance requested</span>
                ) : null}
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                  {incident.anonymous ? 'Anonymous' : incident.reporter?.displayName ?? 'Contact-only report'}
                </span>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Description</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{incident.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Incident time</p>
                  <p className="mt-1 text-sm text-slate-900">{formatDateTime(incident.occurredAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Location</p>
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-900">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span>
                      {incident.zoneName ?? 'Not provided'}
                      {incident.latitude != null && incident.longitude != null ? (
                        <span className="mt-0.5 block font-mono text-xs text-slate-500">
                          {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}
                          {incident.gridCell ? ` · cell ${incident.gridCell}` : ''}
                        </span>
                      ) : null}
                    </span>
                  </p>
                </div>
              </div>

              {!incident.anonymous && incident.contact ? (
                <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Contact details</p>
                  <p className="mt-1">
                    {[incident.contact.name, incident.contact.phone, incident.contact.email].filter(Boolean).join(' · ') ||
                      'No contact details were provided.'}
                  </p>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Severity breakdown" description="Every component is stored so the score can be audited." />
            <CardBody className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-semibold text-slate-900">{incident.severity.totalScore}</p>
                  <p className="text-xs text-slate-500">out of 100 · {incident.priorityLabel}</p>
                </div>
                <code className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-600">{incident.severity.formula}</code>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  ['Base score (' + incident.typeLabel + ')', incident.severity.baseScore],
                  ['Night-time bonus', incident.severity.nightBonus],
                  ['Repeat-report bonus', incident.severity.repeatBonus],
                  ['Evidence bonus', incident.severity.evidenceBonus],
                  ['SOS bonus', incident.severity.sosBonus],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-medium text-slate-900">+{value}</span>
                  </div>
                ))}
              </div>
              <p className="rounded-lg bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
                The score is a triage aid, not a validated danger assessment. It never blocks review and can always be
                overridden by escalating the case.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Evidence" description="Files are stored outside the web root and served only to authorised staff." />
            <CardBody>
              {incident.evidence.length === 0 ? (
                <p className="text-sm text-slate-500">No evidence was attached to this report.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {incident.evidence.map((file) => (
                    <li key={file.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{file.originalFilename}</p>
                          <p className="text-xs text-slate-500">
                            {file.contentType} · {formatBytes(file.sizeBytes)} · {formatDateTime(file.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => void downloadEvidence(file.downloadUrl, file.originalFilename)} icon={<Download className="h-4 w-4" />}>
                        Download
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Status history" description="Append-only: nothing is overwritten when the case moves." />
            <CardBody>
              <ol className="relative space-y-5 border-l border-slate-200 pl-5">
                {incident.history.map((event, index) => (
                  <li key={`${event.status}-${event.changedAt}-${index}`} className="relative">
                    <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500 ring-2 ring-brand-100" />
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{event.statusLabel}</p>
                      <span className="text-xs text-slate-500">{formatDateTime(event.changedAt)}</span>
                    </div>
                    <p className="text-xs text-slate-500">by {event.actorLabel}</p>
                    {event.note ? <p className="mt-0.5 text-sm text-slate-600">{event.note}</p> : null}
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Internal notes" description="Only administrators and assigned responders can read these." />
            <CardBody className="space-y-4">
              {incident.notes.length === 0 ? (
                <p className="text-sm text-slate-500">No internal notes yet.</p>
              ) : (
                <ul className="space-y-3">
                  {incident.notes.map((item) => (
                    <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800">{item.author}</p>
                        <p className="text-[11px] text-slate-500">{formatDateTime(item.createdAt)}</p>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.body}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="space-y-2">
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add an internal note (not visible to the reporter)…"
                  maxLength={2000}
                  className="min-h-[90px]"
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => void submitNote()} loading={busy} disabled={!note.trim()} icon={<MessageSquarePlus className="h-4 w-4" />}>
                    Add note
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader title="Case actions" description="All changes are validated and audited by the backend." />
            <CardBody className="space-y-3">
              <Button
                className="w-full"
                onClick={() => setStatusOpen(true)}
                disabled={incident.allowedNextStatuses.length === 0}
                icon={<ShieldAlert className="h-4 w-4" />}
              >
                Update status
              </Button>
              <Button className="w-full" variant="outline" onClick={() => setAssignOpen(true)} icon={<UserCheck className="h-4 w-4" />}>
                {incident.responder ? 'Reassign responder' : 'Assign responder'}
              </Button>
              <Button className="w-full" variant="ghost" onClick={() => setEscalateOpen(true)} icon={<Flame className="h-4 w-4" />} disabled={incident.status === 'CLOSED'}>
                Escalate to CRITICAL
              </Button>
              {incident.status === 'CLOSED' ? (
                <p className="text-xs text-slate-500">This case is closed. No further transitions are permitted.</p>
              ) : null}
              {incident.status === 'RESOLVED' ? (
                <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
                  <p className="font-semibold">Resolution note</p>
                  <p className="mt-1">{incident.resolutionNote ?? '—'}</p>
                  <p className="mt-1 text-[11px]">Resolved {formatDateTime(incident.resolvedAt)}</p>
                </div>
              ) : null}
              {incident.escalated && incident.escalationReason ? (
                <div className="rounded-lg bg-orange-50 p-3 text-xs text-orange-900">
                  <p className="font-semibold">Escalation reason</p>
                  <p className="mt-1">{incident.escalationReason}</p>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Assignment" />
            <CardBody className="space-y-3 text-sm">
              {incident.responder ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">{incident.responder.displayName}</p>
                      <p className="text-xs text-slate-500">{incident.responder.badgeCode} · {incident.responder.availability}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">{incident.responder.organisation}</p>
                </>
              ) : (
                <p className="text-sm text-slate-500">No responder is assigned yet.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Alerts raised" description="In-app alerts are real; SMS/e-mail are simulated." />
            <CardBody>
              {incident.alerts.length === 0 ? (
                <p className="text-sm text-slate-500">No alerts recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {incident.alerts.map((alert) => (
                    <li key={alert.id} className="rounded-lg border border-slate-200 p-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-800">{alert.alertType.replaceAll('_', ' ')}</span>
                        <span className={alert.status === 'SENT' ? 'font-semibold text-emerald-700' : alert.status === 'SIMULATED' ? 'font-semibold text-sky-700' : 'font-semibold text-red-700'}>
                          {alert.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-slate-500">{alert.channel} · {formatDateTime(alert.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </aside>
      </div>

      <Modal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Update incident status"
        description="Only transitions allowed by the lifecycle are accepted."
        footer={
          <>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button onClick={() => void submitStatus()} loading={busy} disabled={!nextStatus}>Save status</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="New status" htmlFor="next-status" required>
            <Select id="next-status" value={nextStatus} onChange={(event) => setNextStatus(event.target.value as IncidentStatus)}>
              {incident.allowedNextStatuses.map((status) => (
                <option key={status} value={status}>{status.replaceAll('_', ' ').toLowerCase()}</option>
              ))}
            </Select>
          </Field>
          <Field
            label={resolutionRequired ? 'Resolution note (required, min. 10 characters)' : 'Note (optional)'}
            htmlFor="status-note"
            hint={resolutionRequired ? 'Explain what was done and why the case is being closed.' : 'Stored in the append-only status history.'}
          >
            <Textarea id="status-note" value={statusNote} onChange={(event) => setStatusNote(event.target.value)} maxLength={1000} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={incident.responder ? 'Reassign responder' : 'Assign responder'}
        description="Unavailable responders cannot receive new cases."
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={() => void submitAssign()} loading={busy} disabled={!responderId}>Assign</Button>
          </>
        }
      >
        <Field label="Responder" htmlFor="assign-responder" required>
          <Select id="assign-responder" value={responderId} onChange={(event) => setResponderId(event.target.value)}>
            <option value="">Choose a responder…</option>
            {responders.map((responder) => (
              <option key={responder.id} value={responder.id} disabled={responder.availability === 'UNAVAILABLE'}>
                {responder.displayName} · {responder.organisation} ({responder.availability.toLowerCase()}, {responder.activeAssignments} active)
              </option>
            ))}
          </Select>
        </Field>
      </Modal>

      <Modal
        open={escalateOpen}
        onClose={() => setEscalateOpen(false)}
        title="Escalate to CRITICAL"
        description="Manual override. The computed score is unchanged, but the priority becomes CRITICAL and the action is audited."
        footer={
          <>
            <Button variant="outline" onClick={() => setEscalateOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => void submitEscalate()} loading={busy} icon={<Flame className="h-4 w-4" />}>
              Escalate
            </Button>
          </>
        }
      >
        <Field label="Reason" htmlFor="escalate-reason" required hint="Visible to staff in the incident history.">
          <Textarea id="escalate-reason" value={escalateReason} onChange={(event) => setEscalateReason(event.target.value)} maxLength={500} placeholder="e.g. Caller reported an immediate threat; requires urgent review." />
        </Field>
      </Modal>
    </div>
  );
}
