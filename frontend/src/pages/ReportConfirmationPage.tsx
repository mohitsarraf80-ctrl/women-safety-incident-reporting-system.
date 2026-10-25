import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCopy,
  FileSearch,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { PriorityBadge } from '../components/common/Badge';
import { useToast } from '../components/common/Toast';
import type { CreatedReport } from '../types/api';
import { formatDateTime } from '../utils/format';

interface ConfirmationState {
  created?: CreatedReport;
  evidenceName?: string;
}

export default function ReportConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const state = (location.state as ConfirmationState | null) ?? {};
  const created = state.created;
  const [copied, setCopied] = useState<'id' | 'code' | null>(null);

  if (!created) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">No confirmation to show</h1>
        <p className="mt-2 text-sm text-slate-600">
          This page appears immediately after a successful submission. If you already submitted a report, use your
          Report ID and tracking code to check its status.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/report"><Button>Report an incident</Button></Link>
          <Link to="/track"><Button variant="outline">Track a report</Button></Link>
        </div>
      </div>
    );
  }

  const copy = async (value: string, kind: 'id' | 'code') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast.success('Copied', kind === 'id' ? 'Report ID copied to the clipboard.' : 'Tracking code copied.');
      window.setTimeout(() => setCopied(null), 2500);
    } catch {
      toast.error('Could not copy', 'Select the value and copy it manually.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">Report recorded</h1>
        <p className="mt-2 text-sm text-slate-600">
          The server saved this report, calculated its priority and created an alert for the safety desk.
        </p>
      </div>

      <Card className="mt-8 overflow-hidden">
        <CardHeader
          title="Your reference"
          description="The tracking code is shown only once. Store both values somewhere safe."
          actions={<PriorityBadge priority={created.priority} />}
        />
        <CardBody className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Report ID</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="font-mono text-lg font-semibold text-slate-900">{created.reportId}</p>
                <button
                  type="button"
                  onClick={() => copy(created.reportId, 'id')}
                  className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-900"
                  aria-label="Copy report ID"
                >
                  {copied === 'id' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <ClipboardCopy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-700">Tracking code</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="font-mono text-lg font-semibold text-brand-900">{created.trackingCode}</p>
                <button
                  type="button"
                  onClick={() => copy(created.trackingCode, 'code')}
                  className="rounded-lg p-2 text-brand-600 hover:bg-white hover:text-brand-800"
                  aria-label="Copy tracking code"
                >
                  {copied === 'code' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <ClipboardCopy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
              <dd className="mt-1 font-medium text-slate-900">{created.statusLabel}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Priority</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {created.priorityLabel} · {created.severityScore}/100
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Submitted</dt>
              <dd className="mt-1 font-medium text-slate-900">{formatDateTime(created.submittedAt)}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              {created.anonymous ? 'Anonymous report — no identity stored' : 'Identified report'}
            </span>
            {created.evidenceAttached ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                Evidence attached{state.evidenceName ? `: ${state.evidenceName}` : ''}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              {created.alertsCreated} alert{created.alertsCreated === 1 ? '' : 's'} created
            </span>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <p className="font-semibold">Save the tracking code now</p>
            <p className="mt-1">{created.trackingHint} It cannot be recovered from the server, only reset by an administrator.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="sm:flex-1"
              onClick={() => navigate('/track', { state: { reportId: created.reportId, trackingCode: created.trackingCode } })}
              icon={<FileSearch className="h-4 w-4" />}
            >
              Track this report
            </Button>
            <Link to="/" className="sm:flex-1">
              <Button variant="outline" className="w-full" icon={<ArrowRight className="h-4 w-4" />}>
                Back to home
              </Button>
            </Link>
          </div>

          <p className="border-t border-slate-100 pt-4 text-[11px] leading-relaxed text-slate-500">
            {created.disclaimer}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
