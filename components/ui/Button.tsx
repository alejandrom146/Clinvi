import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'outline' | 'outlineAccent' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-forest text-white hover:bg-forest-mid',
  accent: 'bg-terra-strong text-white hover:bg-terra-deep',
  secondary: 'border-[1.5px] border-line bg-cream text-forest hover:border-forest/40 hover:bg-cream-dark',
  outline: 'border-[1.5px] border-forest bg-transparent text-forest hover:bg-cream',
  outlineAccent: 'border-[1.5px] border-terra-strong bg-transparent text-terra-deep hover:bg-terra-light/60',
  ghost: 'text-muted hover:bg-cream hover:text-ink',
  danger: 'bg-danger text-white hover:bg-danger/90',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string): string {
  return cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-clinvi font-semibold transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
    'disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant],
    sizes[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
