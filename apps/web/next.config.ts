// 04 §2.2.4 (BE-06) y 05 §6.1 (FE-20): 3 MB para el CSV de OP-45 y ninguna caché de datos. Aquí no se activan
// `cacheComponents` ni `staleTimes`: PRU-E2E-PWA-101 lo comprueba.
import type { NextConfig } from 'next';

const config: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '3mb' },
  },
  // Los paquetes del workspace se publican como TypeScript (`exports` apunta a `src/*.ts`).
  transpilePackages: [
    '@finn/aplicacion',
    '@finn/db',
    '@finn/dominio',
    '@finn/sms',
    '@finn/conciliacion',
  ],
};

export default config;
