'use client';
// `AccesoRegistrar` (05 §3.3, N1): un enlace «Registrar» a `ruta` (`/registrar`, o el gasto con la cuenta desde un detalle
// de cuenta). Botón principal de la barra superior (06-identidad-visual 3.1).
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

export function AccesoRegistrar({ ruta }: { readonly ruta: string }) {
  return (
    <EnlaceFinn
      href={ruta}
      className="text-etiqueta inline-flex h-11 items-center justify-center gap-1.5 rounded-control bg-accion pr-3.5 pl-2.5 font-bold text-texto-sobre-accion"
    >
      <Icono nombre="plus" tamano={18} />
      {navegacion.registrar}
    </EnlaceFinn>
  );
}
