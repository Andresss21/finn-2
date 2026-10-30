// OPT-06 Probar un formato contra un SMS (04 §3.10, §8.7): lectura, sin escribir. `probar(formato, texto)` de @finn/sms
// sobre el formato guardado (`formatoId`) o el que se está editando (`formato`), contra el SMS elegido. Muestra qué
// grupos capturó y qué normalizador falló. Respeta el límite de interpretación (PR-2): un SMS más largo no se evalúa.
import {
  LARGO_MAXIMO_INTERPRETABLE,
  probar,
  type FormatoSms,
  type ResultadoDePrueba,
} from '@finn/sms';
import { leer, leerFormato, smsPorId, type OpcionesTx } from '@finn/db';
import { optProbar } from '../../contratos/formatos.ts';
import { errorDeBase } from '../../errores-de-base.ts';
import {
  errorDeValidacion,
  mensajeDeRechazo,
  mensajeInterno,
  type ErrorFinn,
  type ResultadoAccion,
} from '../../errores/index.ts';
import { idErrorAleatorio } from '../marco.ts';

export type SalidaProbar = ResultadoDePrueba & { readonly demasiadoLargo: boolean };

const noEncontrado = (): ErrorFinn => ({
  categoria: 'NO_ENCONTRADO',
  codigo: 'no_encontrado',
  mensaje: mensajeDeRechazo({ codigo: 'no_encontrado' }) ?? 'no_encontrado',
});

export async function probarFormato(
  cruda: unknown,
  opciones?: () => OpcionesTx,
  nuevoIdError: () => string = idErrorAleatorio,
): Promise<ResultadoAccion<SalidaProbar>> {
  const analizada = optProbar.safeParse(cruda);
  if (!analizada.success) return { ok: false, error: errorDeValidacion(analizada.error.issues) };
  const e = analizada.data;
  try {
    const salida = await leer(async (tx): Promise<SalidaProbar | null> => {
      const sms = await smsPorId(tx, e.smsId);
      const formato =
        e.formato !== undefined
          ? { id: e.formatoId ?? e.smsId, activo: true, ...e.formato }
          : ((await leerFormato(tx, e.formatoId ?? '')) as FormatoSms | null); // la CHECK de 03 §3.21 acota formatosFecha
      if (sms === null || formato === null) return null;
      if (Array.from(sms.texto).length > LARGO_MAXIMO_INTERPRETABLE)
        return { coincide: false, demasiadoLargo: true };
      return { ...probar(formato, sms.texto), demasiadoLargo: false };
    }, opciones?.());
    if (salida === null) return { ok: false, error: noEncontrado() };
    return { ok: true, valor: salida, yaAplicada: false, avisos: [] };
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
}
