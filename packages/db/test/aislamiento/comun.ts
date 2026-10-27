// Cuerpo de los dos archivos de PRU-INT-ESQ-101 (TA-050; 07 §5.2, DP-05). Cada archivo pide su base y crea
// la misma tabla, inserta su fila y lee: con bases clonadas ve solo la suya. FINN_ARNES_COMPARTIDA es el
// control: los dos usan esa base en lugar de una clonada, y el que lee último ve la fila del otro, sea cual
// sea el orden en que corran.
import pg from 'pg';
import { expect, it } from 'vitest';
import { crearBasePrueba, urlDe, type BasePrueba } from '../ayudantes/base.ts';

declare module 'vitest' {
  interface TaskMeta {
    base?: string;
  }
}

async function base(): Promise<BasePrueba> {
  const compartida = process.env['FINN_ARNES_COMPARTIDA'];
  if (compartida === undefined || compartida === '') return crearBasePrueba();
  return {
    nombre: compartida,
    url: urlDe(compartida, 'app'),
    urlMigraciones: urlDe(compartida, 'migraciones'),
    urlAdmin: urlDe(compartida, 'admin'),
  };
}

export async function probarAislamiento(archivo: string): Promise<void> {
  const b = await base();
  it(`archivo ${archivo}: ve solo su fila`, async ({ task }) => {
    task.meta.base = b.nombre;
    const c = new pg.Client({ connectionString: b.urlMigraciones });
    await c.connect();
    try {
      await c.query('CREATE TABLE IF NOT EXISTS finn.aislamiento (archivo text NOT NULL)');
      await c.query('INSERT INTO finn.aislamiento (archivo) VALUES ($1)', [archivo]);
      const { rows } = await c.query('SELECT archivo FROM finn.aislamiento ORDER BY archivo');
      expect(rows).toEqual([{ archivo }]);
    } finally {
      await c.end();
    }
  });
}
