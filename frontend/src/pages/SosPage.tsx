import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCopy,
  Crosshair,
  MapPin,
  Radio,
  Siren,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { sosApi } from '../api';
import { toApiError } from '../api/client';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Field, Input } from '../components/common/Field';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import type { SosResponse } from '../types/api';
import { formatDateTime } from '../utils/format';

export default function SosPage() {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);
  const [zone, setZone] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SosResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(60);
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setCooldown((value) => {
        if (value <= 1 && timer.current) {
          window.clearInterval(timer.current);
          timer.current = null;
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  };

  const getLocation = (): Promise<{ latitude: number; longitude: number } | null> =>
    new Promise((resolve) => {
      if (!shareLocation || !navigator.geolocation) {
        resolve(null);
        return;
      }
      const timeout = window.setTimeout(() => resolve(null), 9000);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          window.clearTimeout(timeout);
          resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        },
        () => {
          window.clearTimeout(timeout);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
      );
    });

  const activate = async () => {
    setSubmitting(true);
    setError(null);
    const location = await getLocation();
    if (shareLocation && !location) {
      toast.info('Location not available', 'The SOS will be recorded without GPS coordinates. You can add a zone description.');
    }
    try {
      const response = await sosApi.activate({
        latitude: location?.latitude,
        longitude: location?.longitude,
        zoneName: zone.trim() || undefined,
        description: note.trim() || undefined,
      });
      setResult(response);
      setConfirming(false);
      startCooldown();
      toast.success('SOS recorded', 'An urgent alert is now visible to the safety desk.');
    } catch (problem) {
      const apiError = toApiError(problem);
      setError(apiError.detail ?? 'The SOS could not be recorded. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied', 'Value copied to the clipboard.');
    } catch {
      toast.error('Could not copy', 'Select the value and copy it manually.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="danger">Demo mode</Badge>
        <span className="text-xs text-slate-500">No message is sent to police, emergency services or contacts.</span>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-red-900/20 bg-gradient-to-br from-red-950 via-ink-900 to-ink-900">
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-300">
              <Siren className="h-4 w-4" /> Emergency SOS
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Request urgent attention
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
              Activating SOS creates a real incident record and an urgent alert in the administration dashboard, with
              your location if you allow it. It does <span className="font-semibold text-white">not</span> call the
              police or any external service.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setConfirming(true);
                }}
                disabled={cooldown > 0 || submitting}
                className="group flex h-28 w-28 flex-col items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_0_10px_rgba(220,38,38,0.15)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-900/60"
                aria-label="Activate SOS"
              >
                <TriangleAlert className="h-7 w-7" />
                <span className="mt-1 text-sm font-bold tracking-wide">SOS</span>
              </button>
              <div className="text-xs text-slate-400">
                {cooldown > 0 ? (
                  <p>Cooldown active — available in {cooldown}s.</p>
                ) : (
                  <p>A confirmation step prevents accidental activation.</p>
                )}
                <p className="mt-1">For immediate danger, call local emergency services.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm font-semibold text-white">What happens on activation</p>
            <ol className="mt-3 space-y-2 text-xs leading-relaxed text-slate-300">
              <li className="flex gap-2"><span className="text-red-300">1.</span> A new SOS incident is created with a unique reference and Report ID.</li>
              <li className="flex gap-2"><span className="text-red-300">2.</span> Coordinates are attached only if you consent and the browser provides them.</li>
              <li className="flex gap-2"><span className="text-red-300">3.</span> The SOS bonus (+20) is applied to the severity score.</li>
              <li className="flex gap-2"><span className="text-red-300">4.</span> An in-app alert appears for administrators; SMS/e-mail delivery is simulated.</li>
              <li className="flex gap-2"><span className="text-red-300">5.</span> You receive a tracking code so you can follow the case.</li>
            </ol>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {result ? (
        <Card className="mt-6">
          <CardHeader
            title="SOS recorded"
            description={`Reference ${result.referenceId} · ${formatDateTime(result.activatedAt)}`}
            actions={
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20">
                <Radio className="h-3.5 w-3.5" /> Notifications: {result.notificationStatus}
              </span>
            }
          />
          <CardBody className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Report ID</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="font-mono text-lg font-semibold text-slate-900">{result.reportId}</p>
                  <button type="button" onClick={() => copy(result.reportId)} className="rounded-lg p-2 text-slate-500 hover:bg-white" aria-label="Copy report ID">
                    <ClipboardCopy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
                <p className="text-xs uppercase tracking-wide text-brand-700">Tracking code</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="font-mono text-lg font-semibold text-brand-900">{result.trackingCode}</p>
                  <button type="button" onClick={() => copy(result.trackingCode)} className="rounded-lg p-2 text-brand-600 hover:bg-white" aria-label="Copy tracking code">
                    <ClipboardCopy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
                <dd className="mt-1 font-medium text-slate-900">{result.status}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Priority</dt>
                <dd className="mt-1 font-medium text-slate-900">{result.priority} · {result.severityScore}/100</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Location</dt>
                <dd className="mt-1 flex items-center gap-1.5 font-medium text-slate-900">
                  {result.locationCaptured ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <MapPin className="h-4 w-4 text-slate-400" />}
                  {result.locationCaptured ? 'Coordinates captured' : 'Not captured'}
                </dd>
              </div>
            </dl>

            <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">{result.locationNote}</p>

            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs leading-relaxed text-sky-900">
              <p className="font-semibold">Delivery status</p>
              <p className="mt-1">{result.notificationDetail}</p>
              <ul className="mt-2 space-y-1">
                {result.alerts.map((alert) => (
                  <li key={alert} className="flex items-center gap-1.5">
                    <Radio className="h-3 w-3" /> {alert}
                  </li>
                ))}
              </ul>
            </div>

            <p className="flex items-start gap-2 border-t border-slate-100 pt-4 text-[11px] leading-relaxed text-slate-500">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              {result.disclaimer}
            </p>

            <div className="flex flex-wrap gap-2">
              <Link to="/track" state={{ reportId: result.reportId, trackingCode: result.trackingCode }}>
                <Button variant="outline" size="sm">Track this SOS</Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" size="sm">Back to home</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Confirm SOS activation"
        description="This creates a real incident record and an urgent administrator alert."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button variant="danger" loading={submitting} onClick={activate} icon={<Siren className="h-4 w-4" />}>
              Activate SOS
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <p className="font-semibold">This is a demonstration, not a rescue service.</p>
            <p className="mt-1">
              No police unit, ambulance, NGO or trusted contact is contacted. If you are in immediate danger, call
              your local emergency number now.
            </p>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={shareLocation}
              onChange={(event) => setShareLocation(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                <Crosshair className="h-4 w-4 text-slate-500" /> Share my current location
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                If permission is denied or unavailable, the SOS is still recorded without coordinates.
              </span>
            </span>
          </label>

          <Field label="Zone or landmark (optional)" htmlFor="sos-zone">
            <Input id="sos-zone" value={zone} onChange={(event) => setZone(event.target.value)} placeholder="e.g. Sector 62 Metro Station" maxLength={160} />
          </Field>

          <Field label="Short note (optional)" htmlFor="sos-note" hint="Do not include details you would not want stored.">
            <Input id="sos-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Anything the safety desk should know" maxLength={500} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
