import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

const controlBase =
  'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50';

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-1 text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          controlBase,
          invalid
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100',
          className,
        )}
        aria-invalid={invalid || undefined}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        controlBase,
        'min-h-[120px] resize-y',
        invalid
          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
          : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        controlBase,
        'pr-8',
        invalid
          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
          : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  );
});

export function CheckboxRow({
  id,
  checked,
  onChange,
  title,
  description,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
        checked ? 'border-brand-300 bg-brand-50/60' : 'border-slate-200 bg-white hover:border-slate-300',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />
      <span>
        <span className="block text-sm font-medium text-slate-900">{title}</span>
        {description ? <span className="mt-0.5 block text-xs text-slate-500">{description}</span> : null}
      </span>
    </label>
  );
}
