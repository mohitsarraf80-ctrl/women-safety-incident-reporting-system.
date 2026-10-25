import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Clock, FileSearch, LockKeyhole, MapPin, ShieldQuestion } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { z } from 'zod';
import { incidentApi } from '../api';
import { toApiError } from '../api/client';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Field, Input } from '../components/common/Field';
import { EmptyState, Spinner } from '../components/common/States';
import type { TrackingResponse } from '../types/api';
import { DEMO_TRACKING_CODE } from '../utils/constants';
import { formatDateTime } from '../utils/format';

const schema = z.object({
  reportId: z.string().min(1, 'Report ID is required').max(20),
  trackingCode: z.string().min(1, 'Tracking code is required').max(40),
});

type FormValues = z.infer<typeof schema>;

interface TrackState {
  reportId?: string;
  trackingCode?: string;
}

export default function TrackReportPage() {
  const location = useLocation();
  const prefill = (location.state as TrackState | null) ?? {};
  const [result, setResult] = useState<TrackingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reportId: prefill.reportId ?? '',
      trackingCode: prefill.trackingCode ?? '',
    },
  });

  const lookup = useCallback(async (values: FormValues) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await incidentApi.track(values.reportId, values.trackingCode);
      setResult(data);
    } catch (problem) {
      setError(toApiError(problem).detail ?? 'No report matches those details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (prefill.reportId && prefill.trackingCode) {
      setValue('reportId', prefill.reportId);
      setValue('trackingCode', prefill.trackingCode);
      void lookup({ reportId: prefill.reportId, trackingCode: prefill.trackingCode });
    }
  }, [prefill.reportId, prefill.trackingCode, lookup, setValue]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Track my report</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Check your case status</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Enter the Report ID and the tracking code you received when you submitted the report. Wrong credentials
          and unknown IDs return the same response, so the endpoint cannot be used to discover reports.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.2fr]">
        <Card>
          <CardHeader title="Tracking credentials" />
          <CardBody>
            <form className="space-y-4" onSubmit={handleSubmit(lookup)} noValidate>
              <Field label="Report ID" htmlFor="track-report-id" error={errors.reportId?.message} required>
                <Input
                  id="track-report-id"
                  placeholder="WS-XXXXXXXX"
                  invalid={Boolean(errors.reportId)}
                  {...register('reportId')}
                />
              </Field>
              <Field
                label="Tracking code"
                htmlFor="track-code"
                error={errors.trackingCode?.message}
                hint="Format XXXX-XXXX-XXXX-XXXX. Case and dashes are ignored."
                required
              >
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="track-code"
                    className="pl-9 font-mono"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    invalid={Boolean(errors.trackingCode)}
                    {...register('trackingCode')}
                  />
                </div>
              </Field>
              <Button type="submit" className="w-full" loading={loading} icon={<FileSearch className="h-4 w-4" />}>
                Check status
              </Button>
            </form>

            <div className="mt-6 space-y-3 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
              <p className="flex gap-2">
                <ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                Lost your tracking code? An administrator cannot recover it — a new code can only be issued through
                a documented support process (not implemented in this prototype).
              </p>
              <p className="flex gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                Tracking shows the status timeline, priority and general zone. It never shows the description,
                evidence or precise coordinates.
              </p>
              <p className="rounded-lg bg-slate-50 p-2 font-mono text-[11px] text-slate-500">
                Demo data: report IDs start with WS-SEED · tracking code {DEMO_TRACKING_CODE}
              </p>
            </div>
          </CardBody>
        </Card>

        <div>
          {loading ? (
            <Card>
              <CardBody className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-sm text-slate-500">
                <Spinner />
                Verifying credentials…
              </CardBody>
            </Card>
          ) : error ? (
            <Card>
              <CardBody>
                <EmptyState
                  icon={ShieldQuestion}
                  title="No report matches those details"
                  description={error}
                />
              </CardBody>
            </Card>
          ) : result ? (
            <div className="space-y-4">
              <Card>
                <CardHeader
                  title={`Report ${result.reportId}`}
                  description={`${result.typeLabel} · submitted ${formatDateTime(result.submittedAt)}`}
                  actions={<PriorityBadge priority={result.priority} />}
                />
                <CardBody className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={result.status} label={result.statusLabel} />
                    {result.anonymous ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        Anonymous report
                      </span>
                    ) : null}
                  </div>
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">Incident time</dt>
                      <dd className="mt-1 text-slate-900">{formatDateTime(result.occurredAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">General zone</dt>
                      <dd className="mt-1 flex items-center gap-1.5 text-slate-900">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {result.zoneName ?? 'Not provided'}
                      </dd>
                    </div>
                  </dl>
                  <p className="rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
                    {result.privacyNote}
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Status history" description="Updates are appended, never overwritten." />
                <CardBody>
                  <ol className="relative space-y-5 border-l border-slate-200 pl-5">
                    {result.history.map((event, index) => (
                      <li key={`${event.status}-${event.changedAt}-${index}`} className="relative">
                        <span className="absolute -left-[26px] top-1 flex h-3 w-3 items-center justify-center rounded-full border-2 border-white bg-brand-500 ring-2 ring-brand-100" />
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{event.statusLabel}</p>
                          <span className="text-xs text-slate-500">{formatDateTime(event.changedAt)}</span>
                        </div>
                        {event.note ? <p className="mt-1 text-sm text-slate-600">{event.note}</p> : null}
                      </li>
                    ))}
                  </ol>
                  {result.history.length === 0 ? (
                    <p className="flex items-center gap-2 text-sm text-slate-500">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> The report was received.
                    </p>
                  ) : null}
                </CardBody>
              </Card>
            </div>
          ) : (
            <Card>
              <CardBody>
                <EmptyState
                  icon={FileSearch}
                  title="Your status will appear here"
                  description="Enter your Report ID and tracking code to see the current priority, status and the full status history."
                />
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
