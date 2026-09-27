'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { solicitarRecuperacion } from '@/lib/actions/auth';
import { getErrorMessage } from '@/lib/errors';
import { isEmail } from '@/lib/validation';

export default function RecoverForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!isEmail(email)) return setError('Ingresá un email válido.');
    setLoading(true);
    try {
      await solicitarRecuperacion(email);
      setEnviado(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (enviado) {
    return (
      <div className="space-y-4">
        <Alert variant="success" title="Revisá tu email">
          Si existe una cuenta con {email}, vas a recibir un enlace para crear una nueva contraseña.
        </Alert>
        <Link href="/ingresar" className="block text-center text-sm font-semibold text-forest hover:text-forest-mid hover:underline">
          Volver a ingresar
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email de tu cuenta" htmlFor="rec-email">
        <Input id="rec-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </Field>
      {error && <Alert variant="error">{error}</Alert>}
      <Button type="submit" loading={loading} className="w-full">
        Enviar enlace
      </Button>
      <Link href="/ingresar" className="block text-center text-sm font-medium text-muted hover:text-brand-700">
        Volver a ingresar
      </Link>
    </form>
  );
}
