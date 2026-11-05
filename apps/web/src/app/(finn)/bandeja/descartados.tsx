'use client';
// `/bandeja?vista=descartados` (FT-37, 05 §2.5): los descartados y autodescartados, con «Restaurar» de un toque (OP-39). Al
// restaurar, la fila sale de la vista por la revalidación y su resultado queda en su lugar, con «Descartar» como salida solo si
// el estado resultante lo admite (05 §4.14). Lo que dice el servidor manda: la fila no calcula nada (PF-3).
import { useCallback, useEffect, useState } from 'react';
import { AvisoEnLinea } from '../../../componentes/base/aviso';
import { Icono } from '../../../componentes/base/icono';
import { Resultado } from '../../../componentes/base/resultado';
import { Vacio } from '../../../componentes/base/vacio';
import { Monto } from '../../../componentes/dominio/monto';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import {
  sePuedeDescartar,
  textoRestaurado,
  type ValorMovimiento,
} from '../../../flujos/bandeja-movimiento/descarte';
import { formatearFecha } from '../../../formato';
import { useOperacion } from '../../../formularios/use-operacion';
import { descartarMovimiento } from '../../../servidor/acciones/bandeja';
import { bandeja as t } from '../../../textos/bandeja';
import { cuentas } from '../../../textos/cuentas';
import { Boton } from '../../../componentes/base/boton';
import type { Centavos } from '@finn/dominio/valores';

// Solo un gasto y un pago de tarjeta sacan dinero: el signo sale del tipo del servidor, nunca se deduce (PF-3).
const SALEN: ReadonlySet<string> = new Set(['gasto', 'pago_tarjeta']);

export interface Descartado {
  readonly id: string;
  readonly estado: 'descartado' | 'autodescartado';
  readonly cuenta: string | null;
  readonly fecha: string | null;
  readonly monto: Centavos | null;
  /** El tipo que propone el servidor: decide el signo del monto (CH-111, PF-3). */
  readonly tipoPropuesto: string | null;
  readonly comercio: string | null;
}

function FilaDescartado({
  movimiento: m,
  alIniciar,
}: {
  readonly movimiento: Descartado;
  readonly alIniciar: (m: Descartado) => void;
}) {
  const restaurar = useOperacion({ accion: descartarMovimiento });
  const descartar = useOperacion({ accion: descartarMovimiento });
  const [restaurado, setRestaurado] = useState<ValorMovimiento | undefined>(undefined);
  const { estado: estadoRestaurar, exito } = restaurar;
  const { estado: estadoDescartar } = descartar;
  useEffect(() => {
    if (estadoRestaurar === 'listo' && exito !== undefined)
      setRestaurado(exito.valor as ValorMovimiento);
  }, [estadoRestaurar, exito]);
  useEffect(() => {
    if (estadoDescartar === 'listo') setRestaurado(undefined);
  }, [estadoDescartar]);
  const fallo = [restaurar, descartar].find((o) => o.estado === 'error')?.error;

  if (restaurado !== undefined)
    return (
      <Resultado
        texto={textoRestaurado(m.comercio, m.monto)}
        {...(sePuedeDescartar(restaurado.estado)
          ? {
              salida: {
                etiqueta: cuentas.bandeja.descartar,
                ejecutar: () => {
                  void descartar.enviar({ movimientoId: m.id, accion: 'descartar' });
                },
              },
            }
          : {})}
      />
    );
  const comercio = m.comercio ?? cuentas.bandeja.sinComercio;
  // S4 del export (CH-139): comercio y estado a la izquierda, monto y «Restaurar» a la derecha, todo apagado
  return (
    <article
      data-movimiento={m.id}
      data-vista={m.estado}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 px-4 py-3 text-texto-secundario"
    >
      <span className="flex min-w-0 flex-col gap-px">
        <span className="truncate text-cuerpo">{comercio}</span>
        <span className="truncate text-cuerpo-pequeno text-texto-terciario">
          {[
            m.estado === 'autodescartado' ? t.descartados.autodescartado : t.descartados.descartado,
            m.cuenta,
            m.fecha === null ? undefined : formatearFecha(m.fecha),
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
      <span className="flex items-center gap-1">
        {m.monto === null ? null : (
          <Monto
            centavos={m.monto}
            rol="cifra"
            presentacion={SALEN.has(m.tipoPropuesto ?? '') ? 'salida' : 'absoluto'}
          />
        )}
        <Boton
          variante="discreta"
          aria-label={cuentas.bandeja.accionDe(t.restaurar, comercio)}
          enviando={restaurar.estado === 'enviando'}
          onClick={() => {
            alIniciar(m);
            void restaurar.enviar({ movimientoId: m.id, accion: 'restaurar' });
          }}
        >
          <Icono nombre="undo" tamano={16} />
          {t.restaurar}
        </Boton>
      </span>
      {fallo === undefined ? null : (
        <div className="col-span-2 pt-2">
          <AvisoEnLinea estado="problema" aparecioDespues>
            {fallo.mensaje}
          </AvisoEnLinea>
        </div>
      )}
    </article>
  );
}

export function ListaDescartados({
  movimientos,
  hrefMas,
}: {
  readonly movimientos: readonly Descartado[];
  /** Con más descartados que los de esta página: el enlace a la siguiente (cursor). */
  readonly hrefMas: string | undefined;
}) {
  const [retenidos, setRetenidos] = useState<Readonly<Record<string, Descartado>>>({});
  const alIniciar = useCallback((m: Descartado) => {
    setRetenidos((r) => (m.id in r ? r : { ...r, [m.id]: m }));
  }, []);
  const filas = [...movimientos];
  for (const r of Object.values(retenidos)) if (!filas.some((m) => m.id === r.id)) filas.push(r);
  if (filas.length === 0)
    return <Vacio titulo={t.descartados.vacio.titulo} texto={t.descartados.vacio.texto} />;
  return (
    <>
      <h2 className="text-titulo-seccion">{t.vistas.descartados}</h2>
      <div
        role="list"
        aria-label={t.descartados.lista}
        className="divide-y divide-borde-sutil overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1"
      >
        {filas.map((m) => (
          <div key={m.id} role="listitem">
            <FilaDescartado movimiento={m} alIniciar={alIniciar} />
          </div>
        ))}
      </div>
      {hrefMas === undefined ? null : (
        <EnlaceFinn
          href={hrefMas}
          className="inline-flex min-h-11 items-center font-bold text-enlace underline"
        >
          {t.descartados.verMas}
        </EnlaceFinn>
      )}
    </>
  );
}
