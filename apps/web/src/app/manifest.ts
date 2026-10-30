// Manifiesto de la PWA (05 §8.2). Los colores no pueden ser variables CSS: salen de tokens.json
// (`marca-icono-fondo`, 10.11). Sin `orientation` (WCAG 1.3.4, 11.8).
import type { MetadataRoute } from 'next';
import tokens from './tokens.json' with { type: 'json' };

export default function manifest(): MetadataRoute.Manifest {
  const color = tokens.color['marca-icono-fondo'].claro;
  return {
    id: '/',
    start_url: '/',
    scope: '/',
    name: 'Finn',
    short_name: 'Finn',
    description: 'Tu presupuesto base cero.',
    lang: 'es-SV',
    dir: 'ltr',
    display: 'standalone',
    background_color: color,
    theme_color: color,
    icons: [
      { src: '/marca/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/marca/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/marca/icono-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      { name: 'Registrar gasto', url: '/registrar/gasto' },
      { name: 'Bandeja', url: '/bandeja' },
    ],
  };
}
