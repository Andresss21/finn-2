// `cubiertoBp` de cada consumo en `detalleCategoria()` contra PostgreSQL (TA-497 A6, CH-223; 04 §6.3). Sobre la base de prueba de
// @finn/db crea su grupo y su categoría (ids 1400+), le asigna $30.50 en el período activo y registra con la tarjeta Visa (3):
// una compra de $5.00 devuelta entera (montoNeto $0.00), una de $10.00 que queda cubierta y una de $28.30 que se cubre con los
// $20.50 que quedan y deja $7.80 sin cubrir (reparto D2, 01 §4.5).
import { beforeAll, describe, expect, it } from 'vitest';
import { calcular } from '@finn/dominio';
import type { Hechos, Instante, Uuid } from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';
import { cargarHechos, leer, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import type { ClaimsSesion, SesionServidor } from '../src/autenticacion/autorizar.ts';
import { detalleCategoria } from '../src/consultas/detalle-categoria.ts';
import { confirmar, type DefinicionOperacion, type DepsMarco } from '../src/operaciones/marco.ts';
import { OP07 } from '../src/operaciones/categorias/index.ts';
import { OP33 } from '../src/operaciones/eventos/index.ts';
import { OP14 } from '../src/operaciones/presupuesto/index.ts';
import { OP20 } from '../src/operaciones/transacciones/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const VISA = uuid(3);
const GRUPO = uuid(1400),
  CATEGORIA = uuid(1401),
  DEVUELTA = uuid(1402),
  CUBIERTA = uuid(1403),
  PARCIAL = uuid(1404),
  DEVOLUCION = uuid(1405);
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const USUARIO = 'usuario-unico';
const sesion: SesionServidor = {
  obtenerClaims: () => Promise.resolve({ sub: USUARIO, aal: 'aal2' } as ClaimsSesion),
  obtenerUsuario: () => Promise.resolve({ id: USUARIO }),
};

describe('PRU-INT-PRES', () => {
  const base = crearBasePrueba();
  const deps = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => INSTANTE,
  });
  const hechos = (): Promise<Hechos> => leer((t) => cargarHechos(t), RELOJ);
  const ejecutar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    confirmar(def, entrada, deps());
  const gasto = (id: Uuid, fecha: string, total: string) =>
    ejecutar(OP20, {
      id,
      cuentaId: VISA,
      fecha,
      total,
      lineas: [{ monto: total, destino: { categoriaId: CATEGORIA } }],
    });

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-PRES-320 [Q-detalleCategoria] (CH-223) cada consumo trae cubiertoBp: $20.50 cubierto y $7.80 no cubierto da 7,244; uno cubierto entero, 10,000; uno con montoNeto de $0.00, 0', async () => {
    const A = calcular(await hechos(), FechaLocal.desdeTexto(HOY)).presupuesto.activo.inicio;
    expect(await ejecutar(OP07, { tipo: 'grupo', id: GRUPO, nombre: 'Cobertura' })).toMatchObject({
      ok: true,
    });
    expect(
      await ejecutar(OP07, { tipo: 'categoria', id: CATEGORIA, nombre: 'Cine', grupoId: GRUPO }),
    ).toMatchObject({ ok: true });
    expect(
      await ejecutar(OP14, {
        categoriaId: CATEGORIA,
        periodoInicio: A,
        montoNuevo: '30.50',
        esperado: { monto: '0' },
      }),
    ).toMatchObject({ ok: true });

    expect(await gasto(DEVUELTA, '2027-02-02', '5.00')).toMatchObject({ ok: true });
    const linea = (await hechos()).lineas.find((l) => l.transaccionId === DEVUELTA);
    expect(
      await ejecutar(OP33, {
        id: DEVOLUCION,
        transaccionOriginalId: DEVUELTA,
        fecha: '2027-02-02',
        total: '5.00',
        reparto: [{ lineaId: linea?.id, monto: '5.00' }],
      }),
    ).toMatchObject({ ok: true });
    expect(await gasto(CUBIERTA, '2027-02-03', '10.00')).toMatchObject({ ok: true });
    expect(await gasto(PARCIAL, '2027-02-04', '28.30')).toMatchObject({ ok: true });

    const dc = { memoria: new Memoria(), sesion, usuarioPermitido: USUARIO, opciones: () => RELOJ };
    const dto = await detalleCategoria(dc, { categoriaId: CATEGORIA });
    if (dto.clase !== 'normal') throw new Error('se esperaba una categoría normal');
    const de = (tx: Uuid) =>
      dto.consumos.find((x) => 'transaccionId' in x.origen && x.origen.transaccionId === tx);

    // 2.050 × 10.000 / 2.830 = 7.243,8…, mitad hacia arriba: 7.244.
    expect(de(PARCIAL)).toMatchObject({
      montoNeto: 2830,
      cubierto: 2050,
      noCubierto: 780,
      cubiertoBp: 7244,
    });
    expect(de(CUBIERTA)).toMatchObject({
      montoNeto: 1000,
      cubierto: 1000,
      noCubierto: 0,
      cubiertoBp: 10_000,
    });
    expect(de(DEVUELTA)).toMatchObject({ montoNeto: 0, cubiertoBp: 0 });
  });
});
