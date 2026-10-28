// Asignaciones sobre una categoría archivada contra PostgreSQL (TA-116 corrección, CH-31; 01 inv. 20, H10;
// 03 §4.5.3 `g_asignacion` regla 3; 04 §4.5.2 F4). Los dos contraejemplos de PRU-INT-MOTOR-001 como casos fijos,
// sobre los hechos de prueba de @finn/db: OP-09 cubre el sobregiro de Préstamo con un `actualizar` de su Asig(c, A)
// existente en el mismo efecto que la archiva, y OP-14 desasigna en un período futuro de la ya archivada.
import { beforeAll, describe, expect, it } from 'vitest';
import { aplicar, calcular, verificarInvariantes } from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';
import type { ComandoDominio, Hechos, Uuid } from '@finn/dominio';
import { cargarHechos, escribir, leer } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const c = (n: number) => n as never; // Centavos de la prueba
// De los hechos de prueba: Préstamo (C2) tiene Asig(C2, A) = −2.000 (fila 31) y una cuota de 5.000
const C1 = uuid(11),
  C2 = uuid(12),
  ASIG_C2 = uuid(31);
const hoy = FechaLocal.desdeTexto(HOY);

describe('PRU-INT-CATEG', () => {
  const base = crearBasePrueba();
  let antes: Hechos;

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    antes = await leer((t) => cargarHechos(t), RELOJ);
  });

  it('PRU-INT-CATEG-103 [INV-20] OP-09 con sobregiro se escribe sin FN011 y deja Disp(c, A) = 0; OP-14 en un período futuro de una archivada lo rechaza el dominio', async () => {
    const A = calcular(antes, hoy).presupuesto.activo.inicio;
    const disp = (h: Hechos) =>
      calcular(h, hoy)
        .presupuesto.celdas.filter((x) => x.categoriaId === C2 && x.periodo.inicio === A)
        .reduce((s, x) => s + x.disponible, 0);
    expect(disp(antes)).toBeLessThan(0);

    // 1. OP-09: el sobregiro se cubre desde Comida con un `actualizar` de la fila existente (δ > 0)
    let n = 0;
    const op09 = {
      operacion: 'OP-09',
      ids: { siguiente: () => uuid(980 + ++n) },
      categoriaId: C2,
      cubrirSobregiroCon: { categoriaId: C1 },
    } as unknown as ComandoDominio;
    const r = aplicar(antes, op09, hoy);
    if (!r.ok) throw new Error(`rechazada: ${JSON.stringify(r.rechazos)}`);
    expect(r.cambios).toContainEqual(
      expect.objectContaining({ tipo: 'actualizar', tabla: 'asignaciones', id: ASIG_C2 }),
    );
    await escribir((tx) => tx.aplicarCambios(r.cambios), RELOJ);
    const despues = await leer((t) => cargarHechos(t), RELOJ);
    expect(despues.categorias.find((x) => x.id === C2)?.archivada).toBe(true);
    expect(disp(despues)).toBe(0);
    expect(verificarInvariantes(calcular(despues, hoy))).toEqual([]);

    // 2. OP-14: desasignar 1 en el período siguiente dejaría Asig(C2, futuro) = −1 (H10)
    const futuro = calcular(despues, hoy).presupuesto.periodos.find((p) => p.inicio > A)?.inicio;
    if (futuro === undefined) throw new Error('sin período futuro');
    const op14 = {
      operacion: 'OP-14',
      ids: { siguiente: () => uuid(990) },
      categoriaId: C2,
      periodoInicio: futuro,
      montoNuevo: c(-1),
    } as unknown as ComandoDominio;
    const r14 = aplicar(despues, op14, hoy);
    expect(r14.ok ? [] : r14.rechazos).toEqual([
      { codigo: 'categoria_archivada', datos: { categoriaId: C2 } },
    ]);
  });
});
