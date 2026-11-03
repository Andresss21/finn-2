'use client';
// `/bandeja?vista=descartados` (FT-37, 05 §2.5): los descartados y autodescartados, con «Restaurar» de un toque (OP-39). Al
// restaurar, la fila sale de la vista por la revalidación y su resultado queda en su lugar, con «Descartar» como salida solo si
// el estado resultante lo admite (05 §4.14). Lo que dice el servidor manda: la fila no calcula nada (PF-3).
import { useCallback, useEffect, useState } from 'react';
import { AvisoEnLinea } from '../../../componentes/base/aviso';
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

export interface Descartado {
  readonly id: string;
  readonly estado: 'descartado' | 'autodescartado';
  readonly cuenta: string | null;
  readonly fecha: string | null;
  readonly monto: Centavos | null;
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
  return (
    <article data-movimiento={m.id} data-vista={m.estado} className="px-4 py-3.5">
      <div className="flex items-center gap-3 text-texto-secundario">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-cuerpo font-bold">{comercio}</span>
          <span className="block truncate text-cuerpo-pequeno">
            {[m.cuenta, m.fecha === null ? undefined : formatearFecha(m.fecha)]
              .filter(Boolean)
              .join(' · ')}
          </span>
          <span className="block text-cuerpo-pequeno font-bold">
            {m.estado === 'autodescartado'
              ? t.descartados.autodescartado
              : t.descartados.descartado}
          </span>
        </span>
        {m.monto === null ? null : <Monto centavos={m.monto} rol="cifra" />}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Boton
          variante="secundaria"
          aria-label={cuentas.bandeja.accionDe(t.restaurar, comercio)}
          enviando={restaurar.estado === 'enviando'}
          onClick={() => {
            alIniciar(m);
            void restaurar.enviar({ movimientoId: m.id, accion: 'restaurar' });
          }}
        >
          {t.restaurar}
        </Boton>
      </div>
      {fallo === undefined ? null : (
        <div className="pt-2">
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
      <div
        role="list"
        aria-label={t.descartados.lista}
        className="divide-y divide-borde-sutil rounded-contenedor bg-superficie"
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
