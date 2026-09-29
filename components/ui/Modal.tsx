'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, description, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-[3px]" onClick={onClose} aria-hidden="true" />
      <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-clinvi-xl bg-white p-6 shadow-clinvi-lg sm:max-w-[500px] sm:rounded-clinvi-xl sm:p-9">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-cream text-soft transition-colors hover:bg-cream-dark hover:text-ink"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="pr-10 text-2xl font-normal">{title}</h2>
        {description && <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
