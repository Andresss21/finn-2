// `aplicar(hechos, comando, hoy)` (04 §2.4, BE-09; 01 §5.0): despacha el comando a su operación y
// verifica sobre el estado resultante las reglas comunes y las invariantes de §6 (§5.0.1). Un
// rechazo de negocio vuelve en `rechazos`; solo un comando mal formado lanza.
import { calcular } from '../calculo/calcular';
import type {
  AvisoOperacion,
  Cambio,
  ComandoDominio,
  Hechos,
  Instantanea,
  OperacionDeclarada,
  Rechazo,
  ResultadoAplicar,
} from '../hechos';
import { verificarInvariantes } from '../invariantes';
import type { FechaLocal } from '../valores/fecha-local';
import { aplicarCambios, verificarComunes } from './comunes';
import { avisosNuevosDeEstado, impacto, retroactiva } from './impacto';
import { op01 } from './op-01';
import { op02 } from './op-02';
import { op03 } from './op-03';
import { op04 } from './op-04';
import { op05 } from './op-05';
import { op06 } from './op-06';
import { op07 } from './op-07';
import { op09 } from './op-09';
import { op11 } from './op-11';
import { op12 } from './op-12';
import { op35 } from './op-35';
import { op48 } from './op-48';
import { esRechazo, porInvariantes, rechazo } from './rechazos';

/** Lo que produce una operación sobre la instantánea de antes, si no se rechaza. */
export interface Efecto {
  readonly cambios: readonly Cambio[];
  readonly avisos?: readonly AvisoOperacion[]; // los propios de la operación (AV-10 a AV-24)
  readonly operacionDeclarada?: OperacionDeclarada;
}

/** Una operación: función pura de la instantánea de antes y su comando. */
export type Manejador<C> = (antes: Instantanea, comando: C) => Efecto | Rechazo;

type Operacion = ComandoDominio['operacion'];

/** Despacho por OP; cada tarea de operaciones agrega la suya. */
const OPERACIONES: {
  readonly [K in Operacion]: Manejador<Extract<ComandoDominio, { operacion: K }>>;
} = {
  'OP-01': op01,
  'OP-02': op02,
  'OP-03': op03,
  'OP-04': op04,
  'OP-05': op05,
  'OP-06': op06,
  'OP-07': op07,
  'OP-09': op09,
  'OP-11': op11,
  'OP-12': op12,
  'OP-48': (antes, comando) => {
    const r = op48(antes.hechos.prestamos, comando);
    return esRechazo(r) ? r : { cambios: r };
  },
  // TA-120
  'OP-35': op35,
};

/** AV-01 (§5.0.3): impacto retroactivo, antes y después de confirmar. */
const AV01 = { codigo: 'AV-01', momento: 'antes_y_despues', requiereConfirmacion: true } as const;

/** El contrato público (04 §2.4); devuelve `ResultadoAplicar`. */
export function aplicar(hechos: Hechos, comando: ComandoDominio, hoy: FechaLocal) {
  // Cada manejador recibe solo la variante de su OP: la tabla la elige por `operacion`.
  const tabla = OPERACIONES as Partial<Record<string, Manejador<never>>>;
  const manejador = tabla[comando.operacion];
  if (manejador === undefined) throw new TypeError(`operación desconocida: ${comando.operacion}`);
  return ejecutar(hechos, comando, hoy, manejador as Manejador<ComandoDominio>);
}

/** El marco de `aplicar` con una operación dada (también la usan las pruebas del marco). */
export function ejecutar<C extends { readonly operacion: string }>(
  hechos: Hechos,
  comando: C,
  hoy: FechaLocal,
  manejador: Manejador<C>,
): ResultadoAplicar {
  const antes = calcular(hechos, hoy);
  const efecto = manejador(antes, comando);
  if (esRechazo(efecto)) return { ok: false, rechazos: [efecto] };
  const nuevos = aplicarCambios(antes.hechos, efecto.cambios);
  const comunes = verificarComunes(antes, nuevos, efecto.cambios, comando.operacion);
  if (comunes.length > 0) return { ok: false, rechazos: comunes };
  let despues: Instantanea;
  try {
    despues = calcular(nuevos, hoy);
  } catch (e) {
    // Un estado que el motor no puede calcular rompe una invariante estructural (inv. 22, 25).
    if (!(e instanceof RangeError)) throw e;
    return { ok: false, rechazos: [rechazo('invariante_violada', { error: e.message })] };
  }
  const violaciones = verificarInvariantes(despues);
  if (violaciones.length > 0) return { ok: false, rechazos: porInvariantes(violaciones) };
  const { cambios, avisos: propios = [], ...declarada } = efecto;
  const delta = impacto(antes, despues);
  const { deltaLpa, deltaReduccionProyectadaLpaAlCierre } = delta;
  const datos = { deltaLpa, deltaReduccionProyectadaLpaAlCierre };
  const av01 = retroactiva(antes, despues, cambios) ? [{ ...AV01, datos }] : [];
  const avisos = [...propios, ...av01, ...avisosNuevosDeEstado(antes, despues)];
  avisos.sort((a, b) => (a.codigo < b.codigo ? -1 : a.codigo > b.codigo ? 1 : 0));
  const total = { ...delta, avisos };
  return { ok: true, cambios, ...declarada, hechosNuevos: despues.hechos, impacto: total, avisos };
}
