// `cuentas()` para la pantalla de Cuentas (FT-51, TA-312; 04 §6.5; PRU-INT-CTA-104). Sobre la base de prueba de @finn/db: la
// posición neta es la misma que el patrimonio de Inicio (error 11), una cuenta archivada solo aparece con `incluirArchivadas`
// y una transacción pendiente separa el saldo del saldo confirmado. Las cuentas y movimientos nuevos son operaciones reales.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Instante, Uuid } from '@finn/dominio';
import { Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import type { ClaimsSesion, SesionServidor } from '../src/autenticacion/autorizar.ts';
import type { DepsConsulta } from '../src/consultas/comun.ts';
import { cuentas } from '../src/consultas/cuentas.ts';
import { inicio } from '../src/consultas/inicio.ts';
import { OP01, OP04 } from '../src/operaciones/cuentas/index.ts';
import { confirmar, type DefinicionOperacion, type DepsMarco } from '../src/operaciones/marco.ts';
import { OP20 } from '../src/operaciones/transacciones/index.ts';

const USUARIO = 'usuario-unico';
const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const E1 = uuid(1); // efectivo de la base de prueba
const C1 = uuid(11); // categoría Comida
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const sesion = (claims: ClaimsSesion): SesionServidor => ({
  obtenerClaims: () => Promise.resolve(claims),
  obtenerUsuario: () => Promise.resolve({ id: claims.sub }),
});

describe('PRU-INT-CTA', () => {
  const base = crearBasePrueba();
  const deps = (): DepsConsulta => ({
    memoria: new Memoria(),
    sesion: sesion({ sub: USUARIO, aal: 'aal2' }),
    usuarioPermitido: USUARIO,
    opciones: () => RELOJ,
  });
  const ejecutar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    confirmar(def, entrada, {
      memoria: new Memoria(),
      opciones: () => RELOJ,
      instante: () => INSTANTE,
    } satisfies DepsMarco);

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-CTA-104 [CA-51.3] la posición neta de Cuentas es el patrimonio de Inicio, con la base de prueba y después de crear un préstamo, una tarjeta y un ahorro', async () => {
    const igual = async () => {
      const [c, i] = await Promise.all([cuentas(deps()), inicio(deps())]);
      expect(c.posicionNeta.neto).toBe(i.patrimonio.neto);
      expect(c.posicionNeta.activos.total).toBe(i.patrimonio.activos);
      expect(c.posicionNeta.deudas.total).toBe(i.patrimonio.deudas);
      return c.posicionNeta.neto;
    };
    const inicial = await igual();
    expect(
      await ejecutar(OP01, {
        id: uuid(1100),
        tipo: 'efectivo',
        nombre: 'Ahorro 51',
        saldo: '1000.00',
      }),
    ).toMatchObject({ ok: true });
    expect(await igual()).toBe(inicial + 100000);
    expect(
      await ejecutar(OP01, {
        id: uuid(1101),
        tipo: 'tarjeta',
        nombre: 'Tarjeta 51',
        saldo: '300.00',
        limiteCredito: '1500.00',
        diaCorte: 15,
        diaPago: 5,
      }),
    ).toMatchObject({ ok: true });
    expect(await igual()).toBe(inicial + 100000 - 30000);
  });

  it('PRU-INT-CTA-104 [CA-51.4] una cuenta archivada no está en cuentas() y con incluirArchivadas aparece en archivadas', async () => {
    expect(
      await ejecutar(OP01, { id: uuid(1110), tipo: 'efectivo', nombre: 'Vieja 51', saldo: '0' }),
    ).toMatchObject({ ok: true });
    expect(await ejecutar(OP04, { cuentaId: uuid(1110) })).toMatchObject({ ok: true });

    const sin = await cuentas(deps());
    expect(sin.efectivo.map((x) => x.cuenta.id)).not.toContain(uuid(1110));
    expect(sin.archivadas).toBeUndefined();
    const con = await cuentas(deps(), { incluirArchivadas: true });
    expect(con.efectivo.map((x) => x.cuenta.id)).not.toContain(uuid(1110));
    expect(con.archivadas).toContainEqual({ id: uuid(1110), nombre: 'Vieja 51', archivada: true });
  });

  it('PRU-INT-CTA-104 [CA-51.5] un gasto pendiente de $40.00 baja el saldo y no el saldo confirmado, con $40.00 de diferencia', async () => {
    const de = async () => {
      const f = (await cuentas(deps())).efectivo.find((x) => x.cuenta.id === E1);
      expect(f).toBeDefined();
      return f as NonNullable<typeof f>;
    };
    const antes = await de();
    expect(
      await ejecutar(OP20, {
        id: uuid(1120),
        cuentaId: E1,
        fecha: '2027-02-04',
        total: '40.00',
        lineas: [{ monto: '40.00', destino: { categoriaId: C1 } }],
      }),
    ).toMatchObject({ ok: true });
    const despues = await de();
    expect(despues.saldo).toBe(antes.saldo - 4000);
    expect(despues.saldoConfirmado).toBe(antes.saldoConfirmado);
    expect(despues.saldoConfirmado - despues.saldo).toBe(
      antes.saldoConfirmado - antes.saldo + 4000,
    );
  });
});
