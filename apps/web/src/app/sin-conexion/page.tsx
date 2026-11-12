// `/sin-conexion` (05 §8.5, FE-56): la página que el service worker devuelve cuando falla una navegación de documento.
// Estática, en el precache, sin sesión ni datos: ningún número y ningún enlace a otras pantallas (todas necesitan red).
// Marcado del export de diseño, pantalla 14 «Sin conexión (página)»: marca arriba y el estado centrado con el glifo `wifioff`.
import type { Metadata } from 'next';
import { Icono } from '../../componentes/base/icono';
import { Marca } from '../../componentes/marco/marca';
import { ReintentarSinConexion } from '../../componentes/marco/reintentar-sin-conexion';
import { navegacion } from '../../textos/navegacion';

export const metadata: Metadata = { title: navegacion.sinConexionPagina.titulo };

export default function PaginaSinConexion() {
  return (
    <div className="flex min-h-dvh flex-col md:items-center md:justify-center md:p-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 pb-10 pt-16 md:rounded-contenedor md:bg-superficie md:p-10 md:shadow-elevacion-2">
        <Marca />
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-pastilla bg-superficie-hundida text-texto"
          >
            <Icono nombre="wifioff" tamano={28} />
          </span>
          <h1 className="text-titulo-seccion">{navegacion.sinConexionPagina.titulo}</h1>
          <p className="text-cuerpo-pequeno max-w-75 text-texto-secundario">
            {navegacion.sinConexionPagina.texto}
          </p>
          <ReintentarSinConexion />
        </div>
      </div>
    </div>
  );
}
