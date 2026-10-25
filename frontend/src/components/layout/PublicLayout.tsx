import { Menu, LayoutDashboard, LogIn, Siren, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { Button } from '../common/Button';
import { Logo } from './Logo';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/report', label: 'Report an incident' },
  { to: '/track', label: 'Track a report' },
  { to: '/about', label: 'About the project' },
  { to: '/privacy', label: 'Privacy & safety' },
];

export function PublicLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo variant="light" />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link to="/sos">
              <Button variant="outline" size="sm" icon={<Siren className="h-4 w-4 text-red-600" />}>
                SOS
              </Button>
            </Link>
            {user ? (
              <Link to={user.role === 'ADMIN' ? '/admin' : user.role === 'RESPONDER' ? '/responder' : '/dashboard'}>
                <Button size="sm" icon={<LayoutDashboard className="h-4 w-4" />}>
                  Open dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" icon={<LogIn className="h-4 w-4" />}>
                    Sign in
                  </Button>
                </Link>
                <Link to="/report">
                  <Button size="sm">Report an incident</Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-slate-200 bg-white lg:hidden">
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-3">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-3 py-2 text-sm font-medium',
                      isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to="/sos" onClick={() => setOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full" icon={<Siren className="h-4 w-4 text-red-600" />}>
                    SOS
                  </Button>
                </Link>
                <Link to={user ? '/dashboard' : '/login'} onClick={() => setOpen(false)}>
                  <Button size="sm" className="w-full">
                    {user ? 'Dashboard' : 'Sign in'}
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-ink-900 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div className="lg:col-span-2">
            <Logo variant="dark" />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              A secure, anonymous and data-driven platform to report, prioritise and respond to safety
              incidents. Built as a Project-Based Learning prototype for OOTs in Java at NIET, Greater Noida.
            </p>
            <p className="mt-4 max-w-md rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              This prototype is not an emergency service and is not connected to the police. For immediate
              danger, contact local emergency services.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Platform</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="hover:text-white" to="/report">Report an incident</Link></li>
              <li><Link className="hover:text-white" to="/track">Track a report</Link></li>
              <li><Link className="hover:text-white" to="/sos">SOS simulation</Link></li>
              <li><Link className="hover:text-white" to="/login">Sign in</Link></li>
              <li><Link className="hover:text-white" to="/register">Create an account</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Information</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="hover:text-white" to="/privacy">Privacy & safety notice</Link></li>
              <li><Link className="hover:text-white" to="/about">About the project</Link></li>
              <li><Link className="hover:text-white" to="/privacy#anonymity">How anonymity works</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} Women Safety Incident Reporting Platform · NIET PBL</p>
            <p>OOTs in Java (CCSE0355) · Team: Mimansa Saini, Md Rehan, Mohit Soni, Mo Danish, Mrittika Das</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
