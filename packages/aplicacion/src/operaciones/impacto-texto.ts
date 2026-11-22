// AV-01 "después" (04 §3.0.5, BE-38): los nombres que necesita la interfaz para decir qué cambió y el resumen que Inicio
// muestra hasta que se marque como leído. [CH-299] El texto del resumen es `resumen-impacto.ts`.
import type { Hechos, Impacto } from '@finn/dominio';
import { escribirTecnico as escribirTecnicoDb, type OpcionesTx } from '@finn/db';
import { registrarCambioRetroactivo } from '../push/registro.ts';
import type { EfectoPosterior, Exito } from './marco.ts';
import { resumenDelImpacto } from './resumen-impacto.ts';

type EscribirTecnico = typeof escribirTecnicoDb;

/** id → nombre de lo que nombra el impacto (categorías, incluidas las de pago, y tarjetas). */
export function nombresDelImpacto(
  impacto: Impacto,
  hechos: Hechos,
): Readonly<Record<string, string>> {
  const nombres: Record<string, string> = {};
  for (const x of impacto.deltaDisponible) {
    const c = hechos.categorias.find((k) => k.id === x.categoriaId);
    // La categoría de pago de una tarjeta se llama como ella; en el impacto se dice "Pago T" (01 §8, ESC-32)
    if (c !== undefined) nombres[c.id] = c.clase === 'pago' ? `Pago ${c.nombre}` : c.nombre;
  }
  for (const x of impacto.deltaTarjetas) {
    const c = hechos.cuentas.find((k) => k.id === x.tarjetaId);
    if (c !== undefined) nombres[c.id] = c.nombre;
  }
  return nombres;
}

/** BE-38: tras el COMMIT, una operación que produjo AV-01 deja su resumen en `notificaciones`, sin push. */
export function efectoCambioRetroactivo(
  r: Exito,
  escribir: EscribirTecnico | undefined,
  opciones: OpcionesTx,
): readonly EfectoPosterior[] {
  if (!r.avisos.some((a) => a.codigo === 'AV-01')) return [];
  const cuerpo = resumenDelImpacto(r.impacto, nombresDelImpacto(r.impacto, r.hechosNuevos));
  return [
    {
      nombre: 'AV-01',
      ejecutar: () =>
        (escribir ?? escribirTecnicoDb)(async (tx) => {
          await registrarCambioRetroactivo(tx, { titulo: 'Cambiaste el pasado', cuerpo });
        }, opciones),
    },
  ];
}
