'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { filtrosToQuery } from '@/lib/search';

export default function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(() => router.push(`/buscar${filtrosToQuery({ q })}`));
  }

  return (
    <form onSubmit={onSubmit} role="search" className="flex w-full overflow-hidden rounded-xl border-[1.5px] border-line bg-white shadow-clinvi-md">
      <label htmlFor="hero-search" className="sr-only">
        Buscar profesionales
      </label>
      <input
        id="hero-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Psicólogo, nutricionista, médico clínico..."
        className="min-w-0 flex-1 bg-transparent px-5 py-[15px] text-[15px] text-ink placeholder:text-soft focus:outline-none"
        maxLength={100}
      />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex shrink-0 items-center gap-2 bg-terra-strong px-5 text-[15px] font-semibold text-white transition-colors hover:bg-terra-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white sm:px-6"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Buscar
      </button>
    </form>
  );
}
