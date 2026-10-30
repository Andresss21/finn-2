// Layout raíz (05 §1.2, FE-02): `<html lang="es">`. No lee la sesión, para que `ingresar` y `sin-conexion` no
// dependan de ella. Suma el tema (CF-10), las fuentes autohospedadas (FE-42) y los estilos (FE-40); el manifiesto
// lo suma TA-223.
import type { Metadata, Viewport } from 'next';
import { Archivo, Big_Shoulders } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { ProveedorTema } from '../componentes/marco/proveedor-tema';
import tokens from './tokens.json' with { type: 'json' };

export const metadata: Metadata = { title: 'Finn' };

// `fondo` de los dos temas (tokens.json), por preferencia del sistema (05 §10.6).
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: tokens.color.fondo.claro },
    { media: '(prefers-color-scheme: dark)', color: tokens.color.fondo.oscuro },
  ],
};

// Archivo variable con los ejes de peso y de ancho; Big Shoulders (el catálogo de next/font ya no lista "Display")
// solo 700 y 800 (06-identidad-visual §1).
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
  variable: '--tipo-cuerpo',
});
const titulos = Big_Shoulders({
  subsets: ['latin'],
  weight: ['700', '800'],
  display: 'swap',
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
