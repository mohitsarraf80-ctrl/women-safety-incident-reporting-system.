import {
  BarChart3,
  Bell,
  ClipboardList,
  FilePlus2,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  SearchCheck,
  Siren,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/api';
import { cn } from '../../utils/cn';
import { Logo } from './Logo';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const navigation: Record<UserRole, NavItem[]> = {
  CITIZEN: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/report', label: 'Report an incident', icon: FilePlus2 },
    { to: '/my-reports', label: 'My reports', icon: FolderOpen },
    { to: '/track', label: 'Track a report', icon: SearchCheck },
    { to: '/sos', label: 'Emergency SOS', icon: Siren },
    { to: '/profile', label: 'Profile & settings', icon: UserRound },
  ],
  ADMIN: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/incidents', label: 'Incidents', icon: ClipboardList },
    { to: '/admin/alerts', label: 'Alerts', icon: Bell },
    { to: '/admin/responders', label: 'Responders', icon: Users },
    { to: '/admin/hotspots', label: 'Hotspot map', icon: Map },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/profile', label: 'Profile & settings', icon: UserRound },
  ],
  RESPONDER: [
    { to: '/responder', label: 'Assigned cases', icon: ClipboardList, end: true },
    { to: '/profile', label: 'Profile & settings', icon: UserRound },
  ],
};

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const items = navigation[user.role];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Dashboard navigation">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-ink-900">
      <div className="flex h-16 items-center justify-between px-4">
        <Logo variant="dark" />
        <button
          type="button"
          className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="px-4 pb-4">
        <span className="inline-flex items-center rounded-full bg-brand-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-brand-200">
          {user.role === 'ADMIN' ? 'Administrator' : user.role === 'RESPONDER' ? 'Responder' : 'Citizen'}
        </span>
      </div>
      {nav}
      <div className="mt-auto border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/20 text-sm font-semibold text-brand-200">
            {user.displayName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user.displayName}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <Link
          to="/"
          className="mt-1 block rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-300"
        >
          ← Back to public site
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{sidebar}</aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="relative h-full w-72 max-w-[85%]">{sidebar}</aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
                {user.role === 'ADMIN' ? 'Safety operations' : user.role === 'RESPONDER' ? 'Responder portal' : 'Citizen portal'}
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {user.role === 'ADMIN' ? 'Administration dashboard' : user.role === 'RESPONDER' ? 'Assigned cases' : 'Your safety dashboard'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/sos">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                <Siren className="h-4 w-4" />
                SOS
              </button>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
