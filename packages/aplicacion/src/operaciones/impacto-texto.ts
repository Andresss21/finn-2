// AV-01 "después" (04 §3.0.5, BE-38): los nombres que necesita la interfaz para decir qué cambió y el resumen que Inicio
// muestra hasta que se marque como leído. Solo formatea los Δ que ya calculó el dominio; no calcula montos (ADR-07).
import type { Hechos, Impacto } from '@finn/dominio';
import type { Centavos } from '@finn/dominio/valores';
import { escribirTecnico as escribirTecnicoDb, type OpcionesTx } from '@finn/db';
import { formatearMonto } from '../errores/formato.ts';
import { registrarCambioRetroactivo } from '../push/registro.ts';
import type { EfectoPosterior, Exito } from './marco.ts';

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

const conSigno = (c: Centavos): string => `${c > 0 ? '+' : ''}${formatearMonto(c)}`;

/** `Δ LPA −$30.00, Δ Salidas −$20.00`: Listo para asignar primero y después cada Δ distinto de cero (01 §5.0.3). */
export function resumenDelImpacto(
  impacto: Impacto,
  nombres: Readonly<Record<string, string>>,
): string {
  const nombre = (id: string) => nombres[id] ?? '—';
  const tarjeta = (t: Impacto['deltaTarjetas'][number]) => [
    ...(t.deltaSaldo === 0
      ? []
      : [`Δ te falta reservar de ${nombre(t.tarjetaId)} ${conSigno(t.deltaSaldo)}`]),
    ...(t.deltaReserva === 0
      ? []
      : [`Δ reserva excedente de ${nombre(t.tarjetaId)} ${conSigno(t.deltaReserva)}`]),
  ];
  const reduccion = impacto.deltaReduccionProyectadaLpaAlCierre;
  return [
    `Δ LPA ${conSigno(impacto.deltaLpa)}`,
    ...impacto.deltaDisponible.map((x) => `Δ ${nombre(x.categoriaId)} ${conSigno(x.delta)}`),
    ...impacto.deltaTarjetas.flatMap(tarjeta),
    ...(reduccion === 0 ? [] : [`Δ reducción proyectada ${conSigno(reduccion)}`]),
  ].join(', ');
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
