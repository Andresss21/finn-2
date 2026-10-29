// OP-12 Fusionar categorías (04 §3.2, §4.5.4): eliminación del origen y confirmación siempre (AV-13, AV-01). Si el
// origen ya no existe pero `eliminaciones` lo registra, `ya_aplicada`. `resolver` carga las filas [H] del origen
// (reglas de comercio y líneas de movimientos) y el dominio las pasa al destino. Declara `fusion` para los
// triggers de la base (inv. 18 y 20 en `g_asignacion`).
import { fueEliminada, leerMovimientoLineasDeCategoria, leerReglasComercio } from '@finn/db';
import type { MovimientoLinea, ReglaComercio } from '@finn/dominio';
import { op12, type EntradaOp12, type SalidaCategoria } from '../../contratos/categorias.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { categoriaDe } from './comunes.ts';

type Resuelto = {
  readonly entrada: EntradaOp12;
  readonly reglas: readonly ReglaComercio[];
  readonly movimientoLineas: readonly MovimientoLinea[];
};

export const OP12: DefinicionOperacion<EntradaOp12, Resuelto, SalidaCategoria> = {
  id: 'OP-12',
  contrato: op12,
  idempotencia: 'eliminacion',
  exigeConfirmacion: true,
  operacionDeclarada: 'fusion',
  async comprobarIdempotencia(tx, e, h) {
    if (categoriaDe(h, e.origenId) !== undefined) return { tipo: 'aplicar' };
    return (await fueEliminada(tx, 'categorias', e.origenId))
      ? { tipo: 'ya_aplicada', salida: {} }
      : { tipo: 'no_encontrado' };
  },
  async resolver(tx, e) {
    const reglas = (await leerReglasComercio(tx)).filter((r) => r.categoriaId === e.origenId);
    const movimientoLineas = await leerMovimientoLineasDeCategoria(tx, e.origenId);
    return { entrada: e, reglas, movimientoLineas };
  },
  comando: ({ entrada, reglas, movimientoLineas }, _instante, ids) => ({
    operacion: 'OP-12',
    origenId: entrada.origenId,
    destinoId: entrada.destinoId,
    ids,
    reglas,
    movimientoLineas,
  }),
  salida: () => ({}),
};
