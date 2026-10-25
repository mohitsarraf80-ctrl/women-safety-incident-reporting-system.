import {
  BriefcaseBusiness,
  CheckCircle2,
  Pencil,
  Plus,
  ShieldQuestion,
  UserPlus,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api';
import { toApiError } from '../api/client';
import { AvailabilityBadge, PriorityBadge, StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { Field, Input, Select } from '../components/common/Field';
import { Modal } from '../components/common/Modal';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState, ErrorState, TableSkeleton } from '../components/common/States';
import { useToast } from '../components/common/Toast';
import type { IncidentSummary, Responder, ResponderAvailability } from '../types/api';
import { formatDateTime } from '../utils/format';

interface FormState {
  displayName: string;
  organisation: string;
  contactPhone: string;
  availability: ResponderAvailability;
  loginEmail: string;
  loginPassword: string;
}

const emptyForm: FormState = {
  displayName: '',
  organisation: '',
  contactPhone: '',
  availability: 'AVAILABLE',
  loginEmail: '',
  loginPassword: '',
};

export default function ResponderManagementPage() {
  const toast = useToast();
  const [responders, setResponders] = useState<Responder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Responder | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [viewing, setViewing] = useState<Responder | null>(null);
  const [assigned, setAssigned] = useState<IncidentSummary[] | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setResponders(await adminApi.responders());
    } catch (problem) {
      setError(toApiError(problem).detail ?? 'The responder directory could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    if (!form.displayName.trim() || !form.organisation.trim()) {
      toast.error('Missing details', 'A name and organisation are required.');
      return;
    }
    setBusy(true);
    try {
      const created = await adminApi.createResponder({
        displayName: form.displayName.trim(),
        organisation: form.organisation.trim(),
        contactPhone: form.contactPhone.trim() || undefined,
        availability: form.availability,
        loginEmail: form.loginEmail.trim() || undefined,
        loginPassword: form.loginPassword || undefined,
      });
      setResponders((current) => [...current, created]);
      setCreateOpen(false);
      setForm(emptyForm);
      toast.success('Responder created', `${created.displayName} was added to the directory.`);
    } catch (problem) {
      toast.error('Could not create responder', toApiError(problem).detail ?? 'Check the details and try again.');
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (responder: Responder) => {
    setEditing(responder);
    setEditForm({
      displayName: responder.displayName,
      organisation: responder.organisation,
      contactPhone: responder.contactPhone ?? '',
      availability: responder.availability,
      loginEmail: responder.loginEmail ?? '',
      loginPassword: '',
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const updated = await adminApi.updateResponder(editing.id, {
        displayName: editForm.displayName.trim(),
        organisation: editForm.organisation.trim(),
        contactPhone: editForm.contactPhone.trim() || undefined,
        availability: editForm.availability,
      });
      setResponders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setEditing(null);
      toast.success('Responder updated', 'Availability and profile details were saved.');
    } catch (problem) {
      toast.error('Update failed', toApiError(problem).detail ?? 'The responder could not be updated.');
    } finally {
      setBusy(false);
    }
  };

  const changeAvailability = async (responder: Responder, availability: ResponderAvailability) => {
    try {
      const updated = await adminApi.updateResponder(responder.id, {
        displayName: responder.displayName,
        organisation: responder.organisation,
        contactPhone: responder.contactPhone ?? undefined,
        availability,
      });
      setResponders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast.success('Availability updated', `${responder.displayName} is now ${availability.toLowerCase()}.`);
    } catch (problem) {
      toast.error('Update failed', toApiError(problem).detail ?? 'Availability could not be changed.');
    }
  };

  const openCases = async (responder: Responder) => {
    setViewing(responder);
    setAssigned(null);
    try {
      const page = await adminApi.responderIncidents(responder.id);
      setAssigned(page.content);
    } catch {
      setAssigned([]);
    }
  };

  const available = responders.filter((responder) => responder.availability === 'AVAILABLE').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Responder management"
        title="Responder directory"
        description="Fictional demonstration units only. Responders are not presented as police officers or officially affiliated personnel."
        actions={
          <Button onClick={() => setCreateOpen(true)} icon={<UserPlus className="h-4 w-4" />}>
            Add responder
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Responders</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{responders.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Available now</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">{available}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active assignments</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {responders.reduce((sum, responder) => sum + responder.activeAssignments, 0)}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader title="Directory" description="Assign a responder from an incident detail page. Workload is computed from live cases." />
        {loading ? (
          <TableSkeleton rows={4} columns={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : responders.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No responders yet"
            description="Create the first responder profile. You can optionally attach a responder login account."
            action={<Button size="sm" onClick={() => setCreateOpen(true)} icon={<Plus className="h-4 w-4" />}>Add responder</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Responder</th>
                  <th className="px-5 py-3 font-medium">Organisation</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Availability</th>
                  <th className="px-5 py-3 font-medium">Workload</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responders.map((responder) => (
                  <tr key={responder.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{responder.displayName}</p>
                      <p className="font-mono text-[11px] text-slate-500">{responder.badgeCode}</p>
                      {responder.loginEmail ? <p className="text-[11px] text-slate-400">{responder.loginEmail}</p> : <p className="text-[11px] text-amber-600">No login account</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{responder.organisation}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{responder.contactPhone ?? '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <AvailabilityBadge availability={responder.availability} />
                        <select
                          className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-600"
                          value={responder.availability}
                          onChange={(event) => void changeAvailability(responder, event.target.value as ResponderAvailability)}
                          aria-label={`Change availability for ${responder.displayName}`}
                        >
                          <option value="AVAILABLE">Available</option>
                          <option value="BUSY">Busy</option>
                          <option value="UNAVAILABLE">Unavailable</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">{responder.activeAssignments}</span> active
                      <span className="text-slate-400"> · {responder.totalAssignments} total</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => void openCases(responder)} icon={<BriefcaseBusiness className="h-4 w-4" />}>
                          Cases
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(responder)} icon={<Pencil className="h-4 w-4" />}>
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
        <p className="flex items-center gap-1.5 font-semibold">
          <ShieldQuestion className="h-4 w-4" /> Demo units are fictional
        </p>
        <p className="mt-1">
          Sample responders are created only by the dev seeder and described as fictional. Do not imply that they are
          real police officers, government units or officially affiliated organisations.
        </p>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add a responder"
        description="Optionally create a login account so the responder can work the queue."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => void create()} loading={busy} icon={<CheckCircle2 className="h-4 w-4" />}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name" htmlFor="responder-name" required>
              <Input id="responder-name" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} />
            </Field>
            <Field label="Availability" htmlFor="responder-availability">
              <Select id="responder-availability" value={form.availability} onChange={(event) => setForm({ ...form, availability: event.target.value as ResponderAvailability })}>
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </Select>
            </Field>
          </div>
          <Field label="Organisation or station" htmlFor="responder-org" required hint="Use the fictional unit name in the demo.">
            <Input id="responder-org" value={form.organisation} onChange={(event) => setForm({ ...form, organisation: event.target.value })} />
          </Field>
          <Field label="Contact phone" htmlFor="responder-phone">
            <Input id="responder-phone" value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} />
          </Field>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-800">Optional responder login</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Provide both fields to create a RESPONDER account. The responder sees only cases assigned to this profile.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Login email" htmlFor="responder-email">
                <Input id="responder-email" type="email" value={form.loginEmail} onChange={(event) => setForm({ ...form, loginEmail: event.target.value })} />
              </Field>
              <Field label="Temporary password" htmlFor="responder-password" hint="At least 8 characters.">
                <Input id="responder-password" type="text" value={form.loginPassword} onChange={(event) => setForm({ ...form, loginPassword: event.target.value })} />
              </Field>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.displayName}` : 'Edit responder'}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => void saveEdit()} loading={busy}>Save changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Display name" htmlFor="edit-name" required>
            <Input id="edit-name" value={editForm.displayName} onChange={(event) => setEditForm({ ...editForm, displayName: event.target.value })} />
          </Field>
          <Field label="Organisation or station" htmlFor="edit-org" required>
            <Input id="edit-org" value={editForm.organisation} onChange={(event) => setEditForm({ ...editForm, organisation: event.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact phone" htmlFor="edit-phone">
              <Input id="edit-phone" value={editForm.contactPhone} onChange={(event) => setEditForm({ ...editForm, contactPhone: event.target.value })} />
            </Field>
            <Field label="Availability" htmlFor="edit-availability">
              <Select id="edit-availability" value={editForm.availability} onChange={(event) => setEditForm({ ...editForm, availability: event.target.value as ResponderAvailability })}>
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? `Cases for ${viewing.displayName}` : 'Assigned cases'}
        size="lg"
      >
        {assigned === null ? (
          <p className="text-sm text-slate-500">Loading cases…</p>
        ) : assigned.length === 0 ? (
          <p className="text-sm text-slate-500">No incidents are assigned to this responder.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {assigned.map((incident) => (
              <li key={incident.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <Link to={`/admin/incidents/${incident.id}`} onClick={() => setViewing(null)} className="font-mono text-xs font-semibold text-brand-700">
                    {incident.reportId}
                  </Link>
                  <p className="text-xs text-slate-500">{incident.typeLabel} · {formatDateTime(incident.submittedAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={incident.priority} />
                  <StatusBadge status={incident.status} label={incident.statusLabel} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
