'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { actualizarPassword } from '@/lib/actions/auth';
import { getErrorMessage } from '@/lib/errors';

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (password !== password2) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    try {
      await actualizarPassword(password);
      setOk(true);
      setTimeout(() => {
        router.push('/panel');
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (ok) {
    return <Alert variant="success" title="Contraseña actualizada">Te estamos llevando a tu panel…</Alert>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Nueva contraseña" htmlFor="new-pass">
        <Input id="new-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </Field>
      <Field label="Repetir contraseña" htmlFor="new-pass2">
        <Input id="new-pass2" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" />
      </Field>
      {error && <Alert variant="error">{error}</Alert>}
      <Button type="submit" loading={loading} className="w-full">
        Guardar contraseña
      </Button>
    </form>
  );
}
