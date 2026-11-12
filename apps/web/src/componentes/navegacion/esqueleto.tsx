// `Esqueleto` (E6-1, FE-33, entrega 4 `T1-carga`): las piezas de la carga de una pantalla, de servidor y sin JS. Barras de 12 px con
// radio 4, círculos del tamaño del ícono y el gráfico como un bloque de 168 px, todo en `--superficie-hundida`: sin color de datos,
// sin texto ni números y sin animación. La región ocupada lleva `aria-busy` con los hijos `aria-hidden`; el anuncio «Cargando
// {pantalla}» va en una región `status` aparte, fuera de la ocupada, para que se lea una sola vez.
import type { ReactNode } from 'react';
import { estados } from '../../textos/estados';

// Clases literales (L13).
const HUNDIDO = 'bg-superficie-hundida';

export function Barra({ ancho = 'w-full' }: { readonly ancho?: string }) {
  return <span className={`block h-3 rounded-sm ${HUNDIDO} ${ancho}`} />;
}

export function Circulo({ tamano = 20 }: { readonly tamano?: number }) {
  return (
    <span
      className={`block shrink-0 rounded-full ${HUNDIDO}`}
      style={{ width: tamano, height: tamano }}
    />
  );
}

/** El gráfico: un bloque de 168 px sin color de datos. */
export function BloqueGrafico() {
  return <span className={`block h-42 w-full rounded-control ${HUNDIDO}`} />;
}

/** Una fila de lista: círculo del ícono y dos barras. */
export function FilaEsqueleto({ conIcono = true }: { readonly conIcono?: boolean }) {
  return (
    <div className="flex min-h-14 items-center gap-3 py-2">
      {conIcono ? <Circulo /> : null}
      <div className="flex flex-1 flex-col gap-2">
        <Barra ancho="w-2/3" />
        <Barra ancho="w-1/3" />
      </div>
    </div>
  );
}

/** Una sección: su título en esqueleto y `filas` filas. */
export function SeccionEsqueleto({
  filas,
  conIcono = true,
  titulo = true,
}: {
  readonly filas: number;
  readonly conIcono?: boolean;
  readonly titulo?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {titulo ? <Barra ancho="w-1/4" /> : null}
      <div className="flex flex-col divide-y divide-borde-sutil rounded-contenedor bg-superficie px-4">
        {Array.from({ length: filas }, (_, i) => (
          <FilaEsqueleto key={i} conIcono={conIcono} />
        ))}
      </div>
    </div>
  );
}

export interface PropsEsqueleto {
  /** Nombre de la pantalla en minúscula: «Cargando {pantalla}». */
  readonly pantalla: string;
  /** Con título, el esqueleto es la pantalla (`main` con su `h1`); sin él, solo el interior (flujos y hojas). */
  readonly titulo?: string;
  /** El diálogo de la hoja ya se nombra «Cargando…»: sin un segundo anuncio. */
  readonly sinAnuncio?: boolean;
  readonly children: ReactNode;
}

export function Esqueleto({ pantalla, titulo, sinAnuncio = false, children }: PropsEsqueleto) {
  const cuerpo = (
    <>
      {sinAnuncio ? null : (
        <div role="status" className="sr-only">
          {estados.cargandoPantalla(pantalla)}
        </div>
      )}
      <div aria-busy="true" className="flex flex-col gap-5">
        <div aria-hidden="true" className="flex flex-col gap-5">
          {children}
        </div>
      </div>
    </>
  );
  if (titulo === undefined) return cuerpo;
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-4">
      <h1 className="text-titulo-pantalla">{titulo}</h1>
      {cuerpo}
    </main>
  );
}

/** GLO-32: el esqueleto genérico de un flujo o detalle cuya estructura el `loading.tsx` no conoce (no conoce los parámetros). */
export function EsqueletoGenerico() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-4">
      <Esqueleto pantalla="la pantalla">
        <Barra ancho="w-1/2" />
        <SeccionEsqueleto filas={3} titulo={false} />
        <SeccionEsqueleto filas={2} titulo={false} />
      </Esqueleto>
    </main>
  );
}

/** E6-1: el esqueleto de un detalle: el título de la pantalla es una barra (el `loading.tsx` no conoce los parámetros). */
export function EsqueletoDetalle({ pantalla }: { readonly pantalla: string }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-4">
      <Esqueleto pantalla={pantalla}>
        <span className="block h-8 w-1/2 rounded-sm bg-superficie-hundida" />
        <BloqueGrafico />
        <SeccionEsqueleto filas={3} />
        <SeccionEsqueleto filas={2} />
      </Esqueleto>
    </main>
  );
}
