import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Isotipo ClinVi: pétalo forest + terracota + slate (trazo). */
export function Isotipo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M60 5 C73 18, 73 42, 60 55 C47 42, 47 18, 60 5Z" fill="none" stroke={light ? 'rgba(255,255,255,.9)' : '#2D4A42'} strokeWidth="3" strokeLinejoin="round" />
      <path d="M60 55 C45 59, 25 51, 24 39 C36 31, 55 41, 60 55Z" fill="none" stroke="rgba(196,122,90,.9)" strokeWidth="3" strokeLinejoin="round" />
      <path d="M60 55 C75 59, 95 51, 96 39 C84 31, 65 41, 60 55Z" fill="none" stroke="rgba(122,152,152,.9)" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn('inline-flex items-center gap-2', className)} aria-label="ClinVi — Inicio">
      <Isotipo className="h-7 w-10" light={light} />
      <span className={cn('font-serif text-2xl font-bold tracking-[-0.3px]', light ? 'text-white' : 'text-forest')}>ClinVi</span>
    </Link>
  );
}
