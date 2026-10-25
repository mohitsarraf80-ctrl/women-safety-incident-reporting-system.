import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  EyeOff,
  FileSearch,
  Fingerprint,
  KeyRound,
  MapPinned,
  ShieldCheck,
  Siren,
  Sparkles,
  Timer,
  UserRoundX,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { INCIDENT_TYPES, PRIORITIES } from '../utils/constants';
import { Button } from '../components/common/Button';
import { Field, Input } from '../components/common/Field';

const trustPoints = [
  { icon: UserRoundX, title: 'Anonymous by design', text: 'No name, phone or account required. Anonymous reports are never linked to an identity.' },
  { icon: Timer, title: 'Automatic prioritisation', text: 'A documented 0-100 severity score ranks every report as Low, Medium, High or Critical.' },
  { icon: MapPinned, title: 'Unsafe-zone insight', text: 'Reports are grouped into ~500 m grid cells to surface clusters, not to label neighbourhoods.' },
  { icon: KeyRound, title: 'Credential-based tracking', text: 'A unique Report ID plus a one-time tracking code lets you follow the case privately.' },
];

const steps = [
  {
    icon: ClipboardCheck,
    title: '1 · Describe what happened',
    text: 'Choose a category, add the date and time, and share only the location detail you are comfortable with.',
  },
  {
    icon: ShieldCheck,
    title: '2 · The engine triages it',
    text: 'The backend validates the report, computes severity and priority, and raises an alert for the safety desk.',
  },
  {
    icon: FileSearch,
    title: '3 · Track it privately',
    text: 'Keep your Report ID and tracking code to see status changes without exposing the incident details.',
  },
];

const features = [
  { icon: EyeOff, title: 'Anonymous reporting', text: 'Report without an account, a name or a phone number.' },
  { icon: Siren, title: 'Simulated SOS', text: 'One confirmation step records an urgent alert with optional GPS coordinates.' },
  { icon: Sparkles, title: 'Severity engine', text: 'Category, time of day, repeat reports, evidence and SOS combine into one score.' },
  { icon: MapPinned, title: 'Hotspot detection', text: 'Grid counting with a mean + standard deviation threshold highlights clusters.' },
  { icon: CalendarClock, title: 'Case lifecycle', text: 'Submitted → Under review → Assigned → In progress → Resolved → Closed, with history.' },
  { icon: Fingerprint, title: 'Role-based access', text: 'Citizens, responders and administrators see only what their role permits, enforced by the API.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [reportId, setReportId] = useState('');
  const [code, setCode] = useState('');

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-900">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(60% 60% at 80% 10%, rgba(79,70,229,0.35) 0%, rgba(11,18,32,0) 60%), radial-gradient(50% 50% at 10% 90%, rgba(13,148,136,0.25) 0%, rgba(11,18,32,0) 60%)',
          }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-brand-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Project-Based Learning prototype · NIET, Greater Noida
            </span>
            <h1 className="mt-6 max-w-2xl text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              Report safely. Track privately. Respond faster.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300">
              A secure platform for women to report safety incidents, request help, and follow the case —
              while authorised responders see a prioritised, evidence-based queue instead of scattered complaints.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/report">
                <Button size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                  Report an incident
                </Button>
              </Link>
              <Link to="/sos">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" icon={<Siren className="h-4 w-4 text-red-400" />}>
                  Emergency SOS
                </Button>
              </Link>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs text-slate-400">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              No registration required for anonymous reporting. This prototype does not contact the police or
              emergency services.
            </p>
          </div>

          {/* Severity explainer card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">How priority is decided</p>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300">0-100</span>
            </div>
            <div className="mt-4 space-y-2">
              {INCIDENT_TYPES.slice(0, 5).map((type) => (
                <div key={type.value} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                  <span className="text-sm text-slate-200">{type.label}</span>
                  <span className="text-sm font-semibold text-white">+{type.baseScore}</span>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-400">
                <span className="rounded-lg border border-white/10 px-3 py-2">Night +15</span>
                <span className="rounded-lg border border-white/10 px-3 py-2">Repeat +10 (max +20)</span>
                <span className="rounded-lg border border-white/10 px-3 py-2">Evidence +5</span>
                <span className="rounded-lg border border-white/10 px-3 py-2">SOS +20</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-1.5">
              {PRIORITIES.map((priority, index) => (
                <div
                  key={priority.value}
                  className={[
                    'rounded-lg px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide',
                    ['bg-emerald-500/15 text-emerald-300', 'bg-amber-500/15 text-amber-300', 'bg-orange-500/15 text-orange-300', 'bg-red-500/15 text-red-300'][index],
                  ].join(' ')}
                >
                  {priority.label}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
              Score capped at 100. The prototype score is a triage aid, not a validated assessment of danger.
            </p>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {trustPoints.map((point) => (
            <div key={point.title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <point.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{point.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{point.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Three steps from report to review
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Every submission is validated on the server, scored, stored in MySQL and turned into an alert for
              the safety desk. Nothing important depends on the browser.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900 text-white">
                  <step.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Platform capabilities</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Built around the safety workflow
              </h2>
            </div>
            <Link to="/about" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
              About the project →
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-slate-200 p-6 transition-shadow hover:shadow-card">
                <feature.icon className="h-6 w-6 text-brand-600" />
                <h3 className="mt-4 text-base font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Track + anonymity */}
      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Track my report</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Follow your case without revealing who you are
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Anonymous reports are protected by a one-time tracking code. Enter both values to see the current
              status. The tracking view never shows the description, evidence or exact coordinates.
            </p>
            <form
              className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
              onSubmit={(event) => {
                event.preventDefault();
                navigate('/track', { state: { reportId: reportId.trim(), trackingCode: code.trim() } });
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Report ID" htmlFor="landing-report-id">
                  <Input
                    id="landing-report-id"
                    placeholder="WS-XXXXXXXX"
                    value={reportId}
                    onChange={(event) => setReportId(event.target.value)}
                    required
                  />
                </Field>
                <Field label="Tracking code" htmlFor="landing-tracking-code">
                  <Input
                    id="landing-tracking-code"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    required
                  />
                </Field>
              </div>
              <Button type="submit" className="mt-4 w-full sm:w-auto" icon={<FileSearch className="h-4 w-4" />}>
                Check status
              </Button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-ink-900 p-6 text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
              <EyeOff className="h-3.5 w-3.5" /> Anonymity, honestly explained
            </span>
            <h3 className="mt-4 text-xl font-semibold text-white">Application-level anonymity</h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                Anonymous reports store no name, phone, email or account link — verified by the API and database design.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                The tracking code is stored only as a BCrypt hash; the plaintext is shown to you once.
              </li>
              <li className="flex gap-2">
                <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                No system can promise complete network anonymity. Server logs, your network provider or the device
                you use may still hold technical metadata.
              </li>
              <li className="flex gap-2">
                <Siren className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                This is a college prototype, not a replacement for police or emergency services. In immediate
                danger, contact them directly.
              </li>
            </ul>
            <Link to="/privacy" className="mt-5 inline-flex text-sm font-semibold text-brand-300 hover:text-brand-200">
              Read the full privacy & safety notice →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-brand-50 via-white to-accent-50 p-8 text-center sm:p-12">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-slate-900">
              Safer communities start with a report that is easy to make.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
              Report anonymously in under two minutes. Every report is reviewed by an authorised human — the score
              never decides on its own, and a low score never prevents escalation.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/report">
                <Button size="lg">Report an incident</Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline">Create an account</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
