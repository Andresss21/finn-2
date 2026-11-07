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

type ClienteAuthE2E = ReturnType<typeof clienteConFrasco>['cliente']['auth'];

/**
 * El factor del secreto de `codigoTotp` (CH-208). Con un respaldo (FT-02, FT-74) hay dos verificados, y `verificarFactor` sin
 * `factorId` reta al primero que lista Auth, sin orden fijo: el código del usuario iba al respaldo y fallaba. El del usuario es
 * el más antiguo: los respaldos siempre se agregan después.
 */
export async function factorPrincipal(auth: ClienteAuthE2E): Promise<string> {
  const { data, error } = await auth.mfa.listFactors();
  if (error !== null) throw new Error('no se pudieron listar los factores del usuario de prueba');
  const [primero] = data.all
    .filter((f) => f.factor_type === 'totp' && f.status === 'verified')
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (primero === undefined) throw new Error('el usuario de prueba no tiene factor verificado');
  return primero.id;
}

export async function entrarAal2(context: BrowserContext, baseURL: string): Promise<void> {
  const { cliente, frasco } = clienteConFrasco();
  const finn = variable('FINN_USUARIO_ID');
  const paso = await ingresar(cliente.auth, finn, {
    email: variable('E2E_EMAIL'),
    contrasena: variable('E2E_CLAVE'),
  });
  if (!paso.ok) throw new Error('el usuario de prueba no pudo ingresar');
  const factor = await verificarFactor(cliente.auth, finn, {
    factorId: await factorPrincipal(cliente.auth),
    codigo: codigoTotp(),
  });
  if (!factor.ok) throw new Error('el factor TOTP del usuario de prueba no se verificó');
  await context.clearCookies();
  await context.addCookies([...frasco].map(([name, value]) => ({ name, value, url: baseURL })));
}
