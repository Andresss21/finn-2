// La lista de `/bandeja` (06-identidad-visual §7): resumen con los contadores, las filas compactas (`MovimientoBandeja`) y,
// sin movimientos, el vacío «Bandeja al día». Sin estado propio: lo que muestra es lo que devolvió `bandeja()`.
import { Vacio } from '../../../componentes/base/vacio';
import {
  MovimientoBandeja,
  type MovimientoDto,
} from '../../../componentes/dominio/movimiento-bandeja';
import { bandeja as t } from '../../../textos/bandeja';

interface Contadores {
  readonly pendientes: number;
  readonly conCoincidencia: number;
  readonly posiblesDuplicados: number;
  readonly noReconocidos: number;
  readonly errores: number;
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
  if (movimientos.length === 0)
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
        {movimientos.map((m) => (
          <div key={m.id} role="listitem">
            <MovimientoBandeja movimiento={m} hrefRevisar={`/bandeja/${m.id}`} />
          </div>
        ))}
      </div>
      <p className="text-cuerpo-pequeno text-texto-terciario">{t.nota}</p>
    </>
  );
}
