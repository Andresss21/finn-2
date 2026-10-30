// Paso 1 de la tarea diaria: registro automático de las programadas (04 §10.2; OP-43, RT-03, B-12, PR-3, QB-1). Un
// `escribir()` por ocurrencia, en orden cronológico, con la fecha esperada y un id derivado de la ocurrencia (repetir
// la tarea no cambia nada, inv. 15). El `aplicar` es `registrarAutomatica`: no registra un período cerrado ([R2]).
// Lo que no se registra (período cerrado, cuenta archivada, cuota sin modelo) queda pendiente y avisa una vez (AV-23).
import {
  cargarHechos,
  escribirTecnico as escribirTecnicoDb,
  existeNotificacionConClave,
  leer as leerDb,
} from '@finn/db';
import { aplicar } from '@finn/dominio';
import { ocurrenciasAutomaticas, registrarAutomatica } from '@finn/dominio/selectores';
import { FechaLocal } from '@finn/dominio/valores';
import { uuidv5 } from '../ids.ts';
import { confirmar } from '../operaciones/marco.ts';
import { OP43 } from '../operaciones/programadas/index.ts';
import type { MotivoNotificacion } from '../push/motivos.ts';
import { registrarNotificacion } from '../push/registro.ts';
import type { DepsTarea, PasoTarea } from './diaria.ts';

/** 10.2 paso 1: máximo de ocurrencias por ejecución; el resto, en la siguiente. */
export const LIMITE_REGISTRO = 200;
const ESPACIO_REGISTRO = '4b1c9a52-7e0d-4f63-9a18-3d5e8c2f7b46'; // ids de las transacciones del registro (BE-31)

const aplicarAutomatico: typeof aplicar = (hechos, comando, hoy) =>
  comando.operacion === 'OP-43'
    ? registrarAutomatica(hechos, comando, hoy)
    : aplicar(hechos, comando, hoy);

/** Un aviso por clave (AV-23): la ocurrencia que sigue pendiente no avisa cada día. */
async function avisar(
  d: DepsTarea,
  motivo: MotivoNotificacion,
  clave: string,
  texto: string[],
  destino: Readonly<Record<string, string>>,
) {
  const [titulo = '', cuerpo = ''] = texto;
  const ya = await (d.leer ?? leerDb)(
    (tx) => existeNotificacionConClave(tx, clave),
    d.opciones?.(),
  );
  if (!ya)
    await (d.escribirTecnico ?? escribirTecnicoDb)(async (tx) => {
      await registrarNotificacion(tx, motivo, { titulo, cuerpo, datos: { clave, destino } });
    }, d.opciones?.());
}

export const pasoRegistro: PasoTarea = {
  n: 1,
  async ejecutar(d) {
    const comercios = new Map<string, string>();
    const ocurrencias = await (d.leer ?? leerDb)(async (tx) => {
      const hechos = await d.memoria.hechos(tx.estado.revision, () =>
        (d.cargar ?? cargarHechos)(tx),
      );
      for (const p of hechos.programadas) comercios.set(p.id, p.comercio);
      const hoy = FechaLocal.desdeTexto(tx.estado.hoy);
      return ocurrenciasAutomaticas(hechos, hoy).slice(0, LIMITE_REGISTRO);
    }, d.opciones?.());

    const dep = { ...d, aplicar: aplicarAutomatico };
    let registradas = 0;
    let sinRegistrar = 0;
    for (const { programadaId, fechaEsperada } of ocurrencias) {
      const comercio = comercios.get(programadaId) ?? '';
      const id = uuidv5(`${programadaId}|${fechaEsperada}`, ESPACIO_REGISTRO);
      const clave = `${programadaId}:${fechaEsperada}`;
      const r = await confirmar(OP43, { id, programadaId, fechaEsperada }, dep);
      if (r.ok) {
        registradas++;
        const texto = [
          `Se registró ${comercio}`,
          'Pago programado registrado con su fecha esperada.',
        ];
        if (!r.yaAplicada)
          await avisar(d, 'registro_automatico', `registro_automatico:${clave}`, texto, {
            pantalla: 'transaccion',
            transaccionId: id,
          });
        continue;
      }
      const { codigo, categoria, mensaje } = r.error;
      if (codigo === 'ocurrencia_ya_resuelta') continue; // otra escritura la resolvió entre la lectura y el `escribir()`
      sinRegistrar++;
      if (categoria !== 'DOMINIO' && categoria !== 'REQUIERE_CONFIRMACION') continue; // transitorio: sigue pendiente
      const cerrada = codigo === 'ocurrencia_en_periodo_cerrado';
      const motivo = cerrada ? codigo : 'registro_automatico_fallido';
      const texto = cerrada
        ? [
            `${comercio} quedó pendiente`,
            'Pago programado pendiente en un período cerrado; revisalo.',
          ]
        : [`No pudimos registrar ${comercio}`, mensaje];
      await avisar(d, motivo, `${motivo}:${clave}`, texto, {
        pantalla: 'programada',
        programadaId,
        fechaEsperada,
      });
    }
    return { cantidad: registradas, detalle: { registradas, sinRegistrar } };
  },
};
