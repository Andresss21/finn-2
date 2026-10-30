// OPT-08 Exportar (JSON o CSV) (04 §3.10, §16; ADR-22): solo lee, en una instantánea de `leer()` (CH-25), con la
// misma forma que una consulta. Sin escrituras. El Route Handler (Parte C) exige la sesión de escritura (04 §12).
import { consultar, type DepsConsulta } from '../consultas/comun.ts';
import {
  formatoExportacion,
  type ArchivoExportado,
  type FormatoExportacion,
} from '../contratos/exportacion.ts';
import { armarCsv, armarJson } from './formatos.ts';

export function exportar(d: DepsConsulta, formato: unknown): Promise<ArchivoExportado> {
  return consultar(
    d,
    { nombre: 'exportar', contrato: formatoExportacion, parametros: formato },
    ({ i, encabezado }, f: FormatoExportacion) =>
      f === 'json'
        ? armarJson(i.hechos, encabezado.revision, encabezado.hoy)
        : armarCsv(i.hechos, encabezado.hoy),
  );
}
