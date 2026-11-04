'use client';
// «Aprobar todos ({n})» de `/bandeja` (FT-36, OP-38, AV-19; 05 §2.5): un toque aprueba los movimientos que `bandeja()` dice
// elegibles y deja a la vista, en su lugar, cuántos se aprobaron y cuáles no con su motivo. No hay operación inversa (05 §4.14).
// El resultado vive aquí y no en la lista: la revalidación saca de la lista lo aprobado y, si era todo, la deja vacía.
import { useRef, useState } from 'react';
import { AvisoEnLinea } from '../../../componentes/base/aviso';
import { Boton } from '../../../componentes/base/boton';
import { Resultado } from '../../../componentes/base/resultado';
import type { MovimientoDto } from '../../../componentes/dominio/movimiento-bandeja';
import { formatearMonto } from '../../../formato';
import { useOperacion, type AccionEscritura } from '../../../formularios/use-operacion';
import { bandeja as t } from '../../../textos/bandeja';
import { formularios } from '../../../textos/formularios';

interface ElementoLote {
  readonly movimientoId: string;
  readonly resultado:
    'aprobado' | 'ya_aplicada' | { readonly codigo: string; readonly mensaje: string };
}
interface NoAprobado {
  readonly id: string;
  readonly nombre: string;
  readonly motivo: string;
}

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const nombreDe = (m: MovimientoDto | undefined): string =>
  [m?.comercio ?? t.aprobarTodos.sinComercio, m?.monto == null ? '' : formatearMonto(m.monto)]
    .filter((x) => x !== '')
    .join(' ');

/** AV-19: lo que el servidor rechazó, con su mensaje, y lo que la consulta dejó fuera del lote por una regla de 04 OP-38. */
function noAprobados(
  elementos: readonly ElementoLote[],
  vistos: readonly MovimientoDto[],
): NoAprobado[] {
  const enviados = new Set(elementos.map((e) => e.movimientoId));
  const rechazados = elementos.flatMap((e) =>
    typeof e.resultado === 'string'
      ? []
      : [
          {
            id: e.movimientoId,
            nombre: nombreDe(vistos.find((m) => m.id === e.movimientoId)),
            motivo: e.resultado.mensaje,
          },
        ],
  );
  const excluidos = vistos.flatMap((m) => {
    const motivo = t.aprobarTodos.motivos[m.aprobacion.motivoNoElegible ?? ''];
    return !enviados.has(m.id) && m.estado === 'pendiente' && motivo !== undefined
      ? [{ id: m.id, nombre: nombreDe(m), motivo }]
      : [];
  });
  return [...rechazados, ...excluidos];
}

export function AprobarTodos({
  accion,
  elegibles,
  movimientos,
}: {
  /** La Server Action de OP-38 (`aprobarTodos`); llega por prop para probar el componente sin el servidor. */
  readonly accion: AccionEscritura;
  /** `elegiblesAprobarTodos` de `bandeja()`: los que OP-38 intentaría. */
  readonly elegibles: readonly string[];
  readonly movimientos: readonly MovimientoDto[];
}) {
  const operacion = useOperacion({ accion });
  const ids = useRef<Record<string, string> | null>(null); // un id de transacción por movimiento, estable hasta un `ok`
  const [vistos, setVistos] = useState<readonly MovimientoDto[]>([]);
  const { estado, error, exito } = operacion;

  const alTocar = (): void => {
    const lote = movimientos.filter((m) => elegibles.includes(m.id));
    if (lote.length === 0) return;
    const mapa = (ids.current ??= {});
    for (const m of lote) mapa[m.id] ??= crypto.randomUUID();
    setVistos(movimientos);
    void operacion.enviar({ movimientoIds: lote.map((m) => m.id), ids: mapa });
  };

  let resultado = null;
  if (estado === 'listo' && exito !== undefined) {
    ids.current = null;
    const elementos = (exito.valor as { elementos: readonly ElementoLote[] }).elementos;
    const aprobados = elementos.filter((e) => typeof e.resultado === 'string').length;
    const no = noAprobados(elementos, vistos);
    resultado = (
      <div className="flex flex-col gap-2">
        {aprobados === 0 ? null : (
          <div className="rounded-contenedor bg-superficie">
            <Resultado texto={t.aprobarTodos.aprobaste(aprobados)} />
          </div>
        )}
        {no.length === 0 ? null : (
          <AvisoEnLinea
            estado="advertencia"
            titulo={t.aprobarTodos.noAprobados(no.length)}
            aparecioDespues
          >
            <ul data-testid="av-19" className="flex flex-col gap-1">
              {no.map((x) => (
                <li key={x.id}>
                  <span className="font-bold">{x.nombre}</span>
                  {': '}
                  {x.motivo}
                </li>
              ))}
            </ul>
          </AvisoEnLinea>
        )}
      </div>
    );
  } else if (estado === 'error' && error !== undefined)
    resultado = (
      <AvisoEnLinea
        estado="problema"
        aparecioDespues
        {...(REINTENTABLES.includes(error.categoria)
          ? {
              accion: (
                <Boton variante="secundaria" onClick={() => void operacion.reintentar()}>
                  {formularios.intentarDeNuevo}
                </Boton>
              ),
            }
          : {})}
      >
        {error.mensaje}
      </AvisoEnLinea>
    );

  return (
    <>
      {elegibles.length === 0 ? null : (
        <Boton
          variante="secundaria"
          onClick={alTocar}
          enviando={estado === 'enviando'}
          textoEnviando={t.aprobarTodos.aprobando}
        >
          {t.aprobarTodos.boton(elegibles.length)}
        </Boton>
      )}
      {resultado}
    </>
  );
}
