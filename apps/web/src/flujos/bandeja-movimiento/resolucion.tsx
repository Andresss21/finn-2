'use client';
// Las salidas de un movimiento que no se aprueba (FT-37, FT-38, 05 §4.14; S4 del export, CH-137): «Descartar» (OP-39), «Es otro gasto» y «Es
// duplicado» en un posible duplicado, «No es este pago» en una coincidencia (OP-40), y «Registrar a mano» e «Intentar de nuevo» (OP-49)
// en un SMS que no se leyó. Un movimiento con coincidencia no ofrece «Descartar» (05 §4.14, CA-37.6): el servidor también lo rechaza con
// `movimiento_estado_no_valido`. Se carga cuando hace falta. Va en el pie fijo: en una pantalla propia (`propio`) la primera salida es
// el botón principal y las demás tonales (D1); junto a «Aprobar $X» todas son tonales, con la papelera en «Descartar».
import { useEffect } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Icono, type NombreIcono } from '../../componentes/base/icono';
import { useOperacion } from '../../formularios/use-operacion';
import {
  descartarMovimiento,
  reprocesarSms,
  resolverCoincidencia,
} from '../../servidor/acciones/bandeja';
import { bandeja as t } from '../../textos/bandeja';
import { cuentas } from '../../textos/cuentas';
import { sePuedeDescartar } from './descarte';

type Decision = 'es_legitimo' | 'es_duplicado' | 'rechazar_coincidencia';

interface Salida {
  readonly texto: string;
  readonly ejecutar: () => void;
  readonly icono?: NombreIcono;
}

export default function Resolucion({
  movimientoId,
  estado,
  propio,
  alDescartar,
  aprobando,
  alRegistrarAMano,
  reproceso,
}: {
  readonly movimientoId: string;
  readonly estado: string;
  /** La pantalla no tiene «Aprobar»: sus salidas son las decisiones del pie. */
  readonly propio: boolean;
  /** El movimiento quedó descartado (OP-39 o «Es duplicado»): la pantalla pasa a su resultado con «Restaurar». */
  readonly alDescartar: () => void;
  /** [CH-240 E3-13] Mientras aprueba, «Descartar» queda deshabilitado con su motivo escrito. */
  readonly aprobando?: boolean;
  /** Solo en un SMS que no se leyó: muestra los campos para completarlo. */
  readonly alRegistrarAMano?: () => void;
  /** Solo en un SMS con error: lo que necesita OP-49 (`intentoVisto`, CA-38.3). */
  readonly reproceso?: { readonly smsId: string; readonly intentoVisto: number };
}) {
  const descartar = useOperacion({ accion: descartarMovimiento });
  const resolver = useOperacion({ accion: resolverCoincidencia });
  const reprocesar = useOperacion({ accion: reprocesarSms });
  const operaciones = [descartar, resolver, reprocesar];
  const ocupado = operaciones.some((o) => o.estado === 'enviando');
  const sinConexion = operaciones.some((o) => !o.enLinea);
  const decidir = (decision: Decision): void => {
    void resolver.enviar({ movimientoId, decision });
  };
  const aMano: Salida[] =
    propio && alRegistrarAMano !== undefined
      ? [{ texto: cuentas.bandeja.registrarAMano, ejecutar: alRegistrarAMano }]
      : [];
  const salidas: Salida[] = [
    ...(estado === 'error' && propio && reproceso !== undefined
      ? [
          {
            texto: cuentas.bandeja.intentarDeNuevo,
            icono: 'refresh' as const,
            ejecutar: () => {
              void reprocesar.enviar(reproceso);
            },
          },
        ]
      : []),
    ...aMano,
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
    ...(sePuedeDescartar(estado) && estado !== 'posible_duplicado'
      ? [
          {
            texto: cuentas.bandeja.descartar,
            icono: 'trash' as const,
            ejecutar: () => {
              void descartar.enviar({ movimientoId, accion: 'descartar' });
            },
          },
        ]
      : []),
  ];
  const fallida = operaciones.find((o) => o.estado === 'error');
  // «Es duplicado» y «Descartar» dejan el movimiento descartado: lo dice el servidor en su respuesta
  const descartado = [descartar, resolver].some(
    (o) =>
      o.estado === 'listo' &&
      (o.exito?.valor as { estado?: string } | undefined)?.estado === 'descartado',
  );
  useEffect(() => {
    if (descartado) alDescartar();
  }, [descartado, alDescartar]);
  if (salidas.length === 0) return null;
  return (
    <section aria-label={t.resolver} className="flex w-full flex-col gap-2">
      <div className={propio ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'}>
        {salidas.map((b, i) => (
          <Boton
            key={b.texto}
            variante={propio && i === 0 ? 'principal' : 'secundaria'}
            deshabilitado={ocupado || sinConexion || (aprobando === true && b.icono === 'trash')}
            {...(aprobando === true && b.icono === 'trash'
              ? { motivoDeshabilitado: t.revisar.descartarAprobando }
              : {})}
            onClick={b.ejecutar}
            className={propio ? 'w-full' : 'flex-1'}
          >
            {b.icono === undefined ? null : <Icono nombre={b.icono} tamano={18} />}
            {b.texto}
          </Boton>
        ))}
      </div>
      {reprocesar.estado === 'listo' ? (
        <p role="status" className="text-cuerpo-pequeno text-texto-secundario">
          {t.reprocesado}
        </p>
      ) : null}
      {fallida?.error === undefined ? null : (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {fallida.error.mensaje}
        </AvisoEnLinea>
      )}
    </section>
  );
}
