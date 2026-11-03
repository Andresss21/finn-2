'use client';
// Las salidas de un movimiento que no se aprueba (FT-37, 05 §4.14): «Descartar» (OP-39), «Es otro gasto» y «Es duplicado» en un
// posible duplicado, y «No es este pago» en una coincidencia (OP-40). Un movimiento con coincidencia no ofrece «Descartar»
// (05 §4.14, CA-37.6): el servidor también lo rechaza con `movimiento_estado_no_valido`. Se carga cuando hace falta.
import { useEffect } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { useOperacion } from '../../formularios/use-operacion';
import { descartarMovimiento, resolverCoincidencia } from '../../servidor/acciones/bandeja';
import { bandeja as t } from '../../textos/bandeja';
import { cuentas } from '../../textos/cuentas';
import { sePuedeDescartar } from './descarte';

type Decision = 'es_legitimo' | 'es_duplicado' | 'rechazar_coincidencia';

export default function Resolucion({
  movimientoId,
  estado,
  alDescartar,
}: {
  readonly movimientoId: string;
  readonly estado: string;
  /** El movimiento quedó descartado (OP-39 o «Es duplicado»): la pantalla pasa a su resultado con «Restaurar». */
  readonly alDescartar: () => void;
}) {
  const descartar = useOperacion({ accion: descartarMovimiento });
  const resolver = useOperacion({ accion: resolverCoincidencia });
  const ocupado = descartar.estado === 'enviando' || resolver.estado === 'enviando';
  const sinConexion = !descartar.enLinea || !resolver.enLinea;
  const decidir = (decision: Decision): void => {
    void resolver.enviar({ movimientoId, decision });
  };
  const botones: { texto: string; ejecutar: () => void }[] = [
    ...(estado === 'posible_duplicado'
      ? [
          {
            texto: cuentas.bandeja.esOtroGasto,
            ejecutar: () => {
              decidir('es_legitimo');
            },
          },
          {
            texto: t.esDuplicado,
            ejecutar: () => {
              decidir('es_duplicado');
            },
          },
        ]
      : []),
    ...(estado === 'con_coincidencia'
      ? [
          {
            texto: t.noEsEstePago,
            ejecutar: () => {
              decidir('rechazar_coincidencia');
            },
          },
        ]
      : []),
    ...(sePuedeDescartar(estado)
      ? [
          {
            texto: cuentas.bandeja.descartar,
            ejecutar: () => {
              void descartar.enviar({ movimientoId, accion: 'descartar' });
            },
          },
        ]
      : []),
  ];
  const fallida = [descartar, resolver].find((o) => o.estado === 'error');
  // «Es duplicado» y «Descartar» dejan el movimiento descartado: lo dice el servidor en su respuesta
  const descartado = [descartar, resolver].some(
    (o) =>
      o.estado === 'listo' &&
      (o.exito?.valor as { estado?: string } | undefined)?.estado === 'descartado',
  );
  useEffect(() => {
    if (descartado) alDescartar();
  }, [descartado, alDescartar]);
  if (botones.length === 0) return null;
  return (
    <section aria-label={t.resolver} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {botones.map((b) => (
          <Boton
            key={b.texto}
            variante="secundaria"
            deshabilitado={ocupado || sinConexion}
            onClick={b.ejecutar}
          >
            {b.texto}
          </Boton>
        ))}
      </div>
      {fallida?.error === undefined ? null : (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {fallida.error.mensaje}
        </AvisoEnLinea>
      )}
    </section>
  );
}
