// Actividad y gastado (01 §4.4). Los traslados Tr(c, p, t) llegan con el reparto D2 (§4.5, TA-105) y
// los pagos implícitos con los cobros (§4.10); aquí la actividad de pago va sin ellos.
import type { Categoria, Hechos, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { Aporte, Consumo } from './devoluciones';
import type { Periodo } from './periodos';

const en = (p: Periodo, fecha: string) => p.inicio <= fecha && fecha <= p.fin;
const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);

/** Act(c, p) = −Σ m_k de los consumos de c con fecha en p + Σ aportes D-2, D-3 y D-4 a c en p. */
export function actividadNormal(
  consumos: readonly Consumo[],
  aportes: readonly Aporte[],
  categoriaId: Uuid,
  p: Periodo,
): Centavos {
  const consumido = suma(
    consumos.filter((k) => k.categoriaId === categoriaId && en(p, k.fecha)).map((k) => k.neto),
  );
  const aportado = suma(
    aportes.filter((d) => d.categoriaId === categoriaId && en(p, d.fecha)).map((d) => d.aCategoria),
  );
  return Centavos.restar(aportado, consumido);
}

/** Gastado(c, p) = −Act(c, p). Negativo si las devoluciones superan los consumos. */
export const gastado = (
  consumos: readonly Consumo[],
  aportes: readonly Aporte[],
  categoriaId: Uuid,
  p: Periodo,
): Centavos => Centavos.negar(actividadNormal(consumos, aportes, categoriaId, p));

/**
 * Act(pago(t), p) sin traslados ni pagos implícitos: −Σ líneas de pago a pago(t) con fecha en p
 * − Σ r de las D-3 en t en p − Σ X de las D-4 en t en p.
 */
export function actividadDePago(
  h: Pick<Hechos, 'transacciones' | 'lineas'>,
  aportes: readonly Aporte[],
  pago: Pick<Categoria, 'id' | 'tarjetaId'>,
  p: Periodo,
): Centavos {
  const fechas = new Map(
    h.transacciones.filter((t) => t.tipo === 'pago_tarjeta').map((t) => [t.id, t.fecha]),
  );
  const pagado = suma(
    h.lineas
      .filter((l) => {
        const fecha = fechas.get(l.transaccionId);
        return l.categoriaId === pago.id && fecha !== undefined && en(p, fecha);
      })
      .map((l) => l.monto),
  );
  const devuelto = suma(
    aportes.filter((d) => d.tarjetaId === pago.tarjetaId && en(p, d.fecha)).map((d) => d.aPago),
  );
  return Centavos.sumar(Centavos.negar(pagado), devuelto);
}
