// `/sin-conexion` (05 §8.5, FE-56): la página que el service worker devuelve cuando falla una navegación de documento.
// Estática, en el precache, sin sesión ni datos: ningún número y ningún enlace a otras pantallas (todas necesitan red).
import type { Metadata } from 'next';
import { Marca } from '../../componentes/marco/marca';
import { ReintentarSinConexion } from '../../componentes/marco/reintentar-sin-conexion';
import { navegacion } from '../../textos/navegacion';

export const metadata: Metadata = { title: navegacion.sinConexionPagina.titulo };

export default function PaginaSinConexion() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-5 py-10">
      <Marca />
      <h1 className="text-titulo-pantalla">{navegacion.sinConexionPagina.titulo}</h1>
      <p>{navegacion.sinConexionPagina.texto}</p>
      <ReintentarSinConexion />
    </div>
  );
}
