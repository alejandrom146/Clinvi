import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Isotipo ClinVi: pétalo forest + terracota + slate (trazo). Versión vectorial para fondos oscuros. */
export function Isotipo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M60 5 C73 18, 73 42, 60 55 C47 42, 47 18, 60 5Z" fill="none" stroke={light ? 'rgba(251,248,242,.92)' : '#2F3B37'} strokeWidth="3.4" strokeLinejoin="round" />
      <path d="M60 55 C45 59, 25 51, 24 39 C36 31, 55 41, 60 55Z" fill="none" stroke="#C67B54" strokeWidth="3.4" strokeLinejoin="round" />
      <path d="M60 55 C75 59, 95 51, 96 39 C84 31, 65 41, 60 55Z" fill="none" stroke="#81928C" strokeWidth="3.4" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn('inline-flex items-center gap-2.5', className)} aria-label="ClinVi — Inicio">
      {light ? (
        <Isotipo className="h-8 w-11" light />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/clinvi-logo.jpg" alt="" className="h-9 w-auto object-contain" />
      )}
      <span className={cn('font-serif text-[26px] font-normal', light ? 'text-white' : 'text-forest')}>ClinVi</span>
    </Link>
  );
}
