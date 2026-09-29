import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Pruebas unitarias: lógica pura con datos controlados. NUNCA llaman a Supabase.
// Las pruebas de integración usan vitest.integration.config.mts.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    restoreMocks: true,
    // Si alguna prueba intentara usar Supabase de verdad, fallaría: sin credenciales.
    env: { NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_ANON_KEY: '' },
  },
});
