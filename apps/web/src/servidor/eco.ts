// Operación de prueba del patrón de escritura (TA-210, PRU-E2E-TX-001 a 003): guarda un texto en memoria con
// idempotencia por id (04 §4.6.1). Solo existe con FINN_ENTORNO=pruebas; fuera de ahí responde NO_ENCONTRADO.
import { relojPermitido } from '@finn/aplicacion';
import { errorDeValidacion, type ErrorFinn, type ResultadoAccion } from '@finn/aplicacion/errores';
import type { ResultadoPrevisualizar } from '@finn/aplicacion/operaciones';
import type { OperacionAccionable } from './accion.ts';
import { contratoEco } from './eco-contrato.ts';

interface Almacen {
  readonly registros: Map<string, { texto: string }>;
  readonly idsRecibidos: string[];
}
const global = globalThis as { __finnEco?: Almacen };
/** En `globalThis`: la página y la acción pueden estar en bundles distintos del mismo proceso. */
export const almacenEco = (): Almacen =>
  (global.__finnEco ??= { registros: new Map(), idsRecibidos: [] });

const sinEco: ErrorFinn = {
  categoria: 'NO_ENCONTRADO',
  codigo: 'no_encontrado',
  mensaje: 'No existe.',
};
const ocupado: ErrorFinn = {
  categoria: 'OCUPADO',
  codigo: 'ocupado',
  mensaje: 'Finn está terminando otra operación. Intentá de nuevo en unos segundos.',
  idError: 'E-ECO000',
};
const conflictoId: ErrorFinn = {
  categoria: 'CONFLICTO',
  codigo: 'conflicto_id',
  mensaje: 'Ya existe un registro con este identificador y datos distintos. No se guardó nada.',
};

export interface SalidaEco {
  readonly id: string;
  readonly texto: string;
  readonly esperado: string | null;
}

export const operacionEco: OperacionAccionable<SalidaEco> = {
  previsualizar(): Promise<ResultadoAccion<ResultadoPrevisualizar>> {
    if (!relojPermitido()) return Promise.resolve({ ok: false, error: sinEco });
    const valor: ResultadoPrevisualizar = {
      revisionVista: 'eco-1',
      huellaImpacto: 'eco-huella',
      impacto: null,
      avisos: [],
      rechazos: [],
    };
    return Promise.resolve({ ok: true, valor, yaAplicada: false, avisos: [] });
  },
  confirmar(entrada): Promise<ResultadoAccion<SalidaEco>> {
    if (!relojPermitido()) return Promise.resolve({ ok: false, error: sinEco });
    const analizada = contratoEco.safeParse({ ...(entrada as object), modo: 'confirmar' });
    if (!analizada.success)
      return Promise.resolve({ ok: false, error: errorDeValidacion(analizada.error.issues) });
    const { id, texto, esperado } = analizada.data;
    const almacen = almacenEco();
    almacen.idsRecibidos.push(id);
    if (texto === 'ocupado') return Promise.resolve({ ok: false, error: ocupado });
    const previo = almacen.registros.get(id);
    if (previo !== undefined && previo.texto !== texto)
      return Promise.resolve({ ok: false, error: conflictoId });
    almacen.registros.set(id, { texto });
    return Promise.resolve({
      ok: true,
      valor: { id, texto, esperado: esperado?.texto ?? null },
      yaAplicada: previo !== undefined,
      avisos: [],
    });
  },
};
