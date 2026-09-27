import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import '@/styles/globals.css';

const sans = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-sans', display: 'swap' });
const serif = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-serif', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'ClinVi — Clínica Interdisciplinaria Virtual', template: '%s · ClinVi' },
  description: 'Consultá con profesionales de la salud verificados de forma virtual. Reservá tu turno en minutos, sin intermediarios.',
};

export const viewport: Viewport = {
  themeColor: '#2D4A42',
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
