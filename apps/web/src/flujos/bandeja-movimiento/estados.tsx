'use client';
// Lo que dice `/bandeja/[movimientoId]` en los estados que no se editan (S4 del export, CH-137): un posible duplicado con la tarjeta del
// gasto igual, un SMS no reconocido y uno con error. Los textos son del catálogo; lo que se muestra del gasto igual es del servidor
// (`duplicado` de `MovimientoDto`), sin cálculo (PF-3). Se carga solo cuando el movimiento está en uno de esos estados (05 §13.1).
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Icono } from '../../componentes/base/icono';
import { Monto } from '../../componentes/dominio/monto';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { formatearFecha } from '../../formato';
import { bandeja as t } from '../../textos/bandeja';
import { cuentas as c } from '../../textos/cuentas';
import { Nota } from './piezas';

/** El gasto con el que coincide un posible duplicado: una transacción ya registrada u otro movimiento (04 OP-35). */
export interface DuplicadoDe {
  readonly tipo: 'transaccion' | 'movimiento';
  readonly id: string;
  readonly fecha: FechaLocal;
  readonly monto: Centavos;
  readonly comercio: string | null;
  readonly cuenta: string | null;
}

export default function EstadoPropio({
  estado,
  duplicado,
}: {
  readonly estado: 'posible_duplicado' | 'no_reconocido' | 'error';
  readonly duplicado: DuplicadoDe | undefined;
}) {
  const r = t.revisar;
  if (estado === 'no_reconocido')
    return <AvisoEnLinea estado="informacion">{r.noReconocido}</AvisoEnLinea>;
  if (estado === 'error')
    return (
      <AvisoEnLinea estado="problema" titulo={r.falloTitulo}>
        {r.falloTexto}
      </AvisoEnLinea>
    );
  return (
    <section aria-label={c.bandeja.estados.duplicado} className="flex flex-col gap-3">
      <AvisoEnLinea
        estado="advertencia"
        titulo={
          duplicado === undefined
            ? c.bandeja.estados.duplicado
            : r.igualA(formatearFecha(duplicado.fecha))
        }
      >
        {r.igualDetalle}
      </AvisoEnLinea>
      {duplicado === undefined ? null : (
        <EnlaceFinn
          href={
            duplicado.tipo === 'transaccion'
              ? `/actividad/${duplicado.id}`
              : `/bandeja/${duplicado.id}`
          }
          className="flex min-h-14 items-center gap-3 rounded-contenedor bg-superficie px-4 py-3"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-cuerpo font-semibold break-words">
              {duplicado.comercio ?? c.bandeja.sinComercio}
            </span>
            <span className="text-cuerpo-pequeno text-texto-secundario">
              {[duplicado.cuenta, formatearFecha(duplicado.fecha)]
                .filter((x) => x !== null)
                .join(' · ')}
            </span>
          </span>
          <Monto centavos={duplicado.monto} rol="cuerpo" presentacion="salida" />
          <Icono nombre="chevR" tamano={18} />
        </EnlaceFinn>
      )}
      <Nota>{r.duplicadoNota}</Nota>
    </section>
  );
}
