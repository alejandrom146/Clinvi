'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { Star } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import { crearResena } from '@/lib/actions/resenas';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';

const LABELS = ['', 'Mala', 'Regular', 'Buena', 'Muy buena', 'Excelente'];

export default function ReviewButton({ profesionalId, nombreProfesional }: { profesionalId: string; nombreProfesional: string }) {
  const [open, setOpen] = useState(false);
  const [puntuacion, setPuntuacion] = useState(0);
  const [hover, setHover] = useState(0);
  const [nombre, setNombre] = useState('');
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    if (enviado) {
      setEnviado(false);
      setPuntuacion(0);
      setNombre('');
      setComentario('');
    }
  }, [enviado]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (puntuacion < 1) {
      setError('Elegí una puntuación de 1 a 5 estrellas.');
      return;
    }
    if (comentario.length > 1000) {
      setError('El comentario no puede superar los 1000 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await crearResena({ profesionalId, puntuacion, nombre, comentario });
      setEnviado(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const activo = hover || puntuacion;

  return (
    <>
      <Button variant="outlineAccent" size="sm" onClick={() => setOpen(true)}>
        <Star className="h-4 w-4" aria-hidden="true" />
        Calificar
      </Button>
      <Modal open={open} onClose={close} title="Calificar profesional" description={nombreProfesional}>
        {enviado ? (
          <div className="space-y-5">
            <Alert variant="success" title="¡Gracias por tu calificación!">
              Las reseñas son moderadas por ClinVi antes de publicarse.
            </Alert>
            <Button className="w-full" onClick={close}>
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div>
              <p className="text-sm font-medium text-ink">¿Cómo fue tu experiencia?</p>
              <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Puntuación">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={puntuacion === n}
                    aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
                    onClick={() => setPuntuacion(n)}
                    onMouseEnter={() => setHover(n)}
                    className="rounded-lg p-1 transition hover:scale-110"
                  >
                    <Star className={cn('h-8 w-8', n <= activo ? 'fill-terra text-terra' : 'fill-cream-dark text-line')} />
                  </button>
                ))}
                <span className="ml-2 text-sm font-medium text-muted">{LABELS[activo]}</span>
              </div>
            </div>
            <Field label="Tu nombre (opcional)" htmlFor="r-nombre">
              <Input id="r-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} />
            </Field>
            <Field label="Comentario (opcional)" htmlFor="r-comentario" hint={`${comentario.length}/1000`}>
              <Textarea id="r-comentario" value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={1000} />
            </Field>
            <p className="text-xs text-muted">Las reseñas son moderadas por ClinVi antes de publicarse.</p>
            {error && <Alert variant="error">{error}</Alert>}
            <Button type="submit" loading={loading} className="w-full">
              Enviar calificación
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
