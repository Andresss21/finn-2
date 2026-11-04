// FT-27 Transacción olvidada y cambios retroactivos contra PostgreSQL como `finn_app` (TA-311; 04 §4.3, §6.1; BE-38;
// 01 §5.0.3). Una cuenta de efectivo abierta el 10 dic 2026 (período cerrado respecto de hoy, 5 feb 2027) recibe el
// gasto olvidado: sin la huella del impacto el servidor no escribe, con ella escribe y deja el resumen en `notificaciones`
// sin push, y lo asignado en un período cerrado se rechaza. Los ids nuevos son 1500+.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, leer, Memoria, notificacionesRecientes } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import {
  confirmar,
  previsualizar,
  type DefinicionOperacion,
  type DepsMarco,
} from '../src/operaciones/marco.ts';
import { OP01 } from '../src/operaciones/cuentas/index.ts';
import { OP14 } from '../src/operaciones/presupuesto/index.ts';
import { OP20 } from '../src/operaciones/transacciones/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const COMIDA = uuid(11);
const VIEJA = uuid(1500);
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;

describe('PRU-INT-TX', () => {
  const base = crearBasePrueba();
  const deps = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => INSTANTE,
  });
  const hechos = (): Promise<Hechos> => leer((t) => cargarHechos(t), RELOJ);
  const ejecutar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    confirmar(def, entrada, deps());
  const preparar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    previsualizar(def, entrada, deps());
  const retroactivas = async () =>
    (await leer((tx) => notificacionesRecientes(tx), RELOJ)).filter(
      (n) => n.motivo === 'cambio_retroactivo',
    );
  const olvidado = (id: number) => ({
    id: uuid(id),
    cuentaId: VIEJA,
    fecha: '2026-12-20',
    total: '20.00',
    lineas: [{ monto: '20.00', destino: { categoriaId: COMIDA } }],
  });

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    // La cuenta que abre en un período cerrado es ella misma una operación con AV-01: se confirma con la huella
    const entrada = {
      id: VIEJA,
      tipo: 'efectivo',
      nombre: 'Vieja',
      saldo: '100.00',
      fechaApertura: '2026-12-10',
    };
    const vista = await preparar(OP01, entrada);
    if (!vista.ok || vista.valor.huellaImpacto === null) throw new Error('previsualizar falló');
    const r = await ejecutar(OP01, { ...entrada, huellaImpacto: vista.valor.huellaImpacto });
    expect(r).toMatchObject({ ok: true });
  });

  it('PRU-INT-TX-430 [CA-27.5, AV-01] OP-20 con fecha en un período cerrado y sin huellaImpacto responde REQUIERE_CONFIRMACION con la previsualización y no cambia ningún hecho', async () => {
    const antes = await hechos();
    const r = await ejecutar(OP20, olvidado(1501));
    expect(r).toMatchObject({
      ok: false,
      error: {
        categoria: 'REQUIERE_CONFIRMACION',
        codigo: 'requiere_confirmacion',
        previsualizacion: {
          huellaImpacto: expect.any(String) as string,
          avisos: [expect.objectContaining({ codigo: 'AV-01' }) as unknown],
        },
      },
    });
    const despues = await hechos();
    expect(despues.transacciones).toEqual(antes.transacciones);
    expect(despues.lineas).toEqual(antes.lineas);
    expect(despues.efectos).toEqual(antes.efectos);
  });

  it('PRU-INT-TX-431 [CA-27.6, BE-38] al confirmar con la huella de la previsualización queda un cambio_retroactivo sin push y sin leer con el resumen de ese impacto (Δ LPA −$20.00), y repetirla no suma otro', async () => {
    const entrada = olvidado(1502);
    const vista = await preparar(OP20, entrada);
    if (!vista.ok || vista.valor.huellaImpacto === null) throw new Error('previsualizar falló');
    const previas = (await retroactivas()).length;

    const r = await ejecutar(OP20, { ...entrada, huellaImpacto: vista.valor.huellaImpacto });
    expect(r).toMatchObject({ ok: true, yaAplicada: false });
    expect((await hechos()).transacciones.some((t) => t.id === entrada.id)).toBe(true);

    const nuevas = await retroactivas();
    expect(nuevas).toHaveLength(previas + 1);
    expect(nuevas[0]).toMatchObject({
      aviso: 'AV-01',
      pushEnviadaEn: null,
      leidaEn: null,
      titulo: 'Cambiaste el pasado',
      cuerpo: 'Δ LPA −$20.00',
    });

    // repetirla con el mismo id es ya aplicada y no suma otro aviso
    expect(
      await ejecutar(OP20, { ...entrada, huellaImpacto: vista.valor.huellaImpacto }),
    ).toMatchObject({ ok: true, yaAplicada: true });
    expect(await retroactivas()).toHaveLength(previas + 1);
  });

  it('PRU-INT-TX-432 [CA-27.7] cambiar lo asignado en un período cerrado se rechaza con periodo_cerrado y no escribe', async () => {
    const antes = await hechos();
    const cerrado = '2026-12-21'; // el período anterior al de hoy (ciclo del 21)
    expect(
      await ejecutar(OP14, {
        categoriaId: COMIDA,
        periodoInicio: cerrado,
        montoNuevo: '5.00',
        esperado: { monto: '0' },
      }),
    ).toMatchObject({
      ok: false,
      error: {
        categoria: 'DOMINIO',
        codigo: 'periodo_cerrado',
        mensaje: 'No se puede cambiar lo asignado en un período cerrado.',
      },
    });
    expect((await hechos()).asignaciones).toEqual(antes.asignaciones);
  });
});
