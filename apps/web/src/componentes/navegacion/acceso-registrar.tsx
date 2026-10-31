'use client';
// `AccesoRegistrar` (05 §3.3, N1): un enlace «Registrar» a `ruta` (`/registrar`, o el gasto con la cuenta desde un detalle
// de cuenta). Botón principal de la barra superior en teléfono y a todo el ancho en la barra lateral (06-identidad-visual 3.1).
import { navegacion } from '../../textos/navegacion';
import { Icono } from '../base/icono';
import { EnlaceFinn } from './enlace-finn';

/** N1: Registrar desde un detalle de cuenta abre el gasto con esa cuenta; desde cualquier otra pantalla, `/registrar`. */
export function rutaRegistrar(pathname: string): string {
  const detalle = /^\/cuentas\/([^/]+)$/.exec(pathname);
  return detalle?.[1] === undefined
    ? '/registrar'
    : `/registrar/gasto?cuenta=${encodeURIComponent(detalle[1])}`;
}

// Mapa de clases literales (L13).
const VARIANTES = {
  barra:
    'text-etiqueta inline-flex h-11 items-center justify-center gap-1.5 rounded-control bg-accion pr-3.5 pl-2.5 font-bold text-texto-sobre-accion',
  lateral:
    'text-etiqueta inline-flex h-11 w-full items-center justify-center gap-2 rounded-control bg-accion px-3 font-bold text-texto-sobre-accion',
} as const;

export function AccesoRegistrar({
  ruta,
  variante,
}: {
  readonly ruta: string;
  readonly variante: keyof typeof VARIANTES;
}) {
  return (
    <EnlaceFinn href={ruta} className={VARIANTES[variante]}>
      <Icono nombre="plus" tamano={18} />
      {navegacion.registrar}
    </EnlaceFinn>
  );
}
