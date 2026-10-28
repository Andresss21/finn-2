// PRU-DOM-VAL-154 (04 §14.2, BE-08): las variables de la aplicación se validan con Zod al arrancar; si falta una
// o tiene un formato inválido, la aplicación no arranca y el mensaje nombra la variable sin mostrar su valor.
import { describe, expect, it } from 'vitest';
import { leerConfiguracion } from './index.ts';

// Valores de prueba inventados (ninguno es una credencial real)
const CLAVE = 'A'.repeat(43) + '=';
const BASE: Record<string, string> = {
  DATABASE_URL:
    'postgresql://finn_app.ref:clave@pooler.invalido:6543/postgres?sslmode=require&pgbouncer=true',
  NEXT_PUBLIC_SUPABASE_URL: 'https://ref.supabase.invalido',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_prueba',
  FINN_USUARIO_ID: '0b6f1c2e-3d4a-4b5c-8d6e-7f8091a2b3c4',
  CRON_SECRET: 'c'.repeat(32),
  RESPALDO_SECRET: 'r'.repeat(40),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'vapid-publica',
  VAPID_PRIVATE_KEY: 'vapid-privada-secreta',
  VAPID_SUBJECT: 'mailto:finn@ejemplo.invalido',
  FINN_CONCILIACION_CLAVES: `k2:${CLAVE},k1:${'B'.repeat(43)}=`,
  FINN_CONCILIACION_CLAVE_ACTIVA: 'k2',
};
const sin = (v: string): Record<string, string> =>
  Object.fromEntries(Object.entries(BASE).filter(([k]) => k !== v));
const fallo = (env: Record<string, string>): string => {
  try {
    leerConfiguracion(env);
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error('leerConfiguracion no falló');
};

describe('PRU-DOM-VAL', () => {
  it('PRU-DOM-VAL-154 APP-config, BE-08: la configuración de 04 §14.2 se valida con Zod; una variable que falta o es inválida impide arrancar y se nombra sin su valor', () => {
    const c = leerConfiguracion(BASE);
    expect(c.FINN_CARGA_INCREMENTAL).toBe('off');
    expect(c.FINN_WEBHOOK_FORMATO).toBe('json');
    expect(c.conciliacion).toEqual({
      activa: 'k2',
      claves: { k2: CLAVE, k1: `${'B'.repeat(43)}=` },
    });
    expect(
      leerConfiguracion({ ...BASE, FINN_CARGA_INCREMENTAL: 'on', FINN_WEBHOOK_FORMATO: 'texto' }),
    ).toMatchObject({
      FINN_CARGA_INCREMENTAL: 'on',
      FINN_WEBHOOK_FORMATO: 'texto',
    });

    for (const v of Object.keys(BASE)) expect(fallo(sin(v)), v).toContain(v);
    const invalidas: Record<string, string> = {
      DATABASE_URL: 'mysql://x',
      NEXT_PUBLIC_SUPABASE_URL: 'no es url',
      FINN_USUARIO_ID: 'no-uuid-7',
      CRON_SECRET: 'corta',
      RESPALDO_SECRET: 'x'.repeat(31),
      VAPID_SUBJECT: 'finn@ejemplo',
      FINN_CONCILIACION_CLAVES: 'k2:corta',
      FINN_CONCILIACION_CLAVE_ACTIVA: 'k3',
      FINN_CARGA_INCREMENTAL: 'activado',
      FINN_WEBHOOK_FORMATO: 'xml',
    };
    for (const [v, valor] of Object.entries(invalidas)) {
      const m = fallo({ ...BASE, [v]: valor });
      expect(m, v).toContain(v);
      expect(m, v).toContain('04 §14.2');
      expect(m, v).not.toContain(valor);
    }
    // Una variable vacía cuenta como faltante, y ningún secreto aparece en el mensaje
    const m = fallo({ ...BASE, CRON_SECRET: '', RESPALDO_SECRET: '' });
    expect(m).toContain('CRON_SECRET');
    expect(m).toContain('RESPALDO_SECRET');
    expect(m).not.toContain(BASE['VAPID_PRIVATE_KEY']);
    expect(m).not.toContain(CLAVE);
  });
});
