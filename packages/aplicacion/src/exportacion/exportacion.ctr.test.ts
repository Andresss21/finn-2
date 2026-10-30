// Contrato de la exportación (TA-168; OPT-08, 04 §3.10, §16; ADR-22): el JSON de hechos pasa su contrato Zod con la
// versión de formato y el CSV de transacciones muestra los negativos con el guion ASCII (V5-02).
import { describe, expect, it } from 'vitest';
import type { Hechos } from '@finn/dominio';
import { exportacionJson, formatoExportacion, VERSION_FORMATO } from '../contratos/exportacion.ts';
import { armarCsv, armarJson } from './formatos.ts';

const TABLAS = [
  'vigencias_ciclo',
  'cuentas',
  'tarjetas',
  'prestamos',
  'inversiones',
  'grupos',
  'categorias',
  'asignaciones',
  'deudores',
  'transacciones',
  'efectos',
  'lineas',
  'condonaciones',
  'metas',
  'programadas',
  'programada_lineas',
  'ocurrencias_resueltas',
  'conciliaciones',
] as const;

const hechos = (() => {
  const base = Object.fromEntries(TABLAS.map((t) => [t, []])) as Record<string, unknown[]>;
  base.categorias = [{ id: 'c1', nombre: 'Comida, "casa"' }];
  base.transacciones = [
    {
      id: 't1',
      tipo: 'gasto',
      fecha: '2026-10-05',
      claveOrden: '2026-10-05T10:00:00.000Z',
      comercio: 'Súper',
      nota: '=SUMA(A1)',
      total: -4500,
    },
    {
      id: 't2',
      tipo: 'ingreso',
      fecha: '2026-10-06',
      claveOrden: '2026-10-06T10:00:00.000Z',
      comercio: null,
      nota: null,
      total: 120005,
    },
  ];
  base.lineas = [
    { id: 'l1', transaccionId: 't1', orden: 1, monto: -4500, categoriaId: 'c1', deudorId: null },
  ];
  return base as unknown as Hechos;
})();

describe('PRU-CTR-AJUS', () => {
  it('PRU-CTR-AJUS-101 [V5-02] OPT-08: la exportación JSON pasa su contrato con la versión de formato y el CSV de transacciones muestra -45.00 con el signo ASCII', () => {
    const json = armarJson(hechos, '42', '2026-10-29');
    const cuerpo = exportacionJson.parse(JSON.parse(json.contenido));
    expect(cuerpo.versionFormato).toBe(VERSION_FORMATO);
    expect(Object.keys(cuerpo.hechos).sort()).toEqual([...TABLAS].sort());
    expect(cuerpo.hechos.transacciones).toHaveLength(2);
    expect(exportacionJson.safeParse({ ...cuerpo, versionFormato: 2 }).success).toBe(false);
    expect(json.nombre).toBe('finn-hechos-2026-10-29.json');

    const csv = armarCsv(hechos, '2026-10-29');
    const filas = csv.contenido.split('\r\n');
    expect(filas[0]).toBe(
      'transaccion_id,fecha,tipo,comercio,nota,total,linea_orden,linea_monto,categoria,deudor',
    );
    expect(filas[1]).toBe(
      't1,2026-10-05,gasto,Súper,\'=SUMA(A1),-45.00,1,-45.00,"Comida, ""casa""",',
    );
    expect(filas[2]).toBe('t2,2026-10-06,ingreso,,,1200.05,,,,');
    expect(csv.contenido).not.toContain('−');
    expect(csv.nombre).toBe('finn-transacciones-2026-10-29.csv');

    expect(formatoExportacion.safeParse('xml').success).toBe(false);
  });
});
