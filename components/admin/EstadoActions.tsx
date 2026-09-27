'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { cambiarEstadoProfesional } from '@/lib/actions/profesional';
import { getErrorMessage } from '@/lib/errors';
import type { EstadoProfesional } from '@/types';

type Variant = 'primary' | 'outlineAccent' | 'secondary';

interface Accion {
  estado: EstadoProfesional;
  label: string;
  variant: Variant;
  confirmar?: string;
}

const ACCIONES: Record<EstadoProfesional, Accion[]> = {
  pendiente: [
    { estado: 'activo', label: 'Aprobar', variant: 'primary' },
    { estado: 'rechazado', label: 'Rechazar', variant: 'outlineAccent', confirmar: '¿Rechazar este profesional?' },
  ],
  activo: [{ estado: 'inactivo', label: 'Desactivar', variant: 'outlineAccent', confirmar: '¿Desactivar este perfil? Dejará de aparecer en el buscador.' }],
  rechazado: [{ estado: 'activo', label: 'Aprobar', variant: 'secondary' }],
  inactivo: [{ estado: 'activo', label: 'Reactivar', variant: 'secondary' }],
};

export default function EstadoActions({ id, estado }: { id: string; estado: EstadoProfesional }) {
  const router = useRouter();
  const [loading, setLoading] = useState<EstadoProfesional | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cambiar(a: Accion) {
    if (a.confirmar && !window.confirm(a.confirmar)) return;
    setError(null);
    setLoading(a.estado);
    try {
      await cambiarEstadoProfesional(id, a.estado);
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-2">
        {ACCIONES[estado].map((a) => (
          <Button key={a.estado} size="sm" variant={a.variant} loading={loading === a.estado} disabled={loading !== null} onClick={() => cambiar(a)}>
            {a.label}
          </Button>
        ))}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
