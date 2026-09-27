'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { ListChecks, Pencil, Plus, Search } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Card';
import { Field, Input, Select } from '@/components/ui/Field';
import { actualizarMotivo, cambiarActivoMotivo, crearMotivo } from '@/lib/actions/motivos';
import { ESPECIALIDAD_NOMBRES } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { cn, normalizar } from '@/lib/utils';
import type { MotivoConsulta, MotivoInput } from '@/types';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

const existe = (lista: MotivoConsulta[], especialidad: string, motivo: string, exceptoId?: string) =>
  lista.some((m) => m.id !== exceptoId && m.especialidad === especialidad && normalizar(m.motivo.trim()) === normalizar(motivo.trim()));

export default function MotivosAdmin({ motivos }: { motivos: MotivoConsulta[] }) {
  const router = useRouter();
  const [esp, setEsp] = useState('');
  const [estado, setEstado] = useState<FiltroEstado>('todos');
  const [texto, setTexto] = useState('');
  const [nuevo, setNuevo] = useState<MotivoInput>({ especialidad: '', motivo: '', notas: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ motivo: '', notas: '' });
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const especialidades = useMemo(
    () => Array.from(new Set([...ESPECIALIDAD_NOMBRES, ...motivos.map((m) => m.especialidad)])),
    [motivos],
  );
  const conteo = useMemo(() => {
    const c = new Map<string, number>();
    motivos.forEach((m) => c.set(m.especialidad, (c.get(m.especialidad) ?? 0) + 1));
    return c;
  }, [motivos]);
  const lista = useMemo(() => {
    const t = normalizar(texto.trim());
    return motivos
      .filter((m) => !esp || m.especialidad === esp)
      .filter((m) => estado === 'todos' || (estado === 'activos') === m.activo)
      .filter((m) => !t || normalizar(m.motivo).includes(t))
      .sort((a, b) => a.especialidad.localeCompare(b.especialidad, 'es') || a.motivo.localeCompare(b.motivo, 'es'));
  }, [motivos, esp, estado, texto]);

  async function run(key: string, fn: () => Promise<void>, ok: string): Promise<boolean> {
    setBusy(key);
    setMsg(null);
    try {
      await fn();
      setMsg({ type: 'success', text: ok });
      router.refresh();
      return true;
    } catch (err) {
      setMsg({ type: 'error', text: getErrorMessage(err) });
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function onCrear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nuevo.especialidad) return setMsg({ type: 'error', text: 'Elegí una especialidad.' });
    if (nuevo.motivo.trim().length < 2) return setMsg({ type: 'error', text: 'Escribí el motivo (mínimo 2 caracteres).' });
    if (existe(motivos, nuevo.especialidad, nuevo.motivo)) return setMsg({ type: 'error', text: 'Ya existe ese motivo para esta especialidad.' });
    const ok = await run('nuevo', () => crearMotivo(nuevo), `Motivo agregado a ${nuevo.especialidad}.`);
    if (ok) setNuevo((n) => ({ ...n, motivo: '', notas: '' }));
  }

  async function onGuardar(m: MotivoConsulta) {
    if (draft.motivo.trim().length < 2) return setMsg({ type: 'error', text: 'El motivo debe tener al menos 2 caracteres.' });
    if (existe(motivos, m.especialidad, draft.motivo, m.id)) return setMsg({ type: 'error', text: 'Ya existe ese motivo para esta especialidad.' });
    const ok = await run(`edit-${m.id}`, () => actualizarMotivo(m.id, draft), 'Motivo actualizado.');
    if (ok) setEditId(null);
  }

  function onToggle(m: MotivoConsulta) {
    if (
      m.activo &&
      !window.confirm(
        `¿Desactivar “${m.motivo}” (${m.especialidad})?\n\nDeja de aparecer en el buscador y en los formularios. Los profesionales que lo tengan dejarán de encontrarse por este motivo. Podés reactivarlo cuando quieras.`,
      )
    )
      return;
    void run(`tog-${m.id}`, () => cambiarActivoMotivo(m.id, !m.activo), m.activo ? 'Motivo desactivado.' : 'Motivo reactivado.');
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCrear} className="space-y-4 rounded-clinvi-lg border border-line-light bg-white shadow-clinvi-sm p-5 sm:p-6" noValidate>
        <p className="flex items-center gap-2 font-semibold text-ink">
          <Plus className="h-4 w-4 text-forest" aria-hidden="true" />
          Agregar motivo
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_1.4fr_auto] lg:items-end">
          <Field label="Especialidad" htmlFor="nm-esp" required>
            <Select id="nm-esp" value={nuevo.especialidad} onChange={(e) => setNuevo({ ...nuevo, especialidad: e.target.value })}>
              <option value="">Elegí una opción</option>
              {especialidades.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Motivo" htmlFor="nm-motivo" required>
            <Input id="nm-motivo" value={nuevo.motivo} onChange={(e) => setNuevo({ ...nuevo, motivo: e.target.value })} maxLength={80} />
          </Field>
          <Field label="Notas (opcional)" htmlFor="nm-notas">
            <Input id="nm-notas" value={nuevo.notas} onChange={(e) => setNuevo({ ...nuevo, notas: e.target.value })} maxLength={500} />
          </Field>
          <Button type="submit" loading={busy === 'nuevo'} className="sm:col-span-2 lg:col-span-1">
            Agregar
          </Button>
        </div>
      </form>

      {msg && <Alert variant={msg.type}>{msg.text}</Alert>}

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr]">
        <Select aria-label="Filtrar por especialidad" value={esp} onChange={(e) => setEsp(e.target.value)}>
          <option value="">Todas las especialidades ({motivos.length})</option>
          {especialidades.map((x) => (
            <option key={x} value={x}>
              {x} ({conteo.get(x) ?? 0})
            </option>
          ))}
        </Select>
        <Select aria-label="Filtrar por estado" value={estado} onChange={(e) => setEstado(e.target.value as FiltroEstado)}>
          <option value="todos">Activos e inactivos</option>
          <option value="activos">Solo activos</option>
          <option value="inactivos">Solo inactivos</option>
        </Select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input aria-label="Buscar motivo" placeholder="Buscar motivo" value={texto} onChange={(e) => setTexto(e.target.value)} className="pl-10" />
        </div>
      </div>

      {lista.length === 0 ? (
        <EmptyState icon={ListChecks} title="No hay motivos con esos filtros" />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-clinvi-lg border border-line-light bg-white shadow-clinvi-sm">
          {lista.map((m) => (
            <li key={m.id} className={cn('p-4 sm:p-5', !m.activo && 'bg-canvas')}>
              {editId === m.id ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{m.especialidad}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Motivo" htmlFor={`ed-m-${m.id}`}>
                      <Input id={`ed-m-${m.id}`} value={draft.motivo} onChange={(e) => setDraft({ ...draft, motivo: e.target.value })} maxLength={80} />
                    </Field>
                    <Field label="Notas" htmlFor={`ed-n-${m.id}`}>
                      <Input id={`ed-n-${m.id}`} value={draft.notas} onChange={(e) => setDraft({ ...draft, notas: e.target.value })} maxLength={500} />
                    </Field>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" loading={busy === `edit-${m.id}`} onClick={() => onGuardar(m)}>
                      Guardar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('font-semibold', m.activo ? 'text-ink' : 'text-muted')}>{m.motivo}</span>
                      <Badge tone="brand">{m.especialidad}</Badge>
                      <Badge tone={m.activo ? 'success' : 'neutral'}>{m.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </div>
                    {m.notas && <p className="mt-1 text-sm text-muted">{m.notas}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditId(m.id);
                        setDraft({ motivo: m.motivo, notas: m.notas ?? '' });
                        setMsg(null);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Editar
                    </Button>
                    <Button size="sm" variant={m.activo ? 'ghost' : 'secondary'} loading={busy === `tog-${m.id}`} onClick={() => onToggle(m)}>
                      {m.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
