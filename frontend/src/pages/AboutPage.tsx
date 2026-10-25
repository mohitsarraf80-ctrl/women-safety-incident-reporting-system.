import { BookOpen, Code2, Database, GitBranch, GraduationCap, Layers, MapPinned, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { PageHeader } from '../components/common/PageHeader';

const team = [
  ['Mimansa Saini', '2501330100222', 'Team lead · problem definition'],
  ['Md Rehan', '2501330100221', 'Architecture & documentation'],
  ['Mohit Soni', '2501330100229', 'Core Java modules'],
  ['Mo Danish', '2501330100223', 'Algorithms & database'],
  ['Mrittika Das', '2501330100230', 'UI, alerts & testing'],
];

const stack = [
  ['Frontend', 'React 19, Vite, TypeScript, Tailwind CSS, React Router, React Hook Form + Zod, Recharts, Leaflet'],
  ['Backend', 'Java 17, Spring Boot 3.5, Spring Web, Spring Data JPA, Spring Security, Jakarta Validation, JWT, Maven'],
  ['Database', 'MySQL 8 with Flyway versioned migrations and Hibernate'],
  ['Testing', 'JUnit 5, Mockito, MockMvc, isolated H2 test database'],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Project information"
        title="Women Safety Incident Reporting Platform"
        description="A Project-Based Learning submission for OOTs in Java (CCSE0355) at Noida Institute of Engineering and Technology, Greater Noida."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="The problem we are addressing" />
          <CardBody className="space-y-4 text-sm leading-relaxed text-slate-600">
            <p>
              Safety incidents are under-reported because complaint processes are slow, intimidating and rarely
              anonymous. Reports that do arrive are scattered across calls, paper forms and social media, so urgent
              cases compete with minor ones and location patterns stay invisible.
            </p>
            <p>
              This platform captures a structured report in minutes, keeps identity optional, ranks urgency with a
              transparent algorithm, alerts an authorised safety desk, and turns recent reports into geographic
              clusters that can guide prevention work.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Anonymous by default', 'No identity is stored for anonymous reports.'],
                ['Transparent triage', 'Documented base scores plus night, repeat, evidence and SOS bonuses.'],
                ['Human in the loop', 'Administrators can escalate any report regardless of its score.'],
                ['Data for prevention', 'Grid-based hotspot detection over the last 30 days.'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-xl bg-slate-50 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-600" /> {title}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Team & course" />
          <CardBody className="space-y-3 text-sm">
            <div className="rounded-xl bg-ink-900 p-4 text-slate-300">
              <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
                <GraduationCap className="h-4 w-4" /> Faculty mentor
              </p>
              <p className="mt-1 text-base font-semibold text-white">Mr. Suraj Maddeshiya</p>
              <p className="text-xs text-slate-400">OOTs in Java · CCSE0355 · Review 1</p>
            </div>
            <ul className="divide-y divide-slate-100">
              {team.map(([name, roll, role]) => (
                <li key={roll} className="flex items-start justify-between gap-3 py-2">
                  <div>
                    <p className="font-medium text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">{role}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-slate-400">{roll}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Technology stack" description="Chosen to match the course syllabus and remain runnable locally." />
          <CardBody className="space-y-4">
            {stack.map(([label, value]) => (
              <div key={label}>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label === 'Frontend' ? <Code2 className="h-3.5 w-3.5" /> : label === 'Backend' ? <Layers className="h-3.5 w-3.5" /> : label === 'Database' ? <Database className="h-3.5 w-3.5" /> : <GitBranch className="h-3.5 w-3.5" />}
                  {label}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{value}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="The two algorithms" description="Both implementations are unit tested and documented in the README." />
          <CardBody className="space-y-4 text-sm leading-relaxed text-slate-600">
            <div>
              <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-brand-600" /> Severity scoring
              </p>
              <p className="mt-1">
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">score = min(100, base + night + repeat + evidence + sos)</code>
                . Base scores run from 20 (verbal harassment / other) to 80 (sexual assault). Night adds 15, each
                earlier report in the same zone adds 10 up to 20, evidence adds 5 and SOS adds 20.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="success">LOW &lt; 30</Badge>
                <Badge tone="warning">MEDIUM 30-49</Badge>
                <Badge tone="danger">HIGH 50-69</Badge>
                <Badge tone="danger">CRITICAL 70+</Badge>
              </div>
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                <MapPinned className="h-4 w-4 text-accent-700" /> Hotspot detection
              </p>
              <p className="mt-1">
                Reports from the last 30 days are projected onto a ~500 m grid. The mean and population standard
                deviation of populated cell counts are computed, and a cell is flagged when its count exceeds mean + 1
                standard deviation. A bounded priority queue keeps the top-K hotspots (O(n log k)).
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Important disclaimer" />
        <CardBody className="space-y-3 text-sm leading-relaxed text-slate-600">
          <p className="flex gap-2">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            This is a college prototype built to demonstrate Java OOP, REST APIs, database design and frontend
            engineering. It is not an official reporting channel, is not connected to the police or any helpline, and
            must not be used as a substitute for emergency services.
          </p>
          <p>
            Severity scores and hotspots are triage aids. They are not validated risk assessments, not crime
            statistics, and must never be used to dismiss a report or label a neighbourhood.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link to="/report"><Button size="sm">Try reporting</Button></Link>
            <Link to="/privacy"><Button size="sm" variant="outline">Read the privacy notice</Button></Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
