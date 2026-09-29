import { cn, initials } from '@/lib/utils';

const sizes = {
  sm: 'h-[42px] w-[42px] text-sm',
  md: 'h-[58px] w-[58px] text-xl',
  lg: 'h-24 w-24 border-4 border-white text-[32px] shadow-clinvi-md',
};

// Degradados de la paleta ClinVi (forest→mist, terra, mist).
const GRADIENTS = [
  'bg-gradient-to-br from-forest to-mist',
  'bg-gradient-to-br from-terra to-[#D69A78]',
  'bg-gradient-to-br from-mist to-[#A3B0AB]',
];

function gradientFor(nombre: string): string {
  let h = 0;
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

export default function Avatar({
  nombre,
  src,
  size = 'md',
  className,
}: {
  nombre: string;
  src?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={nombre} className={cn('shrink-0 rounded-full object-cover', sizes[size], className)} />
    );
  }
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-full font-serif font-normal text-white', gradientFor(nombre), sizes[size], className)}
      role="img"
      aria-label={nombre}
    >
      {initials(nombre)}
    </div>
  );
}
