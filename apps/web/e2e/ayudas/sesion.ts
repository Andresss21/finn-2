// `entrarAal2` (05 §14.1): una sesión AAL2 del usuario de prueba en el contexto, sin pasar por /ingresar (que aún no tiene
// página, DT-23). Usa las funciones de 04 §12.2 con un frasco de cookies, como PRU-E2E-ACCESO-101, y pasa las cookies.
import { createServerClient } from '@supabase/ssr';
import type { BrowserContext } from '@playwright/test';
import {
  ingresar,
  verificarFactor,
} from '../../../../packages/aplicacion/src/autenticacion/supabase.ts';
import { codigoTotp } from './totp.ts';

export const variable = (n: string): string => {
  const v = process.env[n];
  if (!v) throw new Error(`falta ${n}: lo fija pnpm test:e2e`);
  return v;
};

/** Un cliente de Auth con su frasco de cookies, como el de la petición del servidor. */
export function clienteConFrasco() {
  const frasco = new Map<string, string>();
  const cliente = createServerClient(
    variable('NEXT_PUBLIC_SUPABASE_URL'),
    variable('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    {
      cookies: {
        getAll: () => [...frasco].map(([name, value]) => ({ name, value })),
        setAll(a) {
          for (const { name, value } of a)
            if (value === '') frasco.delete(name);
            else frasco.set(name, value);
        },
      },
    },
  );
  return { cliente, frasco };
}

export async function entrarAal2(context: BrowserContext, baseURL: string): Promise<void> {
  const { cliente, frasco } = clienteConFrasco();
  const finn = variable('FINN_USUARIO_ID');
  const paso = await ingresar(cliente.auth, finn, {
    email: variable('E2E_EMAIL'),
    contrasena: variable('E2E_CLAVE'),
  });
  if (!paso.ok) throw new Error('el usuario de prueba no pudo ingresar');
  const factor = await verificarFactor(cliente.auth, finn, { codigo: codigoTotp() });
  if (!factor.ok) throw new Error('el factor TOTP del usuario de prueba no se verificó');
  await context.clearCookies();
  await context.addCookies([...frasco].map(([name, value]) => ({ name, value, url: baseURL })));
}
