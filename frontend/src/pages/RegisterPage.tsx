import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toApiError } from '../api/client';
import { Button } from '../components/common/Button';
import { Field, Input } from '../components/common/Field';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';

const schema = z
  .object({
    displayName: z.string().min(2, 'Enter at least 2 characters').max(120),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    phone: z
      .string()
      .optional()
      .refine((value) => !value || /^[0-9+\-\s()]{6,30}$/.test(value), 'Enter a valid phone number'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .max(72)
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Include at least one letter and one number'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await registerAccount(values.displayName, values.email, values.password, values.phone);
      toast.success('Account created', 'You are signed in and can now track your reports.');
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
    } catch (error) {
      const problem = toApiError(error);
      if (problem.errors) {
        setFormError(Object.values(problem.errors)[0] ?? problem.detail ?? 'Unable to register.');
      } else {
        setFormError(problem.detail ?? 'Unable to register.');
      }
    }
  });

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Create an account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Keep your reports in one place
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          A citizen account lets you view your submitted reports and their status history. Reporting anonymously
          never requires an account and never links an identity to the report.
        </p>

        <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-card">
          <p className="font-semibold text-slate-900">What you get</p>
          <p>· A private “My reports” list for non-anonymous submissions.</p>
          <p>· Status tracking without needing to keep a tracking code.</p>
          <p>· The same anonymous reporting and SOS access as a guest.</p>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-slate-500">
          By creating an account you agree to use the platform responsibly. This is a college prototype: do not
          upload real evidence of a crime unless you understand that it is stored on this local machine.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {formError}
            </div>
          ) : null}

          <Field label="Display name" htmlFor="displayName" error={errors.displayName?.message} required>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="displayName"
                className="pl-9"
                placeholder="How should we address you?"
                invalid={Boolean(errors.displayName)}
                {...register('displayName')}
              />
            </div>
          </Field>

          <Field label="Email address" htmlFor="email" error={errors.email?.message} required>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="pl-9"
                placeholder="you@example.com"
                invalid={Boolean(errors.email)}
                {...register('email')}
              />
            </div>
          </Field>

          <Field
            label="Phone number (optional)"
            htmlFor="phone"
            hint="Only stored if you choose to provide it. Never required for reporting."
            error={errors.phone?.message}
          >
            <Input id="phone" placeholder="+91 …" invalid={Boolean(errors.phone)} {...register('phone')} />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            hint="8-72 characters, including a letter and a number."
            error={errors.password?.message}
            required
          >
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                className="pl-9"
                placeholder="••••••••"
                invalid={Boolean(errors.password)}
                {...register('password')}
              />
            </div>
          </Field>

          <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              invalid={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
            />
          </Field>

          <Button type="submit" className="w-full" size="lg" loading={isSubmitting} icon={<ArrowRight className="h-4 w-4" />}>
            Create account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
