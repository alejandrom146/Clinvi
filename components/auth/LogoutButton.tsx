'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import Button from '@/components/ui/Button';
import { logout } from '@/lib/actions/auth';
import { cn } from '@/lib/utils';

export default function LogoutButton({ className, variant = 'outline' }: { className?: string; variant?: 'outline' | 'ghost' }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await logout();
    } finally {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <Button variant={variant} size="sm" onClick={onClick} loading={loading} className={cn(className)}>
      {!loading && <LogOut className="h-4 w-4" aria-hidden="true" />}
      Cerrar sesión
    </Button>
  );
}
