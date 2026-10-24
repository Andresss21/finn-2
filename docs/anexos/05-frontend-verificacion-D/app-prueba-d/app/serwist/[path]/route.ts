// Sirve el service worker compilado por Serwist (CP-17). Estático: se genera en `next build`.
import { createSerwistRoute } from '@serwist/turbopack';
const revision = process.env.FINN_VERSION ?? crypto.randomUUID();
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: 'sw/sw.ts',
  useNativeEsbuild: true,
  esbuildOptions: { sourcemap: false },
  globIgnores: ['**/*.map'],
  additionalPrecacheEntries: [{ url: '/sin-conexion', revision }],
});
