// OPT-05 Crear, editar, activar o desactivar un formato bancario (04 §3.10, §8.5, §8.7; BE-46, BE-47; EN-1).
// No pasa por `aplicar` del marco (el motor no modela `formatos_bancarios`, [H]): `validarFormato` primero y fuera del
// bloqueo (el análisis de `recheck` puede tardar hasta 10 s), después `escribir()` con la fila y su auditoría en la misma
// transacción (`datos.tipo = 'auditoria_formato'`, fila anterior y nueva). Los formatos nunca se eliminan (DB-17).
// Natural (4.6): enviar la fila tal como ya está no escribe nada ni audita (`yaAplicada`).
import { validarFormato, type ValidacionFormato } from '@finn/sms';
import {
  escribir,
  guardarFormato,
  leerFormato,
  leerInstitucion,
  nombreDeFormatoEnUso,
  registrarAuditoriaFormato,
  type AccionAuditoriaFormato,
  type FilaFormato,
  type OpcionesTx,
} from '@finn/db';
import { optFormato, type EntradaFormato } from '../../contratos/formatos.ts';
import { errorDeBase } from '../../errores-de-base.ts';
import {
  errorDeValidacion,
  mensajeInterno,
  type ErrorFinn,
  type ResultadoAccion,
} from '../../errores/index.ts';
import { idErrorAleatorio } from '../marco.ts';

export interface SalidaFormato {
  readonly formatoId: string;
  readonly accion: AccionAuditoriaFormato | null;
}

const LARGO_ATAQUE = 40;
const MENSAJES = {
  patron_invalido: 'El patrón no es una expresión regular válida.',
  banderas_no_permitidas: 'Solo se permiten las banderas i, m, s y u, en ese orden.',
  grupos_obligatorios:
    'El patrón necesita los grupos ultimos4 y monto, y fecha solo si elegís formatos de fecha.',
} as const;

/** El texto de cada rechazo de la política de 04 §8.5, en el campo que corrige el usuario. */
function rechazoDePolitica(v: Extract<ValidacionFormato, { valido: false }>): ErrorFinn {
  const campo = v.error === 'banderas_no_permitidas' ? 'banderas' : 'patron';
  const mensaje =
    v.error === 'patron_lento'
      ? v.grado === null
        ? 'No pudimos comprobar que el patrón sea rápido. Simplificalo.'
        : `El patrón puede tardar demasiado con ciertos textos (grado ${String(v.grado)}, por ejemplo «${v.ataque.slice(0, LARGO_ATAQUE)}»). Simplificalo.`
      : MENSAJES[v.error];
  const base = errorDeValidacion([{ path: [campo], message: mensaje }]);
  return { ...base, codigo: v.error };
}

const validacion = (campo: string, mensaje: string): ErrorFinn =>
  errorDeValidacion([{ path: [campo], message: mensaje }]);

const igual = (a: FilaFormato, b: FilaFormato): boolean =>
  a.institucionId === b.institucionId &&
  a.nombre === b.nombre &&
  a.tipoMovimiento === b.tipoMovimiento &&
  a.patron === b.patron &&
  a.banderas === b.banderas &&
  a.montoSeparadorMiles === b.montoSeparadorMiles &&
  a.montoSeparadorDecimal === b.montoSeparadorDecimal &&
  a.activo === b.activo &&
  a.formatosFecha.join('|') === b.formatosFecha.join('|');

/** La acción de la auditoría: solo cambió `activo` → activar o desactivar; otro cambio → editar. */
function accionDe(antes: FilaFormato | null, despues: FilaFormato): AccionAuditoriaFormato {
  if (antes === null) return 'crear';
  if (antes.activo !== despues.activo && igual({ ...antes, activo: despues.activo }, despues))
    return despues.activo ? 'activar' : 'desactivar';
  return 'editar';
}

type Fin =
  | { readonly tipo: 'error'; readonly error: ErrorFinn }
  | { readonly tipo: 'ya_aplicada' }
  | { readonly tipo: 'escrito'; readonly accion: AccionAuditoriaFormato };

/**
 * `sesion` es el `session_id` del JWT (lo trae `exigirSesionEscritura()` en la Server Action); "quién" es siempre
 * el usuario único y no se guarda (ADR-22).
 */
export async function guardarFormatoBancario(
  cruda: unknown,
  sesion: string,
  opciones?: () => OpcionesTx,
  nuevoIdError: () => string = idErrorAleatorio,
): Promise<ResultadoAccion<SalidaFormato>> {
  const analizada = optFormato.safeParse(cruda);
  if (!analizada.success) return { ok: false, error: errorDeValidacion(analizada.error.issues) };
  const e: EntradaFormato = analizada.data;
  const despues: FilaFormato = e;
  const politica = validarFormato(e);
  if (!politica.valido) return { ok: false, error: rechazoDePolitica(politica) };

  let fin: Fin;
  try {
    fin = await escribir(async (tx): Promise<Fin> => {
      if ((await leerInstitucion(tx, e.institucionId)) === null)
        return {
          tipo: 'error',
          error: validacion('institucionId', 'Elegí una institución existente.'),
        };
      const antes = await leerFormato(tx, e.id);
      if (antes !== null && igual(antes, despues)) return { tipo: 'ya_aplicada' };
      if (await nombreDeFormatoEnUso(tx, e.institucionId, e.nombre, e.id))
        return {
          tipo: 'error',
          error: validacion('nombre', 'Ya hay un formato con ese nombre en esa institución.'),
        };
      const accion = accionDe(antes, despues);
      // La auditoría primero: si la base rechaza la fila, el ROLLBACK se lleva también la auditoría (8.7)
      await registrarAuditoriaFormato(tx, { accion, sesion, antes, despues });
      await guardarFormato(tx, despues);
      return { tipo: 'escrito', accion };
    }, opciones?.());
  } catch (error) {
    const idError = nuevoIdError();
    return {
      ok: false,
      error: errorDeBase(error, idError) ?? {
        categoria: 'INTERNO',
        codigo: 'interno',
        mensaje: mensajeInterno(idError),
        idError,
      },
    };
  }
  if (fin.tipo === 'error') return { ok: false, error: fin.error };
  const yaAplicada = fin.tipo === 'ya_aplicada';
  return {
    ok: true,
    valor: { formatoId: e.id, accion: fin.tipo === 'escrito' ? fin.accion : null },
    yaAplicada,
    avisos: [],
  };
}
