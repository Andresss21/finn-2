// Regla de comercio [H] para las pruebas de las consultas (TA-170): `reglas_comercio` no es de las 18 tablas [M], así
// que no cambia `finn.revision`. Se escribe como administrador: la prueba no tiene operaciones para esta tabla.
import pg from 'pg';
import type { BasePrueba } from './base.ts';

export async function sembrarReglaDeComercio(
  base: BasePrueba,
  patron: string,
  categoriaId: string,
): Promise<void> {
  const admin = new pg.Client({ connectionString: base.urlAdmin });
  await admin.connect();
  try {
    await admin.query('BEGIN; SELECT finn.tomar_bloqueo();');
    await admin.query('INSERT INTO finn.reglas_comercio (patron, categoria_id) VALUES ($1, $2)', [
      patron,
      categoriaId,
    ]);
    await admin.query('COMMIT;');
  } finally {
    await admin.end();
  }
}
