import { AlertTriangle, Database, EyeOff, FileLock2, Server, ShieldCheck, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';

const sections = [
  { id: 'privacy', label: 'Privacy notice' },
  { id: 'anonymity', label: 'Anonymous reporting' },
  { id: 'data', label: 'What we store' },
  { id: 'security', label: 'Security measures' },
  { id: 'limitations', label: 'Prototype limitations' },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Privacy & safety"
        title="What this platform does with your report"
        description="An honest description of how the prototype handles identity, evidence and status data. It is written for a college demonstration and is not a legal privacy policy."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="hidden lg:block" aria-label="On this page">
          <ul className="sticky top-24 space-y-1 border-l border-slate-200 pl-3 text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="block py-1 text-slate-600 hover:text-brand-700">
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-10">
          <section id="privacy" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <ShieldCheck className="h-5 w-5 text-brand-600" /> Privacy notice
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
              <p>
                This platform collects the minimum information needed to record and act on a safety incident: the
                category, description, time, a general location or coordinates, optional evidence and, for
                non-anonymous reports, an optional contact method.
              </p>
              <p>
                Reports are visible only to authenticated administrators and, for a specific case, the responder it is
                assigned to. Public tracking is limited to status, priority, general zone and the status history —
                never the description or evidence.
              </p>
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                This is a student prototype, not a production service. It has not been assessed against GDPR, India's
                DPDP Act or any other legal framework. Do not submit data you would not be comfortable storing on a
                college project machine.
              </p>
            </div>
          </section>

          <section id="anonymity" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <EyeOff className="h-5 w-5 text-brand-600" /> Anonymous reporting
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
              <p>
                When anonymous mode is selected, the backend stores <strong>no reporter reference at all</strong> — no
                user ID, name, phone number or e-mail. The incident row is created with a null reporter, and the
                anonymous flag is stored as a real column so the omission is explicit in the database.
              </p>
              <p>
                A unique Report ID and a one-time tracking code are returned. Only a BCrypt hash of the tracking code
                is stored, which means a database dump cannot be used to read reports. There is no “hidden identity”
                field and no silent account link.
              </p>
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                Application-level anonymity is not network anonymity. Server logs, your internet provider, your device
                or a shared browser may still contain technical metadata. This prototype does not claim complete
                anonymity.
              </p>
            </div>
          </section>

          <section id="data" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <Database className="h-5 w-5 text-brand-600" /> What we store
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              <li>· Incident category, description, incident time and submission time.</li>
              <li>· General zone name and, when provided, coordinates and a derived ~500 m grid cell.</li>
              <li>· Severity score and its components (base, night, repeat, evidence, SOS).</li>
              <li>· Status, assigned responder, append-only status history and internal staff notes.</li>
              <li>· Evidence metadata plus the file itself, stored outside the public web root.</li>
              <li>· For non-anonymous reports only: the account reference and any contact details you provided.</li>
              <li>· Security audit rows for login, submissions, status changes and responder actions.</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Passwords are hashed with BCrypt. JWTs are short-lived and revoked on logout. Routine logs never include
              passwords, tokens, full descriptions or exact coordinates.
            </p>
          </section>

          <section id="security" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <FileLock2 className="h-5 w-5 text-brand-600" /> Security measures in the prototype
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                ['Ownership checks', 'Every incident read is authorised in the backend: citizens see only their own, responders only assigned cases.'],
                ['Upload validation', 'Evidence is identified by magic bytes, limited to JPEG/PNG/WEBP/PDF and 5 MB, with server-generated filenames.'],
                ['Rate limiting', 'Login, anonymous reporting, tracking and SOS are rate limited per client and per minute.'],
                ['No public evidence URLs', 'Evidence is served through an authorised endpoint with a nosniff header, never from a static directory.'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="limitations" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Prototype limitations
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
              <p className="flex gap-2">
                <Server className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                Everything runs on one machine for a college review. There is no hosting, backup, disaster recovery or
                production monitoring.
              </p>
              <p className="flex gap-2">
                <Timer className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                SMS and e-mail delivery is simulated and labelled SIMULATED. No police, ambulance, NGO or trusted
                contact is contacted, and no emergency number is dialled.
              </p>
              <p className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                The severity score is a triage aid, not a validated assessment of danger. It must never be used to
                dismiss a report or deny help. Every report stays reviewable and can be escalated by a human.
              </p>
              <p className="flex gap-2">
                <FileLock2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                Rate limiting is in-memory, which is fine for one instance but would move to Redis or a gateway in a
                real deployment.
              </p>
            </div>
            <p className="mt-5 text-sm text-slate-600">
              Questions about the project? See the <Link to="/about" className="font-semibold text-brand-700 hover:text-brand-800">project information page</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
