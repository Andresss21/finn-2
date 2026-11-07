// [CH-220] Reinicio de producción "como primera vez" (tools/db/reinicio-primera-vez.sql, PRU-MAN-OPER-004). Siembra las
// 18 tablas [M] y las [H], [I] y [T] con datos del usuario, corre el script como el editor SQL de Supabase (administrador)
// y comprueba: toda tabla de `finn` queda vacía o recién sembrada (03 §9.2 y §9.3), salvo las que se conservan, que no
// cambian; el esquema y los privilegios quedan iguales y la concesión temporal de finn_migraciones no queda; la revisión
// obliga a recargar todo (03 §5.3), así que `inicio()` con la misma memoria responde como en el primer uso (CA-04.1) y
// el paso 1 de ESC-01 da sus números (CA-04.7).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Instante, Uuid } from '@finn/dominio';
import { Memoria } from '@finn/db';
import {
  fijarRespaldo,
  sembrarAjustesTecnicos,
  sembrarBandejaCompleta,
} from '../../db/test/ayudantes/ajustes-prueba.ts';
import { sembrarBandejaYNotificaciones } from '../../db/test/ayudantes/bandeja-prueba.ts';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { sembrarOrigenYCambios } from '../../db/test/ayudantes/origen-prueba.ts';
import { sembrarReglaDeComercio } from '../../db/test/ayudantes/reglas-prueba.ts';
import type { ClaimsSesion, SesionServidor } from '../src/autenticacion/autorizar.ts';
import type { DepsConsulta } from '../src/consultas/comun.ts';
import { inicio } from '../src/consultas/inicio.ts';
import { OP01 } from '../src/operaciones/cuentas/index.ts';
import { confirmar } from '../src/operaciones/marco.ts';

const SCRIPT = readFileSync(
  fileURLToPath(new URL('../../../tools/db/reinicio-primera-vez.sql', import.meta.url)),
  'utf8',
);
const USUARIO = 'usuario-unico';
const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const sesion = (claims: ClaimsSesion): SesionServidor => ({
  obtenerClaims: () => Promise.resolve(claims),
  obtenerUsuario: () => Promise.resolve({ id: claims.sub }),
});

// Lo que el reinicio conserva (CH-220): catálogos, sistema y respaldo. Todo lo demás de `finn` se vacía.
const CONSERVADAS = [
  '_prisma_migrations',
  'estado_respaldo',
  'eventos_sistema',
  'formatos_bancarios',
  'instituciones',
  'revision',
];
// Las dos que vuelven con la fila de la migración de datos iniciales (03 §9.2 y §9.3)
const SEMBRADAS: Record<string, string> = {
  vigencias_ciclo:
    'SELECT dia_inicio || $$|$$ || coalesce(rige_desde::text, $$$$) FROM finn.vigencias_ciclo',
  grupos:
    'SELECT nombre || $$|$$ || orden || $$|$$ || archivado || $$|$$ || clave_sistema FROM finn.grupos',
};
const CONTENIDO = (t: string): string =>
  `SELECT coalesce(md5(string_agg(x::text, ',' ORDER BY x::text)), 'vacia') FROM finn.${t} x`;
const ESQUEMA = `
  SELECT md5(string_agg(e, ',' ORDER BY e)) FROM (
    SELECT 'rel:' || c.relname || ':' || c.relkind::text || ':' || coalesce(c.relacl::text, '') || ':' || c.relowner::regrole
      FROM pg_class c WHERE c.relnamespace = 'finn'::regnamespace
    UNION ALL SELECT 'trg:' || t.tgrelid::regclass || ':' || t.tgname || ':' || t.tgenabled::text
      FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
      WHERE c.relnamespace = 'finn'::regnamespace AND NOT t.tgisinternal
    UNION ALL SELECT 'fn:' || p.oid::regprocedure || ':' || md5(pg_get_functiondef(p.oid))
      FROM pg_proc p WHERE p.pronamespace = 'finn'::regnamespace AND p.prokind = 'f'
    UNION ALL SELECT 'con:' || conrelid::regclass || ':' || conname || ':' || pg_get_constraintdef(oid)
      FROM pg_constraint WHERE connamespace = 'finn'::regnamespace
  ) s(e)`;

describe('PRU-INT-OPER', () => {
  const base = crearBasePrueba();
  const memoria = new Memoria(); // la de una instancia que ya cargó los hechos antes del reinicio
  const depsConsulta = (): DepsConsulta => ({
    memoria,
    sesion: sesion({ sub: USUARIO, aal: 'aal2' }),
    usuarioPermitido: USUARIO,
    opciones: () => RELOJ,
  });
  const uno = async (sql: string): Promise<string> =>
    (await consultar(base.urlAdmin, sql)).join('\n');
  const tablas = async (): Promise<string[]> =>
    consultar(
      base.urlAdmin,
      `SELECT relname FROM pg_class WHERE relnamespace = 'finn'::regnamespace AND relkind = 'r' ORDER BY 1`,
    );
  // `revision` se conserva pero avanza: se compara aparte
  const foto = async () => {
    const r: Record<string, string> = {};
    for (const t of CONSERVADAS.filter((x) => x !== 'revision')) r[t] = await uno(CONTENIDO(t));
    return r;
  };
  const MIEMBROS = `SELECT coalesce(string_agg(roleid::regrole || ':' || admin_option || inherit_option || set_option, ','), '')
    FROM pg_auth_members WHERE roleid = 'finn_migraciones'::regrole AND member = current_user::regrole`;

  it('PRU-INT-OPER-101 [CA-04.1, CA-04.7, ESC-01] el reinicio vacía los datos del usuario, conserva catálogos, sistema y respaldo, y la app vuelve al primer uso', async () => {
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    const sembradoInicial: Record<string, string> = {};
    for (const [t, q] of Object.entries(SEMBRADAS)) sembradoInicial[t] = await uno(q);

    // Datos del usuario en todas las clases: [M], [H] (bandeja, reglas, cambios posteriores), [I] (SMS) y [T]
    await escribirHechosDePrueba(base);
    await sembrarOrigenYCambios(base, uuid(104), uuid(15));
    await sembrarBandejaCompleta(base);
    await sembrarAjustesTecnicos(base);
    await sembrarBandejaYNotificaciones(base);
    await sembrarReglaDeComercio(base, 'super', uuid(11));
    await fijarRespaldo(base, '2 hours', '3 days');
    await uno(
      `INSERT INTO finn.eliminaciones (tabla, fila_id, revision) VALUES ('cuentas', '${uuid(9000)}', 1)`,
    );
    const antes = await inicio(depsConsulta());
    expect(antes.primerosPasos).not.toEqual({ cuenta: false, categorias: false, sms: false });

    const todas = await tablas();
    const vaciables = todas.filter((t) => !CONSERVADAS.includes(t));
    for (const t of vaciables)
      expect(Number(await uno(`SELECT count(*) FROM finn.${t}`)), t).toBeGreaterThan(0);
    const conservadas = await foto();
    const esquema = await uno(ESQUEMA);
    const miembros = await uno(MIEMBROS);
    const [revisionAntes] = (await uno('SELECT valor FROM finn.revision')).split('|');

    await consultar(base.urlAdmin, SCRIPT);
    await consultar(base.urlAdmin, SCRIPT); // se puede repetir: sobre una base ya reiniciada no cambia nada

    for (const t of vaciables)
      if (t in SEMBRADAS) expect(await uno(SEMBRADAS[t] ?? ''), t).toBe(sembradoInicial[t]);
      else expect(await uno(`SELECT count(*) FROM finn.${t}`), t).toBe('0');
    expect(await foto()).toEqual(conservadas);
    expect(await uno(ESQUEMA)).toBe(esquema);
    expect(await uno(MIEMBROS)).toBe(miembros); // la concesión temporal (CH-53) no queda
    const [valor = '', minima = ''] = (
      await uno('SELECT valor, revision_minima_incremental FROM finn.revision')
    ).split('|');
    expect(Number(valor)).toBeGreaterThan(Number(revisionAntes));
    expect(minima).toBe(valor); // 03 §5.3: una memoria anterior recarga todo

    const despues = await inicio(depsConsulta());
    expect(despues.primerosPasos).toEqual({ cuenta: false, categorias: false, sms: false });
    expect(despues.lpa).toBe(0);

    // ESC-01, paso 1 (CA-04.7): la base reiniciada acepta el primer hecho como una recién sembrada
    expect(
      await confirmar(
        OP01,
        { id: uuid(9001), tipo: 'efectivo', nombre: 'Ahorro', saldo: '1000.00' },
        { memoria, opciones: () => RELOJ, instante: () => INSTANTE },
      ),
    ).toMatchObject({ ok: true });
    const primera = await inicio(depsConsulta());
    expect(primera.lpa).toBe(100000);
    expect(primera.primerosPasos).toEqual({ cuenta: true, categorias: false, sms: false });
  });
});
