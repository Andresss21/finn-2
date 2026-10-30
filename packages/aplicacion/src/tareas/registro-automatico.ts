// Paso 1 de la tarea diaria: registro automático de las programadas (04 §10.2; OP-43, RT-03, RT-15, B-12, PR-3, QB-1).
// Un `escribir()` por ocurrencia, en orden cronológico, con la fecha esperada. El id de la transacción sale de la
// ocurrencia (UUIDv5): repetir la tarea no produce cambios (inv. 15). El `aplicar` del dominio se cambia por
// `registrarAutomatica`, que no registra las de un período cerrado ([R2] ajuste 2): esas, y las que fallan (cuenta
// archivada, cuota sin modelo), quedan pendientes y se notifican una sola vez por ocurrencia (AV-23, CB-33).
import {
  cargarHechos,
  escribirTecnico as escribirTecnicoDb,
  existeNotificacionConClave,
  leer as leerDb,
} from '@finn/db';
import { aplicar } from '@finn/dominio';
import { ocurrenciasAutomaticas, registrarAutomatica } from '@finn/dominio/selectores';
import type { Hechos, Uuid } from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';
import { uuidv5 } from '../ids.ts';
import { confirmar } from '../operaciones/marco.ts';
import { OP43 } from '../operaciones/programadas/index.ts';
import { registrarNotificacion } from '../push/registro.ts';
import type { MotivoNotificacion } from '../push/motivos.ts';
import type { DepsTarea, PasoTarea } from './diaria.ts';

/** 10.2 paso 1: máximo de ocurrencias por ejecución; el resto, en la siguiente. */
export const LIMITE_REGISTRO = 200;
/** Espacio de nombres de los ids de las transacciones del registro automático (BE-31). */
const ESPACIO_REGISTRO = '4b1c9a52-7e0d-4f63-9a18-3d5e8c2f7b46';

/** Esta aplicación de OP-43 no es la de un toque: no escribe nada retroactivo ([R2] ajuste 2). */
const aplicarAutomatico: typeof aplicar = (hechos, comando, hoy) =>
  comando.operacion === 'OP-43'
    ? registrarAutomatica(hechos, comando, hoy)
    : aplicar(hechos, comando, hoy);

interface Ocurrencia {
  readonly programadaId: Uuid;
  readonly fechaEsperada: FechaLocal;
  readonly comercio: string;
}

/** Una notificación por clave (AV-23): la ocurrencia que sigue pendiente avisa una vez, no cada día. */
async function notificarUnaVez(
  d: DepsTarea,
  clave: string,
  motivo: MotivoNotificacion,
  texto: { readonly titulo: string; readonly cuerpo: string },
  destino: Readonly<Record<string, string>>,
): Promise<void> {
  const ya = await (d.leer ?? leerDb)(
    (tx) => existeNotificacionConClave(tx, clave),
    d.opciones?.(),
  );
  if (ya) return;
  await (d.escribirTecnico ?? escribirTecnicoDb)(async (tx) => {
    await registrarNotificacion(tx, motivo, { ...texto, datos: { clave, destino } });
  }, d.opciones?.());
}

const MENSAJE_CERRADO = 'Pago programado pendiente en un período cerrado; revisalo.';

export const pasoRegistro: PasoTarea = {
  n: 1,
  async ejecutar(d) {
    const pendientes: readonly Ocurrencia[] = await (d.leer ?? leerDb)(async (tx) => {
      const hechos: Hechos = await d.memoria.hechos(tx.estado.revision, () =>
        (d.cargar ?? cargarHechos)(tx),
      );
      const hoy = FechaLocal.desdeTexto(tx.estado.hoy);
      return ocurrenciasAutomaticas(hechos, hoy)
        .slice(0, LIMITE_REGISTRO)
        .map((o) => ({
          ...o,
          comercio: hechos.programadas.find((p) => p.id === o.programadaId)?.comercio ?? '',
        }));
    }, d.opciones?.());

    let registradas = 0;
    let sinRegistrar = 0;
    for (const o of pendientes) {
      const { programadaId, fechaEsperada, comercio } = o;
      const id = uuidv5(`${programadaId}|${fechaEsperada}`, ESPACIO_REGISTRO);
      const clave = `${programadaId}:${fechaEsperada}`;
      const r = await confirmar(
        OP43,
        { id, programadaId, fechaEsperada },
        { ...d, aplicar: aplicarAutomatico },
      );
      const programada = { pantalla: 'programada', programadaId, fechaEsperada };
      if (r.ok) {
        registradas++;
        if (!r.yaAplicada)
          await notificarUnaVez(
            d,
            `registro_automatico:${clave}`,
            'registro_automatico',
            {
              titulo: `Se registró ${comercio}`,
              cuerpo: `Pago programado registrado con su fecha esperada, ${fechaEsperada}.`,
            },
            { pantalla: 'transaccion', transaccionId: id },
          );
      } else if (r.error.codigo === 'ocurrencia_ya_resuelta') {
        // otra escritura la resolvió entre la lectura y este `escribir()`: no hay nada que avisar
      } else if (r.error.categoria === 'DOMINIO' || r.error.categoria === 'REQUIERE_CONFIRMACION') {
        sinRegistrar++;
        const cerrado = r.error.codigo === 'ocurrencia_en_periodo_cerrado';
        await notificarUnaVez(
          d,
          `${cerrado ? 'ocurrencia_en_periodo_cerrado' : 'registro_automatico_fallido'}:${clave}`,
          cerrado ? 'ocurrencia_en_periodo_cerrado' : 'registro_automatico_fallido',
          {
            titulo: cerrado ? `${comercio} quedó pendiente` : `No pudimos registrar ${comercio}`,
            cuerpo: cerrado ? MENSAJE_CERRADO : r.error.mensaje,
          },
          programada,
        );
      } else {
        sinRegistrar++; // un error transitorio (OCUPADO, INTERNO): la ocurrencia sigue pendiente para la próxima corrida
      }
    }
    return { cantidad: registradas, detalle: { registradas, sinRegistrar } };
  },
};
