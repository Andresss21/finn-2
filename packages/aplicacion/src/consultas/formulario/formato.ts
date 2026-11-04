// `formulario({ operacion: 'formato', formatoId? })` (04 §6.14.4): el formato completo con `esperado` (si se edita), las
// instituciones y los 20 SMS más recientes sin reconocer o con error para probarlo (OPT-06). Todo es [H] o [I]: no pasa
// por el motor, así que no hay selector del dominio.
import { leerFormato, leerInstituciones, leerSmsParaProbar } from '@finn/db';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';

type P = Extract<Entrada, { operacion: 'formato' }>;

export async function formato({ tx }: ContextoConsulta, p: P) {
  const instituciones = await leerInstituciones(tx);
  const fila = p.formatoId === undefined ? null : await leerFormato(tx, p.formatoId);
  if (p.formatoId !== undefined && fila === null) throw noEncontrado();
  const campos =
    fila === null
      ? undefined
      : {
          id: fila.id,
          institucion: {
            id: fila.institucionId,
            nombre: instituciones.find((i) => i.id === fila.institucionId)?.nombre ?? '',
          },
          nombre: fila.nombre,
          tipoMovimiento: fila.tipoMovimiento,
          patron: fila.patron,
          banderas: fila.banderas,
          montoSeparadorMiles: fila.montoSeparadorMiles,
          montoSeparadorDecimal: fila.montoSeparadorDecimal,
          formatosFecha: [...fila.formatosFecha],
          activo: fila.activo,
        };
  return {
    operacion: 'formato' as const,
    catalogos: {},
    contexto: {
      ...(campos === undefined ? {} : { formato: { ...campos, esperado: { ...campos } } }),
      instituciones: instituciones.map((i) => ({ id: i.id, nombre: i.nombre })),
      smsParaProbar: await leerSmsParaProbar(tx),
    },
  };
}
