// Sirve el service worker compilado por Serwist (05 §8.1, FE-52, CP-17). Estático: se genera en `next build`; no lee
// la sesión ni la base. Sin mapa de fuentes público (V5-29): `/serwist/sw.js.map` no existe.
import { createSerwistRoute } from '@serwist/turbopack';

// La revisión del precache de `/sin-conexion`: el commit de CI o, sin él, una por compilación.
const revision =
  process.env['VERCEL_GIT_COMMIT_SHA'] ?? process.env['GITHUB_SHA'] ?? crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute(
  {
    swSrc: 'src/sw/sw.ts',
    useNativeEsbuild: true,
    esbuildOptions: { sourcemap: false },
    globIgnores: ['**/*.map'],
    additionalPrecacheEntries: [{ url: '/sin-conexion', revision }],
  },
);
