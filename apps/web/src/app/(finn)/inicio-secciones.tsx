// Las secciones de Inicio que no son «Necesita tu atención» (FT-08; 06-identidad-visual §4): «Próximos 7 días», «Recientes» y el
// aviso «Todo al día». Dibujan lo que trae `inicio()`: no calculan montos (PF-3).
import type { InicioDto } from '@finn/aplicacion/consultas/inicio';
import type { ReactNode } from 'react';
import { Icono } from '../../componentes/base/icono';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { FilaTransaccion } from '../../componentes/dominio/fila-transaccion';
import { Monto } from '../../componentes/dominio/monto';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { inicio as t } from '../../textos/inicio';
import { InsigniaDeFecha } from '../../componentes/dominio/insignia-fecha';

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const CONTENEDOR =
  'flex flex-col divide-y divide-borde-sutil overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1';
const FILA = `flex min-h-17 items-center gap-3 px-4 py-3 ${FOCO}`;
const ENLACE = `inline-flex min-h-11 items-center gap-1.5 text-etiqueta font-bold text-enlace no-underline ${FOCO}`;

function Seccion({
  titulo,
  atributo,
  enlace,
  children,
}: {
  readonly titulo: string;
  readonly atributo: string;
  readonly enlace: { readonly href: string; readonly texto: string };
  readonly children: ReactNode;
}) {
  return (
    <section aria-label={titulo} data-seccion={atributo} className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-titulo-seccion">{titulo}</h2>
        <EnlaceFinn href={enlace.href} className={ENLACE}>
          {enlace.texto}
          <Icono nombre="arrowR" tamano={14} />
        </EnlaceFinn>
      </div>
      {children}
    </section>
  );
}

/** El enlace de una ocurrencia a donde se registra o se resuelve (05 §2.3). */
export const hrefDeOcurrencia = (o: InicioDto['atencion']['proximosPagos'][number]): string =>
  `/programadas/${o.programada.id}/ocurrencias/${o.fechaEsperada}`;

export function ProximosPagos({
  pagos,
}: {
  readonly pagos: InicioDto['atencion']['proximosPagos'];
}) {
  if (pagos.length === 0) return null;
  return (
    <Seccion
      titulo={t.proximos}
      atributo="proximos-pagos"
      enlace={{ href: '/programadas', texto: t.programadas }}
    >
      <ul className={CONTENEDOR}>
        {pagos.map((o) => (
          <li key={`${o.programada.id}-${o.fechaEsperada}`} data-proximo-pago={o.programada.id}>
            <EnlaceFinn href={hrefDeOcurrencia(o)} className={FILA}>
              <InsigniaDeFecha fecha={o.fechaEsperada} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold text-texto">{o.programada.nombre}</span>
                <span className="text-cuerpo-pequeno text-texto-secundario">
                  {o.cuenta.nombre}
                  {o.registroAutomatico ? ` · ${t.seRegistraSola}` : ''}
                </span>
              </span>
              <Monto centavos={-Math.abs(o.monto) as typeof o.monto} rol="cifra" />
            </EnlaceFinn>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

export function Recientes({ filas }: { readonly filas: InicioDto['recientes'] }) {
  if (filas.length === 0) return null;
  return (
    <Seccion
      titulo={t.recientes}
      atributo="recientes"
      enlace={{ href: '/actividad', texto: t.actividad }}
    >
      <ul className={CONTENEDOR}>
        {filas.map((f) => (
          <li key={f.id}>
            <FilaTransaccion
              fila={f}
              hrefDetalle={`/actividad/${f.id}?volver=${encodeURIComponent('/')}`}
            />
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

export function TodoAlDia() {
  return (
    <div data-todo-al-dia>
      <AvisoEnLinea estado="positivo" titulo={t.todoAlDia.titulo}>
        {t.todoAlDia.texto}
      </AvisoEnLinea>
    </div>
  );
}
