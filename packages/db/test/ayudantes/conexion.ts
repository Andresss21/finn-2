// La conexión del arnés, sin Vitest (TA-219): el ejecutor `int` también corre en el proceso de Playwright (DP-17), donde
// Vitest no se puede cargar. En `integracion` la provee base.ts; en E2E, `FINN_ARNES_PG` (tools/pruebas/e2e/pila.ts).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import type { Consultar } from '../../../../tools/db/plantilla.ts';

export type Rol = 'admin' | 'migraciones' | 'app';
// `usuarioAdmin`: en la pila de Supabase el superusuario es `supabase_admin`, no `postgres`
export type ConexionArnes = {
  host: string;
  puerto: number;
  claves: Record<Rol, string>;
  usuarioAdmin?: string;
};
export type BasePrueba = { nombre: string; url: string; urlMigraciones: string; urlAdmin: string };

const USUARIO: Record<Rol, string> = {
  admin: 'postgres',
  migraciones: 'finn_migraciones',
  app: 'finn_app',
};

let proveedor = (): ConexionArnes => {
  const crudo = process.env['FINN_ARNES_PG'];
  if (!crudo) throw new Error('falta FINN_ARNES_PG: la fija pnpm test:e2e al levantar la pila');
  return JSON.parse(crudo) as ConexionArnes;
};
export const usarConexion = (p: () => ConexionArnes): void => {
  proveedor = p;
};

export const url = (c: ConexionArnes, base: string, rol: Rol): string => {
  const usuario = rol === 'admin' ? (c.usuarioAdmin ?? USUARIO.admin) : USUARIO[rol];
  return `postgresql://${usuario}:${c.claves[rol]}@${c.host}:${c.puerto}/${base}`;
};

/** URL de `base` con `rol`, en el contenedor que preparó el arnés. */
export const urlDe = (base: string, rol: Rol): string => url(proveedor(), base, rol);

/** Un script SQL en una conexión propia, cerrada al terminar; filas como psql `-A -t` (columnas con `|`). */
export const consultar: Consultar = async (urlBase, sql) => {
  const c = new pg.Client({ connectionString: urlBase });
  await c.connect();
  try {
    // Un script con varias sentencias devuelve un resultado por sentencia (protocolo simple)
    const r = (await c.query({ text: sql, rowMode: 'array' })) as unknown as
      pg.QueryArrayResult | pg.QueryArrayResult[];
    const resultados: pg.QueryArrayResult[] = Array.isArray(r) ? r : [r];
    return resultados.flatMap((x) =>
      (x.rows as unknown[][]).map((f) =>
        f.map((v) => (v === null ? '' : String(v as string | number | boolean))).join('|'),
      ),
    );
  } finally {
    await c.end();
  }
};

/** `tools/pruebas/reloj-simulado.sql` como finn_migraciones; falla si la base no tiene la marca (CT-02). */
export const instalarRelojSimulado = async (base: BasePrueba): Promise<void> => {
  const ruta = fileURLToPath(
    new URL('../../../../tools/pruebas/reloj-simulado.sql', import.meta.url),
  );
  await consultar(base.urlMigraciones, readFileSync(ruta, 'utf8'));
};

/** Una base del contenedor por su nombre; las URL se leen en las pruebas, no al recolectar. */
export const baseLlamada = (nombre: string): BasePrueba => ({
  nombre,
  get url() {
    return urlDe(nombre, 'app');
  },
  get urlMigraciones() {
    return urlDe(nombre, 'migraciones');
  },
  get urlAdmin() {
    return urlDe(nombre, 'admin');
  },
});
