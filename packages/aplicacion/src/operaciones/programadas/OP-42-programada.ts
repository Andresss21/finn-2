// OP-42 Crear, editar, activar o desactivar una programada (04 §3.7; P17, M3, CF-20). Crear: creación (4.6.1), el id
// existente con los mismos datos es `ya_aplicada` y con otros `conflicto_id`. Editar: valor absoluto (4.6.2) sobre los
// campos que cambian, con las líneas como un solo valor. Activar o desactivar: natural, ya está en ese estado. El
// dominio cuenta las coincidencias propuestas [H] (`calendario_con_historial`, HZ-3): `resolver` las entrega.
import { randomUUID } from 'node:crypto';
import { contarCoincidenciasDeProgramada } from '@finn/db';
import type { Hechos, Programada, Uuid } from '@finn/dominio';
import { Centavos } from '@finn/dominio/valores';
import {
  CAMPOS_EDITABLES,
  erroresDeForma,
  op42,
  type EntradaOp42,
  type SalidaProgramada,
} from '../../contratos/programadas.ts';
import { ErrorValidacion, type DefinicionOperacion, type Veredicto } from '../marco.ts';

type Crear = Extract<EntradaOp42, { accion: 'crear' }>;
type Editar = Extract<EntradaOp42, { accion: 'editar' }>;
type Linea = { readonly monto: Centavos; readonly categoriaId: Uuid };
type Resuelto = { readonly entrada: EntradaOp42; readonly coincidencias: number };
type Registro = Readonly<Record<string, unknown>>;

const CLAVES = CAMPOS_EDITABLES.filter((k) => k !== 'lineas');
const programadaDe = (h: Hechos, id: Uuid): Programada | undefined =>
  h.programadas.find((p) => p.id === id);

/** Las líneas de la programada en su orden (BE-16), sin los ids. */
const lineasDe = (h: Hechos, id: Uuid): readonly Linea[] =>
  h.programada_lineas
    .filter((l) => l.programadaId === id)
    .sort((a, b) => a.orden - b.orden)
    .map(({ monto, categoriaId }) => ({ monto, categoriaId }));

const mismas = (a: readonly Linea[], b: readonly Linea[]): boolean =>
  a.length === b.length &&
  a.every((l, i) => l.monto === b.at(i)?.monto && l.categoriaId === b.at(i)?.categoriaId);

/** Cada campo pedido vale lo mismo en la programada (las líneas, en su orden); lo ausente es nulo. */
const coincide = (
  p: Programada,
  lineas: readonly Linea[],
  v: Registro,
  claves: readonly string[],
) =>
  claves.every((k) =>
    k === 'lineas'
      ? mismas(lineas, (v[k] as readonly Linea[] | undefined) ?? [])
      : (p as unknown as Registro)[k] === (v[k] ?? null),
  );

function editar(p: Programada, lineas: readonly Linea[], e: Editar): Veredicto<SalidaProgramada> {
  const pedidos = CAMPOS_EDITABLES.filter((k) => (e as Registro)[k] !== undefined);
  if (coincide(p, lineas, e, pedidos)) return { tipo: 'ya_aplicada', salida: {} };
  if (coincide(p, lineas, e.esperado, pedidos)) return { tipo: 'aplicar' };
  const actuales = Object.fromEntries(
    pedidos.map((k) => [k, k === 'lineas' ? lineas : (p as unknown as Registro)[k]]),
  );
  return { tipo: 'conflicto_desactualizado', actuales };
}

/** Lo que el contrato no ve de una edición: la forma de la programada resultante (03 §4.5.4, DB-16). */
function validarResultante(p: Programada, lineas: readonly Linea[], e: Editar): void {
  const nuevo: Registro = e;
  const con = <T>(k: string, actual: T): T => (nuevo[k] === undefined ? actual : (nuevo[k] as T));
  const [error] = erroresDeForma({
    tipo: p.tipo,
    frecuencia: con('frecuencia', p.frecuencia),
    frecuenciaDias: con('frecuenciaDias', p.frecuenciaDias),
    primeraFecha: con('primeraFecha', p.primeraFecha),
    fechaFin: con('fechaFin', p.fechaFin),
    cuentaDestinoId: con('cuentaDestinoId', p.cuentaDestinoId),
    lineas: e.lineas ?? lineas,
  });
  if (error !== undefined) throw new ErrorValidacion(error[0], error[1]);
}

export const OP42: DefinicionOperacion<EntradaOp42, Resuelto, SalidaProgramada> = {
  id: 'OP-42',
  contrato: op42,
  idempotencia: 'creacion',
  // Solo la creación fija sus ids secundarios con el id del cliente; una edición que reemplaza líneas usa ids nuevos
  idPrincipal: (e) => (e.accion === 'crear' ? e.id : (randomUUID() as Uuid)),
  comprobarIdempotencia(_tx, e, h) {
    if (e.accion === 'crear') {
      const p = programadaDe(h, e.id);
      if (p === undefined) return { tipo: 'aplicar' };
      const tolerancia = e.tolerancia ?? Centavos.cero;
      return p.tipo === e.tipo &&
        coincide(p, lineasDe(h, p.id), { ...e, tolerancia }, CAMPOS_EDITABLES)
        ? { tipo: 'ya_aplicada', salida: { id: e.id } }
        : { tipo: 'conflicto_id' };
    }
    const p = programadaDe(h, e.programadaId);
    if (p === undefined) return { tipo: 'no_encontrado' };
    if (e.accion === 'editar') return editar(p, lineasDe(h, p.id), e);
    return p.activa === e.activa ? { tipo: 'ya_aplicada', salida: {} } : { tipo: 'aplicar' };
  },
  async resolver(tx, e, h) {
    if (e.accion !== 'editar') return { entrada: e, coincidencias: 0 };
    const p = programadaDe(h, e.programadaId);
    if (p !== undefined) validarResultante(p, lineasDe(h, p.id), e);
    return { entrada: e, coincidencias: await contarCoincidenciasDeProgramada(tx, e.programadaId) };
  },
  comando({ entrada: e, coincidencias }, _instante, ids) {
    if (e.accion === 'activar')
      return {
        operacion: 'OP-42',
        accion: 'activar',
        programadaId: e.programadaId,
        activa: e.activa,
      };
    if (e.accion === 'crear')
      return {
        operacion: 'OP-42',
        accion: 'crear',
        id: e.id,
        ids,
        tipo: e.tipo,
        cuentaId: e.cuentaId,
        cuentaDestinoId: e.cuentaDestinoId ?? null,
        comercio: e.comercio,
        monto: e.monto,
        tolerancia: e.tolerancia ?? Centavos.cero,
        frecuencia: e.frecuencia,
        frecuenciaDias: e.frecuenciaDias ?? null,
        primeraFecha: e.primeraFecha,
        fechaFin: e.fechaFin ?? null,
        registroAutomatico: e.registroAutomatico,
        lineas: e.lineas ?? [],
      };
    const nuevo: Registro = e;
    const campos = Object.fromEntries(
      CLAVES.filter((k) => nuevo[k] !== undefined).map((k) => [k, nuevo[k]]),
    );
    return {
      operacion: 'OP-42',
      accion: 'editar',
      programadaId: e.programadaId,
      ids,
      campos,
      coincidencias,
      ...(e.lineas === undefined ? {} : { lineas: e.lineas }),
    };
  },
  salida: (_r, { entrada }) => (entrada.accion === 'crear' ? { id: entrada.id } : {}),
};
