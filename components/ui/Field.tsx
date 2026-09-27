import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const base =
  'w-full rounded-[9px] border-[1.5px] border-line bg-cream px-4 text-sm text-ink placeholder:text-soft transition-colors duration-150 ' +
  'focus:border-forest focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest/10 ' +
  'disabled:cursor-not-allowed disabled:bg-cream-dark disabled:text-muted';

const invalidCls = 'border-danger/50 focus:border-danger focus:ring-danger/10';

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, error, hint, required, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-[0.04em] text-muted">
        {label}
        {required && <span className="text-terra-strong"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type Invalid = { invalid?: boolean };

export function Input({ className, invalid, ...props }: InputHTMLAttributes<HTMLInputElement> & Invalid) {
  return <input className={cn(base, 'h-11', invalid && invalidCls, className)} aria-invalid={invalid || undefined} {...props} />;
}

export function Textarea({ className, invalid, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & Invalid) {
  return (
    <textarea
      className={cn(base, 'min-h-[96px] resize-y py-3 leading-relaxed', invalid && invalidCls, className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Select({ className, invalid, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & Invalid) {
  return (
    <select className={cn(base, 'h-11 cursor-pointer pr-8', invalid && invalidCls, className)} aria-invalid={invalid || undefined} {...props}>
      {children}
    </select>
  );
}
