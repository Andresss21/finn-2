// OPT-07 Crear o renombrar una institución (04 §3.10, §8.7): `instituciones` [H] con `escribir()`. El nombre es único
// sin distinguir mayúsculas, verificado bajo el bloqueo (7.4). Creación con id del cliente (4.6.1) y, si el id existe,
// valor absoluto: el mismo nombre ya está aplicado (`yaAplicada`); no escribe nada.
import {
  escribir,
  guardarInstitucion,
  leerInstitucion,
  nombreDeInstitucionEnUso,
  type OpcionesTx,
} from '@finn/db';
import { optInstitucion } from '../../contratos/formatos.ts';
import { errorDeBase } from '../../errores-de-base.ts';
import {
  errorDeValidacion,
  mensajeInterno,
  type ErrorFinn,
  type ResultadoAccion,
} from '../../errores/index.ts';
import { idErrorAleatorio } from '../marco.ts';

export interface SalidaInstitucion {
  readonly institucionId: string;
  readonly accion: 'crear' | 'renombrar' | null;
}

type Fin = 'ya_aplicada' | 'crear' | 'renombrar' | ErrorFinn;

export async function guardarInstitucionBancaria(
  cruda: unknown,
  opciones?: () => OpcionesTx,
  nuevoIdError: () => string = idErrorAleatorio,
): Promise<ResultadoAccion<SalidaInstitucion>> {
  const analizada = optInstitucion.safeParse(cruda);
  if (!analizada.success) return { ok: false, error: errorDeValidacion(analizada.error.issues) };
  const e = analizada.data;
  let fin: Fin;
  try {
    fin = await escribir(async (tx): Promise<Fin> => {
      const actual = await leerInstitucion(tx, e.id);
      if (actual?.nombre === e.nombre) return 'ya_aplicada';
      if (await nombreDeInstitucionEnUso(tx, e.nombre, e.id))
        return errorDeValidacion([
          { path: ['nombre'], message: 'Ya hay una institución con ese nombre.' },
        ]);
      await guardarInstitucion(tx, { id: e.id, nombre: e.nombre });
      return actual === null ? 'crear' : 'renombrar';
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
  if (typeof fin === 'object') return { ok: false, error: fin };
  return {
    ok: true,
    valor: { institucionId: e.id, accion: fin === 'ya_aplicada' ? null : fin },
    yaAplicada: fin === 'ya_aplicada',
    avisos: [],
  };
}
