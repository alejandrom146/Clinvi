import type { LucideIcon } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, hint }: { label: string; value: string; icon: LucideIcon; hint?: string }) {
  return (
    <div className="rounded-clinvi border border-line-light bg-white p-5 shadow-clinvi-sm sm:p-[22px]">
      <div className="flex items-start justify-between gap-2">
        <p className="font-serif text-[34px] font-bold leading-none text-forest">{value}</p>
        <Icon className="h-4 w-4 text-mist" aria-hidden="true" />
      </div>
      <p className="mt-1.5 text-[13px] text-muted">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
