import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'success' | 'error' | 'info' | 'warning';

const styles: Record<Variant, string> = {
  success: 'border-forest/20 bg-forest/[0.07] text-forest',
  error: 'border-terra/30 bg-terra/[0.08] text-danger',
  info: 'border-line bg-cream text-muted',
  warning: 'border-terra/30 bg-terra-light/60 text-terra-deep',
};

const icons = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle };

export default function Alert({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: Variant;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = icons[variant];
  return (
    <div className={cn('flex gap-3 rounded-[9px] border px-4 py-3 text-sm', styles[variant], className)} role={variant === 'error' ? 'alert' : 'status'}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}
