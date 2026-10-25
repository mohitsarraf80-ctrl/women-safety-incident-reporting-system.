import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toApiError } from '../api/client';
import { Button } from '../components/common/Button';
import { Field, Input } from '../components/common/Field';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../utils/constants';
import type { UserRole } from '../types/api';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

function landingFor(role: UserRole): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'RESPONDER') return '/responder';
  return '/dashboard';
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const from = (location.state as { from?: string } | null)?.from;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await login(values.email, values.password);
      toast.success('Signed in', `Welcome back, ${user.displayName}.`);
      navigate(from && from !== '/login' ? from : landingFor(user.role), { replace: true });
    } catch (error) {
      const problem = toApiError(error);
      setFormError(problem.detail ?? 'Unable to sign in.');
    }
  });

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink-900 p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(60% 50% at 20% 10%, rgba(79,70,229,0.35) 0%, rgba(11,18,32,0) 60%), radial-gradient(50% 50% at 90% 90%, rgba(13,148,136,0.25) 0%, rgba(11,18,32,0) 60%)',
          }}
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-brand-200">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure sign-in
          </span>
          <h2 className="mt-6 max-w-md text-3xl font-semibold leading-tight text-white">
            One account, role-aware access to the safety workflow.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            Passwords are hashed with BCrypt. Sessions use signed JWTs that are revoked on logout. Your role is
            checked by the Java API on every request — not only by this interface.
          </p>
        </div>
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-slate-300">
          <p className="font-semibold text-white">Development demo accounts</p>
          <p className="mt-1 text-slate-400">
            Created only by the dev seeder. Never enable demo seeding in a real deployment.
          </p>
          <div className="mt-3 space-y-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setValue('email', account.email);
                  setValue('password', DEMO_PASSWORD);
                }}
                className="flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-left hover:bg-white/10"
              >
                <span className="text-slate-300">{account.role}</span>
                <span className="font-mono text-[11px] text-slate-200">{account.email}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 font-mono text-[11px] text-slate-400">Password: {DEMO_PASSWORD}</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">
            Access your reports, responder queue or the administration dashboard.
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
            {formError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {formError}
              </div>
            ) : null}

            <Field label="Email address" htmlFor="email" error={errors.email?.message} required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  invalid={Boolean(errors.email)}
                  {...register('email')}
                />
              </div>
            </Field>

            <Field label="Password" htmlFor="password" error={errors.password?.message} required>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9"
                  invalid={Boolean(errors.password)}
                  {...register('password')}
                />
              </div>
            </Field>

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting} icon={<ArrowRight className="h-4 w-4" />}>
              Sign in
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 lg:hidden">
            <p className="font-semibold text-slate-900">Demo accounts (dev seeder)</p>
            {DEMO_ACCOUNTS.map((account) => (
              <p key={account.email} className="mt-1">
                {account.role}: <span className="font-mono">{account.email}</span>
              </p>
            ))}
            <p className="mt-1">Password: <span className="font-mono">{DEMO_PASSWORD}</span></p>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            New here?{' '}
            <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
              Create an account
            </Link>{' '}
            or{' '}
            <Link to="/report" className="font-semibold text-brand-700 hover:text-brand-800">
              report anonymously
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
