import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Arimo, Tinos } from 'next/font/google';
import '@/styles/globals.css';

const sans = Arimo({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans', display: 'swap' });
const serif = Tinos({ subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'ClinVi — Clínica Interdisciplinaria Virtual', template: '%s · ClinVi' },
  description: 'Consultá con profesionales de la salud verificados de forma virtual. Reservá tu turno en minutos, sin intermediarios.',
};

export const viewport: Viewport = {
  themeColor: '#F5EFE3',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${serif.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
