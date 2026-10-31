// Layout raíz (05 §1.2, FE-02): `<html lang="es">`. No lee la sesión, para que `ingresar` y `sin-conexion` no
// dependan de ella. Suma el tema (CF-10), las fuentes autohospedadas (FE-42) y los estilos (FE-40); el manifiesto
// lo suma TA-223.
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import './globals.css';
import { ProveedorTema } from '../componentes/marco/proveedor-tema';
import tokens from './tokens.json' with { type: 'json' };

// El ícono de Apple (05 §10.11); `icon.svg`, `favicon.ico` y el manifiesto los toma Next de `app/`.
export const metadata: Metadata = {
  title: 'Finn',
  icons: { apple: '/marca/apple-touch-icon.png' },
};

// `fondo` de los dos temas (tokens.json), por preferencia del sistema (05 §10.6).
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: tokens.color.fondo.claro },
    { media: '(prefers-color-scheme: dark)', color: tokens.color.fondo.oscuro },
  ],
};

// Archivos versionados en `src/fuentes/` (CH-58): el build no usa la red. Archivo variable, ejes `wght` 100-900 y `wdth`
// 62-125; Big Shoulders Display solo 700 y 800 (06-identidad-visual §1). `font-stretch` va declarado para que el
// navegador use el eje de ancho.
const archivo = localFont({
  src: '../fuentes/archivo-latin-wdth-normal.woff2',
  weight: '100 900',
  style: 'normal',
  declarations: [{ prop: 'font-stretch', value: '62% 125%' }],
  display: 'swap',
  preload: true,
  variable: '--tipo-cuerpo',
});
const titulos = localFont({
  src: [
    {
      path: '../fuentes/big-shoulders-display-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fuentes/big-shoulders-display-latin-800-normal.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  display: 'swap',
  preload: true,
  variable: '--tipo-titulo',
});

export default function LayoutRaiz({ children }: { readonly children: ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={[archivo.variable, titulos.variable].join(' ')}
    >
      <body>
        <ProveedorTema>{children}</ProveedorTema>
      </body>
    </html>
  );
}
