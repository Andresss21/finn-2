// Primer uso guiado (FT-04, TA-285; 06 §3.9 y §3.15; 04 §6.1; PRU-INT-INICIO). Sobre una base recién clonada de la plantilla, sin
// los hechos de prueba: los pasos de ESC-01 hechos con OP-01 (lo que envía `/cuentas/nueva`) dejan en `inicio()` los números del
// CA-04.7, y la primera tanda de la plantilla, reenviada con sus ids, responde `ya_aplicada` sin duplicar nada (CA-04.4).
import { describe, expect, it } from 'vitest';
import type { Instante, Uuid } from '@finn/dominio';
import { Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import type { ClaimsSesion, SesionServidor } from '../src/autenticacion/autorizar.ts';
import type { DepsConsulta } from '../src/consultas/comun.ts';
import { estructura } from '../src/consultas/estructura.ts';
import { inicio } from '../src/consultas/inicio.ts';
import { crearEnLote } from '../src/operaciones/categorias/index.ts';
import { OP01 } from '../src/operaciones/cuentas/index.ts';
import { confirmar, type DepsMarco } from '../src/operaciones/marco.ts';

const USUARIO = 'usuario-unico';
const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const sesion = (claims: ClaimsSesion): SesionServidor => ({
  obtenerClaims: () => Promise.resolve(claims),
  obtenerUsuario: () => Promise.resolve({ id: claims.sub }),
});

describe('PRU-INT-INICIO', () => {
  const base = crearBasePrueba();
  const depsConsulta = (): DepsConsulta => ({
    memoria: new Memoria(),
    sesion: sesion({ sub: USUARIO, aal: 'aal2' }),
    usuarioPermitido: USUARIO,
    opciones: () => RELOJ,
  });
  const depsMarco = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => INSTANTE,
  });

  it('PRU-INT-INICIO-101 [CA-04.7] con los pasos 1 y 2 de ESC-01, Listo para asignar es $1,000.00 y "te falta reservar" de T es $300.00; los pasos de cuenta, categorías y SMS se marcan por el hecho', async () => {
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    const antes = await inicio(depsConsulta());
    expect(antes.primerosPasos).toEqual({ cuenta: false, categorias: false, sms: false });
    expect(antes.lpa).toBe(0);

    expect(
      await confirmar(
        OP01,
        { id: uuid(1), tipo: 'efectivo', nombre: 'Ahorro', saldo: '1000.00' },
        depsMarco(),
      ),
    ).toMatchObject({ ok: true });
    expect(
      await confirmar(
        OP01,
        {
          id: uuid(2),
          tipo: 'tarjeta',
          nombre: 'T',
          saldo: '300.00',
          limiteCredito: '1500.00',
          diaCorte: 15,
          diaPago: 5,
        },
        depsMarco(),
      ),
    ).toMatchObject({ ok: true });

    const despues = await inicio(depsConsulta());
    expect(despues.lpa).toBe(100000);
    expect(despues.atencion.faltaReservar).toEqual([
      { tarjeta: expect.objectContaining({ id: uuid(2), nombre: 'T' }) as unknown, monto: 30000 },
    ]);
    expect(despues.primerosPasos).toEqual({ cuenta: true, categorias: false, sms: false });
  });

  it('PRU-INT-INICIO-102 [CA-04.4] reenviar la primera tanda con los mismos ids responde ya_aplicada en sus 12 elementos y no duplica nada', async () => {
    process.env['DATABASE_URL'] = base.url;
    const grupo = (n: number, nombre: string) => ({ tipo: 'grupo' as const, id: uuid(n), nombre });
    const categoria = (n: number, nombre: string, g: number) => ({
      tipo: 'categoria' as const,
      id: uuid(n),
      nombre,
      grupoId: uuid(g),
    });
    const primera = {
      elementos: [
        grupo(100, 'Vivienda'),
        categoria(101, 'Alquiler o cuota de vivienda', 100),
        categoria(102, 'Energía eléctrica', 100),
        categoria(103, 'Agua', 100),
        categoria(104, 'Internet y teléfono', 100),
        categoria(105, 'Gas', 100),
        categoria(106, 'Mantenimiento del hogar', 100),
        grupo(110, 'Vida diaria'),
        categoria(111, 'Supermercado', 110),
        categoria(112, 'Mercado y tienda', 110),
        categoria(113, 'Farmacia', 110),
        categoria(114, 'Cuidado personal', 110),
      ],
    };
    const r = await crearEnLote(primera, depsMarco());
    if (!r.ok) throw new Error(JSON.stringify(r.error));
    expect(r.valor.elementos.map((e) => e.resultado)).toEqual(Array(12).fill('creado'));

    const otra = await crearEnLote(primera, depsMarco());
    if (!otra.ok) throw new Error(JSON.stringify(otra.error));
    expect(otra.valor.elementos).toHaveLength(12);
    expect(otra.valor.elementos.every((e) => e.resultado === 'ya_aplicada')).toBe(true);

    const { grupos } = await estructura(depsConsulta());
    const normales = grupos.flatMap((g) => g.categorias.filter((c) => c.clase === 'normal'));
    expect(normales).toHaveLength(10);
    expect(grupos.filter((g) => ['Vivienda', 'Vida diaria'].includes(g.grupo.nombre))).toHaveLength(
      2,
    );
    expect((await inicio(depsConsulta())).primerosPasos?.categorias).toBe(true);
  });
});
