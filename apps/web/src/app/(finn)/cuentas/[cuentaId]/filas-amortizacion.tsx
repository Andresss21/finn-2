'use client';
// [A18] La tabla de amortización del préstamo muestra las cuotas alrededor de la actual y «Ver tabla completa» las muestra todas.
// Solo elige qué filas, ya dibujadas en el servidor, se ven: no calcula nada (PF-3).
import { useState, type ReactNode } from 'react';
import { cuentaDetalle } from '../../../../textos/cuenta-detalle';

/** Cuotas visibles antes de «Ver tabla completa»: una antes de la actual y las siguientes. */
const ANTES = 1;
const VISIBLES = 6;

export function FilasAmortizacion({
  filas,
  actual,
  columnas,
}: {
  readonly filas: readonly ReactNode[];
  /** Índice de la cuota actual (la primera sin pagar); sin ella, desde el principio. */
  readonly actual: number;
  readonly columnas: number;
}) {
  const [completa, setCompleta] = useState(false);
  const desde = Math.max(0, Math.min(actual - ANTES, filas.length - VISIBLES));
  const recortada = !completa && filas.length > VISIBLES;
  return (
    <tbody>
      {recortada ? filas.slice(desde, desde + VISIBLES) : filas}
      {recortada ? (
        <tr>
          <td colSpan={columnas} className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setCompleta(true);
              }}
              className="inline-flex min-h-11 items-center px-3 font-semibold text-enlace underline"
            >
              {cuentaDetalle.prestamo.verTablaCompleta(filas.length)}
            </button>
          </td>
        </tr>
      ) : null}
    </tbody>
  );
}
