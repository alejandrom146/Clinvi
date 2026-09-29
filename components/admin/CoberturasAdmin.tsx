'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Pencil, Plus, Search, ShieldCheck, Users } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Badge, { estadoTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Card';
import { Field, Input, Select } from '@/components/ui/Field';
import { actualizarCobertura, cambiarActivoCobertura, crearCobertura, listarProfesionalesDeCobertura } from '@/lib/actions/coberturas';
import { buscarCoberturas, coberturaDuplicada, ordenarCoberturas, siglaVisible, tipoCoberturaLabel, validarCobertura } from '@/lib/coberturas';
import { ESTADO_PROFESIONAL_LABEL, PROVINCIAS, TIPO_COBERTURA_VALUES, TIPOS_COBERTURA } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import type { CoberturaAdmin, CoberturaInput, Profesional, TipoCobertura } from '@/types';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';
type ProfesionalResumen = Pick<Profesional, 'id' | 'nombre' | 'especialidad' | 'estado'>;

const VACIO: CoberturaInput = { tipo: 'obra_social_nacional', nombre: '', sigla: '', provincia: '', notas: '' };

function FormCampos({ id, valor, onChange }: { id: string; valor: CoberturaInput; onChange: (v: CoberturaInput) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Tipo" htmlFor={`${id}-tipo`} required>
        <Select id={`${id}-tipo`} value={valor.tipo} onChange={(e) => onChange({ ...valor, tipo: e.target.value as TipoCobertura })}>
          {TIPOS_COBERTURA.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Provincia" htmlFor={`${id}-prov`} required={valor.tipo === 'obra_social_provincial'} hint="Solo si la cobertura corresponde a una provincia.">
        <Select id={`${id}-prov`} value={valor.provincia} onChange={(e) => onChange({ ...valor, provincia: e.target.value })}>
          <option value="">Sin provincia</option>
          {PROVINCIAS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Nombre completo" htmlFor={`${id}-nombre`} required>
        <Input id={`${id}-nombre`} value={valor.nombre} onChange={(e) => onChange({ ...valor, nombre: e.target.value })} maxLength={160} />
      </Field>
      <Field label="Sigla (opcional)" htmlFor={`${id}-sigla`}>
        <Input id={`${id}-sigla`} value={valor.sigla} onChange={(e) => onChange({ ...valor, sigla: e.target.value })} maxLength={40} />
      </Field>
      <Field label="Notas (opcional)" htmlFor={`${id}-notas`} className="sm:col-span-2">
        <Input id={`${id}-notas`} value={valor.notas} onChange={(e) => onChange({ ...valor, notas: e.target.value })} maxLength={500} />
      </Field>
    </div>
  );
}

export default function CoberturasAdmin({ coberturas }: { coberturas: CoberturaAdmin[] }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<'' | TipoCobertura>('');
  const [provincia, setProvincia] = useState('');
  const [estado, setEstado] = useState<FiltroEstado>('todos');
  const [texto, setTexto] = useState('');
  const [nuevo, setNuevo] = useState<CoberturaInput>(VACIO);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CoberturaInput>(VACIO);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [verId, setVerId] = useState<string | null>(null);
  const [asociados, setAsociados] = useState<{ id: string; estado: 'cargando' | 'error' | 'ok'; lista: ProfesionalResumen[] } | null>(null);

  const provinciasUsadas = useMemo(() => PROVINCIAS.filter((p) => coberturas.some((c) => c.provincia === p)), [coberturas]);
  const lista = useMemo(
    () =>
      ordenarCoberturas(
        buscarCoberturas(coberturas, texto)
          .filter((c) => !tipo || c.tipo === tipo)
          .filter((c) => !provincia || c.provincia === provincia)
          .filter((c) => estado === 'todos' || (estado === 'activos') === c.activo),
      ),
    [coberturas, texto, tipo, provincia, estado],
  );

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

  function validar(v: CoberturaInput, exceptoId?: string): string | null {
    const err = validarCobertura(v, PROVINCIAS, TIPO_COBERTURA_VALUES);
    if (err) return err;
    if (coberturaDuplicada(coberturas, v, exceptoId)) return 'Ya existe una cobertura con ese nombre (o esa sigla) en la misma provincia.';
    return null;
  }

  async function onCrear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const err = validar(nuevo);
    if (err) return setMsg({ type: 'error', text: err });
    const ok = await run('nuevo', () => crearCobertura(nuevo), `Cobertura “${nuevo.nombre.trim()}” agregada.`);
    if (ok) {
      setNuevo(VACIO);
      setMostrarNuevo(false);
    }
  }

  async function onGuardar(c: CoberturaAdmin) {
    const err = validar(draft, c.id);
    if (err) return setMsg({ type: 'error', text: err });
    if (
      c.profesionales_count > 0 &&
      (draft.tipo !== c.tipo || (draft.provincia || null) !== c.provincia) &&
      !window.confirm(
        `Esta cobertura está asociada a ${c.profesionales_count} profesional(es). Los vínculos se conservan, pero van a pasar a mostrar los datos corregidos. ¿Continuar?`,
      )
    )
      return;
    const ok = await run(`edit-${c.id}`, () => actualizarCobertura(c.id, draft), 'Cobertura actualizada.');
    if (ok) setEditId(null);
  }

  function onToggle(c: CoberturaAdmin) {
    if (
      c.activo &&
      !window.confirm(
        `¿Desactivar “${c.nombre}”${c.provincia ? ` (${c.provincia})` : ''}?\n\nDeja de aparecer en el buscador y en los formularios.` +
          (c.profesionales_count > 0 ? ` ${c.profesionales_count} profesional(es) la tienen asociada: el vínculo se conserva y vuelve a mostrarse si la reactivás.` : '') +
          '\n\nNo se borra ningún dato.',
      )
    )
      return;
    void run(`tog-${c.id}`, () => cambiarActivoCobertura(c.id, !c.activo), c.activo ? 'Cobertura desactivada.' : 'Cobertura reactivada.');
  }

  async function verAsociados(id: string) {
    if (verId === id) {
      setVerId(null);
      return;
    }
    setVerId(id);
    setAsociados({ id, estado: 'cargando', lista: [] });
    try {
      const lista = await listarProfesionalesDeCobertura(id);
      setAsociados({ id, estado: 'ok', lista });
    } catch {
      setAsociados({ id, estado: 'error', lista: [] });
    }
  }

  const activas = coberturas.filter((c) => c.activo).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {coberturas.length} coberturas · {activas} activas · {coberturas.length - activas} inactivas
        </p>
        {!mostrarNuevo && (
          <Button onClick={() => { setMostrarNuevo(true); setMsg(null); }}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar cobertura
          </Button>
        )}
      </div>

      {mostrarNuevo && (
        <form onSubmit={onCrear} className="space-y-4 rounded-clinvi-lg border border-line-light bg-white p-5 shadow-clinvi-sm sm:p-6" noValidate>
          <p className="flex items-center gap-2 font-semibold text-ink">
            <Plus className="h-4 w-4 text-forest" aria-hidden="true" />
            Nueva cobertura
          </p>
          <FormCampos id="nc" valor={nuevo} onChange={setNuevo} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={busy === 'nuevo'}>
              Agregar
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setMostrarNuevo(false); setNuevo(VACIO); }}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {msg && <Alert variant={msg.type}>{msg.text}</Alert>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input aria-label="Buscar por nombre o sigla" placeholder="Buscar por nombre o sigla" value={texto} onChange={(e) => setTexto(e.target.value)} className="pl-10" />
        </div>
        <Select aria-label="Filtrar por tipo" value={tipo} onChange={(e) => setTipo(e.target.value as '' | TipoCobertura)}>
          <option value="">Todos los tipos</option>
          {TIPOS_COBERTURA.map((t) => (
            <option key={t.value} value={t.value}>
              {t.plural} ({coberturas.filter((c) => c.tipo === t.value).length})
            </option>
          ))}
        </Select>
        <Select aria-label="Filtrar por provincia" value={provincia} onChange={(e) => setProvincia(e.target.value)}>
          <option value="">Todas las provincias</option>
          {provinciasUsadas.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Select aria-label="Filtrar por estado" value={estado} onChange={(e) => setEstado(e.target.value as FiltroEstado)}>
          <option value="todos">Activas e inactivas</option>
          <option value="activos">Solo activas</option>
          <option value="inactivos">Solo inactivas</option>
        </Select>
      </div>

      {lista.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No hay coberturas con esos filtros" />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-clinvi-lg border border-line-light bg-white shadow-clinvi-sm">
          {lista.map((c) => {
            const sigla = siglaVisible(c);
            return (
              <li key={c.id} className={cn('p-4 sm:p-5', !c.activo && 'bg-canvas')}>
                {editId === c.id ? (
                  <div className="space-y-3">
                    <FormCampos id={`ed-${c.id}`} valor={draft} onChange={setDraft} />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" loading={busy === `edit-${c.id}`} onClick={() => onGuardar(c)}>
                        Guardar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('font-semibold', c.activo ? 'text-ink' : 'text-muted')}>
                          {c.nombre}
                          {sigla && <span className="font-normal text-muted"> ({sigla})</span>}
                        </span>
                        <Badge tone="brand">{tipoCoberturaLabel(c.tipo)}</Badge>
                        {c.provincia && <Badge>{c.provincia}</Badge>}
                        <Badge tone={c.activo ? 'success' : 'neutral'}>{c.activo ? 'Activa' : 'Inactiva'}</Badge>
                      </div>
                      {c.notas && <p className="mt-1 text-sm text-muted">{c.notas}</p>}
                      <button
                        type="button"
                        onClick={() => void verAsociados(c.id)}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline disabled:text-muted disabled:no-underline"
                        disabled={c.profesionales_count === 0}
                        aria-expanded={verId === c.id}
                      >
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {c.profesionales_count === 1 ? '1 profesional asociado' : `${c.profesionales_count} profesionales asociados`}
                      </button>
                      {verId === c.id && asociados?.id === c.id && (
                        <div className="mt-2 rounded-xl bg-canvas p-3 text-sm">
                          {asociados.estado === 'cargando' && <p className="text-muted">Cargando…</p>}
                          {asociados.estado === 'error' && <p className="text-danger">No se pudo cargar la lista. Intentá nuevamente.</p>}
                          {asociados.estado === 'ok' && (
                            <ul className="space-y-1">
                              {asociados.lista.map((p) => (
                                <li key={p.id} className="flex flex-wrap items-center gap-2">
                                  <a href={`/admin/profesionales/${p.id}`} className="font-medium text-ink hover:text-brand-700 hover:underline">
                                    {p.nombre}
                                  </a>
                                  <span className="text-xs text-muted">{p.especialidad}</span>
                                  <Badge tone={estadoTone(p.estado)}>{ESTADO_PROFESIONAL_LABEL[p.estado]}</Badge>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditId(c.id);
                          setDraft({ tipo: c.tipo, nombre: c.nombre, sigla: c.sigla ?? '', provincia: c.provincia ?? '', notas: c.notas ?? '' });
                          setMsg(null);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Editar
                      </Button>
                      <Button size="sm" variant={c.activo ? 'ghost' : 'secondary'} loading={busy === `tog-${c.id}`} onClick={() => onToggle(c)}>
                        {c.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
