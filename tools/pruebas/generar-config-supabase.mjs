// Escribe supabase/config.toml desde infra/versiones.env (07 §5.1, DP-06).
// Uso: node tools/pruebas/generar-config-supabase.mjs [raiz]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerVersiones } from './leer-versiones.mjs';

const raiz = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', '..'));
const v = leerVersiones(raiz);
if (!/^\d+$/.test(v.PG_MAYOR ?? '')) {
  console.error('versiones.env: PG_MAYOR falta o no es un entero');
  process.exit(1);
}
const toml = `# Generado por tools/pruebas/generar-config-supabase.mjs desde infra/versiones.env. No editar.
project_id = "finn"

[db]
port = 54322
major_version = ${v.PG_MAYOR}

# Auth como en producción (04 §12.1): sin registro de usuarios nuevos, TOTP con inscripción y verificación
[auth]
enable_signup = false

[auth.mfa.totp]
enroll_enabled = true
verify_enabled = true
`;
mkdirSync(join(raiz, 'supabase'), { recursive: true });
writeFileSync(join(raiz, 'supabase', 'config.toml'), toml);
