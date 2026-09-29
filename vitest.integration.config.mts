import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Pruebas de integración contra una base de Supabase DE PRUEBA (nunca producción).
// Requieren CLINVI_TEST_SUPABASE_URL y CLINVI_TEST_SUPABASE_ANON_KEY; sin ellas se omiten.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 20000,
    fileParallelism: false,
  },
});
