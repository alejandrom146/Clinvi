'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import Alert from '@/components/ui/Alert';
import Button, { buttonClasses } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { login } from '@/lib/actions/auth';
import { getErrorMessage } from '@/lib/errors';
import { isEmail } from '@/lib/validation';

interface Props {
  next?: string;
  onSuccess?: () => void;
}

export default function LoginForm({ next, onSuccess }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!isEmail(email)) return setError('Ingresá un email válido.');
    if (!password) return setError('Ingresá tu contraseña.');

    setLoading(true);
    try {
      const { esAdmin } = await login(email, password);
      onSuccess?.();
      router.push(next ?? (esAdmin ? '/admin' : '/panel'));
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email" htmlFor="login-email">
        <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </Field>
      <Field label="Contraseña" htmlFor="login-password">
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </Field>
      <div className="text-right">
        <Link href="/recuperar" className="text-sm font-medium text-forest hover:text-forest-mid hover:underline">
          Olvidé mi contraseña
        </Link>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <Button type="submit" loading={loading} className="w-full">
        Ingresar
      </Button>
      <Link href="/registro" className={buttonClasses('ghost', 'md', 'w-full border-[1.5px] border-line text-muted')}>
        No tengo cuenta — Registrarme
      </Link>
    </form>
  );
}
