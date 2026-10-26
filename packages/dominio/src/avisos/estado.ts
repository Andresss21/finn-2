// Avisos de estado (01 §5.0.7: AV-02 a AV-09, AV-14, AV-17, AV-20; 04 §6.0.4 y el selector
// `avisosEstado()` de §6.0.5). Son una función pura de la instantánea: aparecen exactamente
// cuando se cumple su condición y desaparecen cuando deja de cumplirse; no se guardan. Aquí solo
// están las condiciones y los montos; el texto en voseo lo arma la aplicación (04 §7.10), y las
// propuestas de un toque (AV-08, AV-14) también.
//
// Todo sale de lo que `calcular` ya derivó para el período activo A: ninguna fórmula nueva.
import { atribucionDelExcedente } from '../calculo/sobregiros';
import type { Instantanea, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';

export type IdAvisoEstado =
  | 'AV-02'
  | 'AV-03'
  | 'AV-04'
  | 'AV-05'
  | 'AV-06'
  | 'AV-07'
  | 'AV-08'
  | 'AV-09'
  | 'AV-14'
  | 'AV-17'
  | 'AV-20';

/** Un aviso vigente: su número, la fila a la que se refiere y sus datos (forma de `AvisoEstadoDto`). */
export interface AvisoEstado {
  readonly aviso: IdAvisoEstado;
  /** Categoría, tarjeta o meta del aviso; `'lpa'` en los que son del conjunto (AV-09, AV-20). */
  readonly clave: string;
  readonly datos: Readonly<Record<string, Centavos | FechaLocal | string>>;
}

const aviso = (
  id: IdAvisoEstado,
  clave: Uuid | 'lpa',
  datos: AvisoEstado['datos'],
): AvisoEstado => ({
  aviso: id,
  clave,
  datos,
});

const positivo = (x: Centavos) => x > Centavos.cero;

/**
 * Los avisos de estado vigentes en `i`, ordenados por número de aviso y, dentro de cada uno, por
 * el id de su fila (las tablas de la instantánea ya están en orden canónico, inv. 26).
 *
 * - AV-02 / AV-03: SobD(c, A) > 0 / SobT(c, A) > 0 en una categoría (archivada o no, N5).
 * - AV-04 / AV-05 / AV-06: E(t, A) repartido por causa (§4.7): pagos / cobros / devoluciones.
 *   AV-06 tiene dos variantes (C-4): `saldo_a_favor` si la tarjeta no tiene deuda y `con_deuda`
 *   si todavía la tiene. [Propio] Con deuda y saldo exactamente 0 se toma `saldo_a_favor`.
 * - AV-07: S(t) > 0. AV-08: RE(t) > 0.
 * - AV-09: dinero en camino > 0. AV-20: LPA < 0.
 * - AV-14: categoría archivada con Disp(c, A) > 0. AV-17: meta para una fecha vencida.
 */
export function avisosDeEstado(i: Instantanea): readonly AvisoEstado[] {
  const b = i.presupuesto;
  const celdas = b.celdas.filter((x) => x.periodo.inicio === b.activo.inicio);
  const archivadas = new Set(i.hechos.categorias.filter((x) => x.archivada).map((x) => x.id));
  const salida: AvisoEstado[] = [];

  for (const x of celdas)
    if (positivo(x.sobD))
      salida.push(aviso('AV-02', x.categoriaId, { categoriaId: x.categoriaId, monto: x.sobD }));
  for (const x of celdas)
    if (positivo(x.sobT))
      salida.push(
        aviso('AV-03', x.categoriaId, {
          categoriaId: x.categoriaId,
          monto: x.sobT,
          total: x.reinicio,
          parteTarjeta: x.sobT,
          parteDebito: x.sobD,
        }),
      );

  for (const t of i.tarjetas) {
    const causa = atribucionDelExcedente(b, t.tarjetaId);
    if (positivo(causa.pagos))
      salida.push(aviso('AV-04', t.tarjetaId, { tarjetaId: t.tarjetaId, monto: causa.pagos }));
    if (positivo(causa.cobros))
      salida.push(aviso('AV-05', t.tarjetaId, { tarjetaId: t.tarjetaId, monto: causa.cobros }));
    if (positivo(causa.devoluciones)) {
      const categorias = new Set(
        b.aportes
          .filter(
            (d) =>
              d.tarjetaId === t.tarjetaId &&
              d.periodo === b.activo.inicio &&
              d.aPago < Centavos.cero,
          )
          .map((d) => d.categoriaId),
      );
      salida.push(
        aviso('AV-06', t.tarjetaId, {
          tarjetaId: t.tarjetaId,
          monto: causa.devoluciones,
          variante: positivo(t.deuda) ? 'con_deuda' : 'saldo_a_favor',
          categoriaIds: [...categorias].sort().join(','),
        }),
      );
    }
    if (positivo(t.sinRespaldo))
      salida.push(aviso('AV-07', t.tarjetaId, { tarjetaId: t.tarjetaId, monto: t.sinRespaldo }));
    if (positivo(t.reservaExcedente))
      salida.push(
        aviso('AV-08', t.tarjetaId, { tarjetaId: t.tarjetaId, monto: t.reservaExcedente }),
      );
  }

  if (positivo(i.lpa.dineroEnCamino))
    salida.push(aviso('AV-09', 'lpa', { monto: i.lpa.dineroEnCamino }));
  for (const x of celdas)
    if (archivadas.has(x.categoriaId) && positivo(x.disponible))
      salida.push(
        aviso('AV-14', x.categoriaId, { categoriaId: x.categoriaId, monto: x.disponible }),
      );
  for (const m of i.metas) {
    const e = m.evaluacion;
    if (e?.estado === 'vencida' && e.fechaObjetivo !== null)
      salida.push(
        aviso('AV-17', m.metaId, {
          metaId: m.metaId,
          categoriaId: m.categoriaId,
          falta: e.falta,
          fechaObjetivo: e.fechaObjetivo,
        }),
      );
  }
  if (i.lpa.total < Centavos.cero) salida.push(aviso('AV-20', 'lpa', { monto: i.lpa.total }));

  // `sort` es estable: dentro de cada aviso queda el orden canónico de las tablas.
  return salida.sort((a, c) => (a.aviso < c.aviso ? -1 : a.aviso > c.aviso ? 1 : 0));
}
