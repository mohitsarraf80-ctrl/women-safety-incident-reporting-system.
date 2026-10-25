import { Compass, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Compass className="h-8 w-8" />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">This page does not exist</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        The link may be outdated, or the page may have moved. Nothing was submitted or changed.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link to="/"><Button icon={<Home className="h-4 w-4" />}>Back to home</Button></Link>
        <Link to="/report"><Button variant="outline">Report an incident</Button></Link>
      </div>
    </div>
  );
}
