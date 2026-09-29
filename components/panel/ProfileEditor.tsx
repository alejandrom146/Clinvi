'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import Alert from '@/components/ui/Alert';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { actualizarAvatar, actualizarPerfil, guardarCoberturas, guardarMotivos } from '@/lib/actions/profesional';
import CoberturasSelector from '@/components/coberturas/CoberturasSelector';
import { mismaSeleccion, seleccionValida } from '@/lib/coberturas';
import MotivosSelector from '@/components/motivos/MotivosSelector';
import { confirmarCambioEspecialidad, motivosDeEspecialidad } from '@/lib/motivos';
import { ESPECIALIDAD_NOMBRES, ESTADO_PROFESIONAL_LABEL, MODALIDADES, PROVINCIAS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { splitList } from '@/lib/utils';
import { hasErrors, parsePrecio, validateAvatar, validateMotivos, validatePerfil, type DatosPerfil, type Errores } from '@/lib/validation';
import type { Cobertura, EstadoProfesional, Modalidad, MotivoConsulta, PerfilEditable, Profesional } from '@/types';

interface Props {
  profesional: Profesional;
  mode: 'profesional' | 'admin';
  /** Motivos activos (de todas las especialidades). */
  motivos: MotivoConsulta[];
  /** Motivos activos actualmente seleccionados. */
  motivoIds: string[];
  /** Coberturas activas de la lista maestra. */
  coberturas: Cobertura[];
  /** Coberturas activas actualmente seleccionadas. */
  coberturaIds: string[];
}

interface FormState extends DatosPerfil {
  matricula: string;
  provincia: string;
  habilidades: string;
  modalidad: Modalidad;
  estado: EstadoProfesional;
}

export default function ProfileEditor({ profesional: p, mode, motivos, motivoIds: motivoIdsIniciales, coberturas, coberturaIds: coberturaIdsIniciales }: Props) {
  const router = useRouter();
  const [f, setF] = useState<FormState>({
    nombre: p.nombre,
    especialidad: p.especialidad,
    subtitulo: p.subtitulo ?? '',
    matricula: p.matricula ?? '',
    provincia: p.provincia ?? '',
    bio: p.bio ?? '',
    habilidades: p.habilidades.join(', '),
    modalidad: p.modalidad,
    precio: p.precio === null ? '' : String(p.precio),
    whatsapp: p.whatsapp ?? '',
    estado: p.estado,
  });
  const [errores, setErrores] = useState<Errores<keyof DatosPerfil>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(p.avatar_url);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [motivoIds, setMotivoIds] = useState<string[]>(motivoIdsIniciales);
  const [motivosError, setMotivosError] = useState<string | undefined>(undefined);
  const [coberturaIds, setCoberturaIds] = useState<string[]>(coberturaIdsIniciales);
  const [coberturasGuardadas, setCoberturasGuardadas] = useState<string[]>(coberturaIdsIniciales);
  const [coberturasError, setCoberturasError] = useState<string | undefined>(undefined);
  const coberturasPendientes = !mismaSeleccion(coberturaIds, coberturasGuardadas);

  function cambiarEspecialidad(nueva: string) {
    const r = confirmarCambioEspecialidad(motivoIds, motivos, nueva);
    if (r === null) return;
    setMotivoIds(r);
    setMotivosError(undefined);
    set('especialidad', nueva);
  }

  const isAdmin = mode === 'admin';
  const especialidades = ESPECIALIDAD_NOMBRES.includes(p.especialidad) ? ESPECIALIDAD_NOMBRES : [p.especialidad, ...ESPECIALIDAD_NOMBRES];

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
    setMsg(null);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = validatePerfil(f);
    setErrores(v);
    const errMotivos = validateMotivos(motivoIds, motivosDeEspecialidad(motivos, f.especialidad).length);
    setMotivosError(errMotivos);
    if (hasErrors(v) || errMotivos) {
      setMsg({ type: 'error', text: 'Revisá los campos marcados.' });
      return;
    }
    const precio = parsePrecio(f.precio);
    const payload: PerfilEditable = {
      nombre: f.nombre.trim(),
      especialidad: f.especialidad,
      subtitulo: f.subtitulo.trim() || null,
      provincia: f.provincia || null,
      bio: f.bio.trim() || null,
      habilidades: splitList(f.habilidades),
      modalidad: f.modalidad,
      precio: precio === 'invalid' ? null : precio,
      whatsapp: f.whatsapp.trim() || null,
    };
    if (isAdmin) {
      payload.matricula = f.matricula.trim() || null;
      payload.estado = f.estado;
    }
    setSaving(true);
    try {
      // 1) Perfil (si cambió la especialidad, la base elimina los vínculos incompatibles).
      await actualizarPerfil(p.id, payload);
    } catch (err) {
      setMsg({ type: 'error', text: getErrorMessage(err) });
      setSaving(false);
      return;
    }
    const fallas: string[] = [];
    try {
      // 2) Motivos (validados otra vez en la base: dueño/admin, especialidad, activos, 1..8).
      await guardarMotivos(p.id, motivoIds);
    } catch (err) {
      fallas.push(`los motivos de consulta (${getErrorMessage(err)})`);
    }
    if (coberturasPendientes) {
      try {
        // 3) Coberturas (validadas en la base: dueño/admin, existentes y activas).
        const ids = seleccionValida(coberturaIds, coberturas);
        await guardarCoberturas(p.id, ids);
        setCoberturaIds(ids);
        setCoberturasGuardadas(ids);
        setCoberturasError(undefined);
      } catch (err) {
        const texto = getErrorMessage(err);
        setCoberturasError(texto);
        fallas.push(`las coberturas (${texto})`);
      }
    }
    // Solo se confirma el guardado cuando la base respondió sin errores.
    setMsg(
      fallas.length === 0
        ? { type: 'success', text: 'Cambios guardados correctamente.' }
        : { type: 'error', text: `Los datos del perfil se guardaron, pero no ${fallas.join(' ni ')}.` },
    );
    setSaving(false);
    router.refresh();
  }

  async function onAvatar(file: File | null) {
    setAvatarError(null);
    if (!file || !p.user_id) return;
    const err = validateAvatar(file);
    if (err) return setAvatarError(err);
    setAvatarLoading(true);
    try {
      const url = await actualizarAvatar(p.id, p.user_id, file);
      setAvatarUrl(url);
      router.refresh();
    } catch (e) {
      setAvatarError(getErrorMessage(e));
    } finally {
      setAvatarLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {!isAdmin && (
        <div className="flex flex-col gap-4 rounded-clinvi-lg border border-line-light bg-white shadow-clinvi-sm p-5 sm:flex-row sm:items-center">
          <Avatar nombre={f.nombre || p.nombre} src={avatarUrl} size="lg" />
          <div className="space-y-2">
            <p className="font-semibold text-ink">Foto de perfil</p>
            <p className="text-xs text-muted">JPG, PNG o WebP, máximo 2 MB.</p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100">
              {avatarLoading ? 'Subiendo…' : 'Cambiar foto'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={avatarLoading}
                onChange={(e) => void onAvatar(e.target.files?.[0] ?? null)}
              />
            </label>
            {avatarError && <p className="text-xs font-medium text-danger">{avatarError}</p>}
          </div>
        </div>
      )}

      <div className="space-y-4 rounded-clinvi-lg border border-line-light bg-white shadow-clinvi-sm p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="pe-nombre" error={errores.nombre} required>
            <Input id="pe-nombre" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} invalid={Boolean(errores.nombre)} maxLength={120} />
          </Field>
          <Field label="Especialidad" htmlFor="pe-esp" error={errores.especialidad} required>
            <Select id="pe-esp" value={f.especialidad} onChange={(e) => cambiarEspecialidad(e.target.value)}>
              {especialidades.map((esp) => (
                <option key={esp} value={esp}>
                  {esp}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Matrícula"
            htmlFor="pe-mat"
            hint={isAdmin ? undefined : 'La matrícula solo la puede modificar un administrador.'}
          >
            <Input id="pe-mat" value={f.matricula} onChange={(e) => set('matricula', e.target.value)} disabled={!isAdmin} />
          </Field>
          <Field label="Provincia" htmlFor="pe-prov">
            <Select id="pe-prov" value={f.provincia} onChange={(e) => set('provincia', e.target.value)}>
              <option value="">Sin especificar</option>
              {PROVINCIAS.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Subtítulo" htmlFor="pe-sub" error={errores.subtitulo}>
          <Input id="pe-sub" value={f.subtitulo} onChange={(e) => set('subtitulo', e.target.value)} maxLength={160} />
        </Field>
        <Field label="Presentación / descripción" htmlFor="pe-bio" error={errores.bio}>
          <Textarea id="pe-bio" value={f.bio} onChange={(e) => set('bio', e.target.value)} maxLength={3000} className="min-h-[140px]" />
        </Field>
        <Field label="Habilidades" htmlFor="pe-hab" hint="Separadas por coma">
          <Input id="pe-hab" value={f.habilidades} onChange={(e) => set('habilidades', e.target.value)} />
        </Field>
        <MotivosSelector
          especialidad={f.especialidad}
          motivos={motivos}
          value={motivoIds}
          onChange={(ids) => {
            setMotivoIds(ids);
            setMotivosError(undefined);
            setMsg(null);
          }}
          error={motivosError}
        />
        <CoberturasSelector
          coberturas={coberturas}
          value={coberturaIds}
          onChange={(ids) => {
            setCoberturaIds(ids);
            setCoberturasError(undefined);
            setMsg(null);
          }}
          error={coberturasError}
          pendiente={coberturasPendientes}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Modalidad" htmlFor="pe-mod">
            <Select id="pe-mod" value={f.modalidad} onChange={(e) => set('modalidad', e.target.value as Modalidad)}>
              {MODALIDADES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Precio (ARS)" htmlFor="pe-precio" error={errores.precio} hint="Vacío = A convenir">
            <Input id="pe-precio" inputMode="numeric" value={f.precio} onChange={(e) => set('precio', e.target.value)} invalid={Boolean(errores.precio)} />
          </Field>
          <Field label="WhatsApp" htmlFor="pe-wa" error={errores.whatsapp}>
            <Input id="pe-wa" type="tel" value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} invalid={Boolean(errores.whatsapp)} />
          </Field>
        </div>
        {isAdmin && (
          <Field label="Estado" htmlFor="pe-estado" hint="Solo los perfiles activos aparecen en el buscador.">
            <Select id="pe-estado" value={f.estado} onChange={(e) => set('estado', e.target.value as EstadoProfesional)}>
              {(Object.keys(ESTADO_PROFESIONAL_LABEL) as EstadoProfesional[]).map((est) => (
                <option key={est} value={est}>
                  {ESTADO_PROFESIONAL_LABEL[est]}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      {msg && <Alert variant={msg.type}>{msg.text}</Alert>}
      <div className="flex justify-end">
        <Button type="submit" loading={saving} size="lg">
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
