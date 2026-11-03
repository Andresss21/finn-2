'use client';
// La lista de `/bandeja` (06-identidad-visual §7): resumen con los contadores, las filas compactas (`MovimientoBandeja`) y,
// sin movimientos, el vacío «Bandeja al día». Lo que muestra es lo que devolvió `bandeja()`, salvo la fila que se aprobó con
// un toque: la revalidación la saca de la lista y su resultado queda en su lugar (FT-35, 05 §4.15).
import { useCallback, useState } from 'react';
import { Vacio } from '../../../componentes/base/vacio';
import type { MovimientoDto } from '../../../componentes/dominio/movimiento-bandeja';
import { bandeja as t } from '../../../textos/bandeja';
import type { ValorAprobado } from '../../../flujos/bandeja-movimiento/aprobado';
import { FilaBandeja } from './fila';

interface Contadores {
  readonly pendientes: number;
  readonly conCoincidencia: number;
  readonly posiblesDuplicados: number;
  readonly noReconocidos: number;
  readonly errores: number;
}

/** Una fila que se aprobó o se está aprobando: se queda donde estaba aunque la lista ya no la traiga. */
interface Retenida {
  readonly movimiento: MovimientoDto;
  readonly indice: number;
  readonly resultado: ValorAprobado | undefined;
  readonly enCurso: boolean;
}

/** Solo las clases que tienen movimientos, en el orden de `contadores`. */
function desglose(c: Contadores): string {
  return (Object.keys(t.desglose) as (keyof Contadores)[])
    .filter((k) => c[k] > 0)
    .map((k) => t.desglose[k](c[k]))
    .join(' · ');
}

export function ListaBandeja({
  contadores,
  movimientos,
}: {
  readonly contadores: Contadores;
  readonly movimientos: readonly MovimientoDto[];
}) {
  const [retenidas, setRetenidas] = useState<Readonly<Record<string, Retenida>>>({});
  const alIniciar = useCallback(
    (id: string) => {
      const indice = movimientos.findIndex((m) => m.id === id);
      const movimiento = movimientos[indice];
      if (movimiento === undefined) return;
      setRetenidas((r) => ({
        ...r,
        [id]: { movimiento, indice, resultado: undefined, enCurso: true },
      }));
    },
    [movimientos],
  );
  const alTerminar = useCallback((id: string, resultado: ValorAprobado | undefined) => {
    setRetenidas((r) => {
      const previa = r[id];
      return previa === undefined ? r : { ...r, [id]: { ...previa, resultado, enCurso: false } };
    });
  }, []);

  const filas = [...movimientos];
  for (const r of Object.values(retenidas))
    if ((r.enCurso || r.resultado !== undefined) && !filas.some((m) => m.id === r.movimiento.id))
      filas.splice(Math.min(r.indice, filas.length), 0, r.movimiento);
  if (filas.length === 0)
    return <Vacio titulo={t.alDia.titulo} texto={t.alDia.texto} icono="inbox" />;
  return (
    <>
      <p className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-titulo-seccion">{t.porRevisar(movimientos.length)}</span>
        <span className="text-cuerpo-pequeno text-texto-secundario">{desglose(contadores)}</span>
      </p>
      <div
        role="list"
        aria-label={t.lista}
        className="divide-y divide-borde-sutil rounded-contenedor bg-superficie"
      >
        {filas.map((m) => (
          <div key={m.id} role="listitem">
            <FilaBandeja
              movimiento={m}
              hrefRevisar={`/bandeja/${m.id}`}
              resultado={retenidas[m.id]?.resultado}
              alIniciar={alIniciar}
              alTerminar={alTerminar}
            />
          </div>
        ))}
      </div>
      <p className="text-cuerpo-pequeno text-texto-terciario">{t.nota}</p>
    </>
  );
}
