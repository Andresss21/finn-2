// Tipos y piezas comunes de los selectores de pantalla (04 §6.0.3 y §6.0.5): `Ref`, `SobregiroDto`,
// `PeriodoDto` y las causas de un pago excedente. Solo leen la instantánea; no recalculan nada.
import type { Celda } from '../calculo/disponible';
import { type EstadoDePeriodo, estadoDe, type Periodo } from '../calculo/periodos';
import { atribucionDelExcedente } from '../calculo/sobregiros';
import type { Instantanea, Uuid } from '../hechos';
import type { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';

/** Referencia a una cuenta, categoría, grupo o programada (04 §6.0.3). */
export interface Ref {
  readonly id: Uuid;
  readonly nombre: string;
  readonly archivada?: true;
}

/** Partes de §4.7 de un sobregiro. */
export interface SobregiroDto {
  readonly tipo: 'debito' | 'tarjeta' | 'mixto';
  readonly total: Centavos;
  readonly parteTarjeta: Centavos;
  readonly parteDebito: Centavos;
}

export interface PeriodoDto {
  readonly inicio: FechaLocal;
  readonly fin: FechaLocal;
  readonly dias: number;
  readonly estado: EstadoDePeriodo;
  readonly transicion: boolean;
  /** Solo en el activo: hoy − inicio + 1. */
  readonly diasTranscurridos?: number;
  /** Solo en el activo: fin − hoy. */
  readonly diasRestantes?: number;
}

export interface CausaDeExcedente {
  readonly causa: 'cobro' | 'devolucion' | 'pago';
  readonly monto: Centavos;
}

export function periodoDto(i: Instantanea, p: Periodo): PeriodoDto {
  const estado = estadoDe(p, i.hoy);
  const base = {
    inicio: p.inicio,
    fin: p.fin,
    dias: FechaLocal.diasEntre(p.inicio, p.fin) + 1,
    estado,
    transicion: p.transicion,
  };
  return estado === 'activo'
    ? {
        ...base,
        diasTranscurridos: FechaLocal.diasEntre(p.inicio, i.hoy) + 1,
        diasRestantes: FechaLocal.diasEntre(i.hoy, p.fin),
      }
    : base;
}

interface Fila {
  readonly id: Uuid;
  readonly nombre: string;
  readonly archivada: boolean;
}

export interface Nombres {
  readonly categoria: (id: Uuid) => Ref;
  readonly grupo: (id: Uuid) => Ref;
  readonly cuenta: (id: Uuid) => Ref;
}

const memoria = new WeakMap<Instantanea, Nombres>();

/** Las referencias por id de la instantánea, armadas una vez. Un id sin fila es un error de hechos. */
export function nombres(i: Instantanea): Nombres {
  let n = memoria.get(i);
  if (n === undefined) {
    const de = (filas: readonly Fila[], que: string) => {
      const m = new Map<Uuid, Ref>(
        filas.map((x) => [
          x.id,
          x.archivada
            ? { id: x.id, nombre: x.nombre, archivada: true }
            : { id: x.id, nombre: x.nombre },
        ]),
      );
      return (id: Uuid): Ref => {
        const r = m.get(id);
        if (r === undefined) throw new RangeError(`${que} ${id} inexistente`);
        return r;
      };
    };
    const h = i.hechos;
    n = {
      categoria: de(h.categorias, 'categoría'),
      grupo: de(
        h.grupos.map((g) => ({ id: g.id, nombre: g.nombre, archivada: g.archivado })),
        'grupo',
      ),
      cuenta: de(h.cuentas, 'cuenta'),
    };
    memoria.set(i, n);
  }
  return n;
}

/** El sobregiro de la celda con sus partes (§4.7), o `null` si Disp ≥ 0. */
export function sobregiroDe(x: Celda): SobregiroDto | null {
  if (x.reinicio <= 0) return null;
  const tipo = x.sobT > 0 ? (x.sobD > 0 ? 'mixto' : 'tarjeta') : 'debito';
  return { tipo, total: x.reinicio, parteTarjeta: x.sobT, parteDebito: x.sobD };
}

/** E(t, A) por causa (AV-04/05/06); solo las causas con monto. */
export function causasDelExcedente(i: Instantanea, tarjetaId: Uuid): CausaDeExcedente[] {
  const a = atribucionDelExcedente(i.presupuesto, tarjetaId);
  return (
    [
      ['cobro', a.cobros],
      ['devolucion', a.devoluciones],
      ['pago', a.pagos],
    ] as const
  )
    .filter(([, monto]) => monto > 0)
    .map(([causa, monto]) => ({ causa, monto }));
}
