import { Database } from 'lucide-react';

export default function SetupNotice() {
  return (
    <div className="mx-auto max-w-2xl rounded-clinvi-lg border border-line bg-cream-dark p-6 sm:p-8">
      <div className="flex items-center gap-3 text-forest">
        <Database className="h-6 w-6" aria-hidden="true" />
        <h2 className="text-lg font-bold">Conectá Supabase para empezar</h2>
      </div>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-forest">
        <li>Creá un proyecto gratuito en supabase.com.</li>
        <li>
          En <strong>SQL Editor</strong> ejecutá <code>supabase/schema.sql</code> y, si querés datos de prueba, <code>supabase/seed.sql</code>.
        </li>
        <li>
          Copiá <code>.env.example</code> a <code>.env.local</code> y completá <code>NEXT_PUBLIC_SUPABASE_URL</code> y{' '}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (Project Settings → API).
        </li>
        <li>
          Reiniciá el servidor con <code>npm run dev</code>.
        </li>
      </ol>
      <p className="mt-4 text-xs text-muted">Las instrucciones completas están en README.md.</p>
    </div>
  );
}
