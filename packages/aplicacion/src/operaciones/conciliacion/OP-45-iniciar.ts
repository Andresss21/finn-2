// OP-45 Iniciar conciliación (04 §3.8, §9.1 a §9.5): de lectura, con `leer()` (CH-25) y sin hechos. Decodifica y
// reconoce el CSV (`@finn/conciliacion`), comprueba que el formato sea del tipo de la cuenta (9.2), clasifica con los
// hechos actuales (BE-48, en el dominio) y firma el estado con la clave activa y un vencimiento de 24 h (BE-49). Ni
// el archivo ni la carga se guardan (9.7).
import { ADAPTADORES, leerEstado, type EstadoNormalizado } from '@finn/conciliacion';
import { calcular, type Instantanea, type Rechazo } from '@finn/dominio';
import { clasificarConciliacion, type Clasificacion } from '@finn/dominio/selectores';
import { FechaLocal } from '@finn/dominio/valores';
import { cargarHechos, leer as leerDb } from '@finn/db';
import { firmarCarga, VIGENCIA_MS, type DepsConciliacion } from '../../conciliacion/carga.ts';
import { op45, type EntradaOp45 } from '../../contratos/conciliacion.ts';
import {
  errorDeValidacion,
  mensajeDeRechazo,
  type ErrorFinn,
  type ResultadoAccion,
} from '../../errores/index.ts';
import { enLectura, type DepsMarco } from '../marco.ts';

/** La clasificación (§4.17) junto al estado leído y su carga firmada, que la interfaz guarda en el componente. */
export type SalidaOp45 = EstadoNormalizado & {
  readonly clasificacion: Clasificacion;
  readonly carga: string;
};

const rechazo = (r: Rechazo): ErrorFinn => ({
  categoria: r.codigo === 'no_encontrado' ? 'NO_ENCONTRADO' : 'DOMINIO',
  codigo: r.codigo,
  mensaje: mensajeDeRechazo(r) ?? r.codigo,
  ...(r.datos === undefined ? {} : { datos: r.datos }),
});

/**
 * El mensaje de una excepción va al evento y `sanearMensaje` no quita un texto sin comillas: lo que maneja el contenido
 * del archivo falla con su etapa y la clase del error, nunca con el mensaje original (9.7).
 */
function sinDatosDelArchivo<T>(etapa: string, paso: () => T): T {
  try {
    return paso();
  } catch (e) {
    throw new Error(`${etapa}: ${e instanceof Error ? e.name : 'error'}`);
  }
}

export async function iniciarConciliacion(
  cruda: unknown,
  d: DepsMarco & DepsConciliacion,
): Promise<ResultadoAccion<SalidaOp45>> {
  const analizada = op45.safeParse(cruda);
  if (!analizada.success) return { ok: false, error: errorDeValidacion(analizada.error.issues) };
  const { cuentaId, archivo }: EntradaOp45 = analizada.data;
  const r = await enLectura('OP-45', d, async (c): Promise<ErrorFinn | SalidaOp45> => {
    const estado = sinDatosDelArchivo('leerEstado', () => leerEstado(archivo));
    if ('error' in estado) {
      const { error: codigo, ...datos } = estado;
      return rechazo({ codigo, ...(Object.keys(datos).length > 0 ? { datos } : {}) });
    }
    const clasificacion = await (d.leer ?? leerDb)(
      async (tx): Promise<ErrorFinn | Clasificacion> => {
        const { revision, hoy } = tx.estado;
        c.revision = revision;
        const hechos = await d.memoria.hechos(revision, () => (d.cargar ?? cargarHechos)(tx));
        const i = d.memoria.instantanea(revision, hoy, () =>
          calcular(hechos, FechaLocal.desdeTexto(hoy)),
        ) as Instantanea;
        const cuenta = hechos.cuentas.find((k) => k.id === cuentaId);
        if (cuenta === undefined) return rechazo({ codigo: 'no_encontrado' });
        // Los formatos son de efectivo o de tarjeta: el tipo de la cuenta tiene que ser el del formato (9.2)
        if (ADAPTADORES[estado.formato]?.tipoCuenta !== cuenta.tipo)
          return rechazo({ codigo: 'cuenta_tipo_no_valido', datos: { tipo: cuenta.tipo } });
        return sinDatosDelArchivo('clasificar', () => clasificarConciliacion(i, cuentaId, estado));
      },
      d.opciones?.() ?? {},
    );
    if ('categoria' in clasificacion) return clasificacion;
    const carga = sinDatosDelArchivo('firmar', () =>
      firmarCarga(d.claves, cuentaId, estado, d.ahoraMs() + VIGENCIA_MS),
    );
    return { ...estado, clasificacion, carga };
  });
  if (!r.ok) return r;
  if ('categoria' in r.valor) return { ok: false, error: r.valor };
  return { ok: true, valor: r.valor, yaAplicada: false, avisos: [] };
}
