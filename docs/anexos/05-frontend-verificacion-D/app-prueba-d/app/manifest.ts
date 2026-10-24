import type { MetadataRoute } from 'next';
// Prototipo del manifiesto (05 §8.2). Íconos provisionales: los entrega el diseño (10.11).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/', name: 'Finn', short_name: 'Finn', description: 'Tu presupuesto base cero.',
    lang: 'es-SV', dir: 'ltr', start_url: '/', scope: '/', display: 'standalone',
    background_color: '#FAFAFA', theme_color: '#FAFAFA',
    icons: [
      { src: '/marca/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/marca/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/marca/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
