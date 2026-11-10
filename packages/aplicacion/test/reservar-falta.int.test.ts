// OP-16 con la variante `reservar_falta` contra PostgreSQL como `finn_app` (TA-491, CH-222; 04 OP-16, §6.14.4). Sobre la
// base de prueba de @finn/db: la tarjeta Visa (3) no debe nada sin respaldo; un gasto de $18.75 con ella en una
// categoría sobregirada (12) deja S(Visa) = $18.75, `formulario('asignar')` lo ofrece en su categoría de pago (13) y
// OP-16 lo reserva de punta a punta (previsualizar, confirmar, releer), con su `esperado`.
import { beforeAll, describe, expect, it } from 'vitest';
import { calcular } from '@finn/dominio';
import type { Hechos, Instante, Uuid } from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';
import { cargarHechos, leer, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import type { ClaimsSesion, SesionServidor } from '../src/autenticacion/autorizar.ts';
import { formulario } from '../src/consultas/formulario/index.ts';
import { confirmar, previsualizar, type DepsMarco } from '../src/operaciones/marco.ts';
import { OP16 } from '../src/operaciones/presupuesto/index.ts';
import { OP20 } from '../src/operaciones/transacciones/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const VISA = uuid(3),
  AHORRO = uuid(12), // sobregirada en el activo: el gasto con tarjeta no se cubre
  PAGO_VISA = uuid(13);
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
  const estado = async () => calcular(await hechos(), FechaLocal.desdeTexto(HOY));
  const faltaReservar = async () =>
    (await estado()).tarjetas.find((t) => t.tarjetaId === VISA)?.sinRespaldo;
  const asignado = async (inicio: FechaLocal) =>
    (await hechos()).asignaciones.find(
      (a) => a.categoriaId === PAGO_VISA && a.periodoInicio === inicio,
    )?.monto ?? 0;

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-PRES-310 [OP-16, FORM-asignar] OP-16 reservar_falta en PostgreSQL: con S(Visa) = $18.75 asigna $18.75 a su categoría de pago con el esperado visto; un esperado viejo es conflicto y, con S = 0, la variante ya no se ofrece', async () => {
    const A = (await estado()).presupuesto.activo.inicio;
    expect(await faltaReservar()).toBe(0);
    const gasto = {
      id: uuid(1300),
      cuentaId: VISA,
      fecha: '2027-02-04',
      total: '18.75',
      lineas: [{ monto: '18.75', destino: { categoriaId: AHORRO } }],
    };
    expect(await confirmar(OP20, gasto, deps())).toMatchObject({ ok: true });
    expect(await faltaReservar()).toBe(1875);

    // formulario('asignar') ofrece la variante solo en la categoría de pago (04 §6.14.4)
    const dc = { memoria: new Memoria(), sesion, usuarioPermitido: USUARIO, opciones: () => RELOJ };
    const enPago = await formulario(dc, { operacion: 'asignar', categoriaId: PAGO_VISA });
    expect(enPago.contexto).toMatchObject({ rapida: { reservarFalta: 1875 } });
    const enOtra = await formulario(dc, { operacion: 'asignar', categoriaId: AHORRO });
    expect(enOtra.contexto).not.toHaveProperty('rapida.reservarFalta');

    const entrada = {
      categoriaId: PAGO_VISA,
      periodoInicio: A,
      variante: 'reservar_falta',
      esperado: { monto: '0' },
    };
    expect(
      await confirmar(OP16, { ...entrada, esperado: { monto: '5.00' } }, deps()),
    ).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_desactualizado' },
    });
    const vista = await previsualizar(OP16, entrada, deps());
    expect(vista).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await confirmar(OP16, entrada, deps())).toMatchObject({ ok: true, yaAplicada: false });
    expect(await asignado(A)).toBe(1875);
    expect(await faltaReservar()).toBe(0);

    // con S = 0 la variante no se ofrece: con el esperado de ahora es VALIDACION y no escribe
    expect(
      await confirmar(OP16, { ...entrada, esperado: { monto: '18.75' } }, deps()),
    ).toMatchObject({ ok: false, error: { categoria: 'VALIDACION' } });
    expect(await asignado(A)).toBe(1875);
  });
});
