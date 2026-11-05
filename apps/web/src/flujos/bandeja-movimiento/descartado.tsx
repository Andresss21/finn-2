'use client';
// Lo que se ve en `/bandeja/[movimientoId]` al descartar (FT-37, 05 §4.14): «Descartaste {comercio} {monto}. Restaurar», sin
// tiempo límite. Al restaurar, dice lo que resultó y ofrece «Descartar» solo si el estado resultante lo admite. Se carga cuando
// hace falta.
import { useEffect, useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Resultado } from '../../componentes/base/resultado';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { useOperacion } from '../../formularios/use-operacion';
import { descartarMovimiento } from '../../servidor/acciones/bandeja';
import { bandeja as t } from '../../textos/bandeja';
import { cuentas } from '../../textos/cuentas';
import {
  sePuedeDescartar,
  textoDescartado,
  textoRestaurado,
  type ValorMovimiento,
} from './descarte';
import { ENLACE } from './piezas';

export default function Descartado({
  movimientoId,
  comercio,
  monto,
  siguienteId,
}: {
  readonly movimientoId: string;
  readonly comercio: string | null;
  readonly monto: number | null;
  /** El movimiento que seguía en la lista al abrir (CH-151): «Siguiente movimiento» en el panel de computadora. */
  readonly siguienteId?: string | undefined;
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
  return (
    <div className="flex flex-col gap-4">
      {restaurado === undefined ? (
        <Resultado
          texto={textoDescartado(comercio, monto)}
          salida={{
            etiqueta: t.restaurar,
            ejecutar: () => {
              void restaurar.enviar({ movimientoId, accion: 'restaurar' });
            },
          }}
        />
      ) : (
        <Resultado
          texto={textoRestaurado(comercio, monto)}
          {...(sePuedeDescartar(restaurado.estado)
            ? {
                salida: {
                  etiqueta: cuentas.bandeja.descartar,
                  ejecutar: () => {
                    void descartar.enviar({ movimientoId, accion: 'descartar' });
                  },
                },
              }
            : {})}
        />
      )}
      {fallo === undefined ? null : (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {fallo.mensaje}
        </AvisoEnLinea>
      )}
      {siguienteId === undefined ? null : (
        <EnlaceFinn href={`/bandeja/${siguienteId}`} className={ENLACE.principal}>
          {t.revisar.siguiente}
        </EnlaceFinn>
      )}
      <EnlaceFinn
        href="/bandeja"
        className="inline-flex min-h-11 items-center font-bold text-enlace underline"
      >
        {t.revisar.volver}
      </EnlaceFinn>
    </div>
  );
}
