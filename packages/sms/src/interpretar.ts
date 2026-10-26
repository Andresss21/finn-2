// Intérprete de SMS (04 §8.3, 03 §7.6): puro, sin E/S, sin reloj. Un formato coincide si su patrón
// encuentra coincidencia y todos los normalizadores de los grupos presentes tienen éxito.
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import {
  normalizarComercio,
  normalizarFecha,
  normalizarMonto,
  normalizarUltimos4,
  type FormatoFecha,
} from './normalizadores';

export type Uuid = string;

export interface FormatoSms {
  id: Uuid;
  institucionId: Uuid;
  nombre: string;
  tipoMovimiento: 'compra' | 'deposito' | 'pago_tarjeta' | 'devolucion';
  patron: string;
  banderas: string; // 03 §3.21, §7.6
  montoSeparadorMiles: ',' | '.' | '';
  montoSeparadorDecimal: '.' | ',';
  formatosFecha: readonly FormatoFecha[];
  activo: boolean;
}

export interface CamposSms {
  ultimos4: string;
  monto: Centavos;
  comercio: string | null;
  fecha: FechaLocal | null;
}

export type Interpretacion =
  | { resultado: 'reconocido'; formato: FormatoSms; campos: CamposSms; coincidentes: Uuid[] }
  | {
      resultado: 'no_reconocido';
      coincidentes: Uuid[];
      motivo: 'ninguno' | 'varios' | 'demasiado_largo';
    };

export interface ResultadoDePrueba {
  coincide: boolean;
  grupos?: Record<string, string>;
  campos?: CamposSms;
  fallo?: 'patron' | 'ultimos4' | 'monto' | 'fecha';
}

/** PR-2 (03 §7.6, 04 §8.3): sobre este largo no se evalúa ningún patrón. */
export const LARGO_MAXIMO_INTERPRETABLE = 640;

// Se cuentan caracteres (como la CHECK de 03 §3.17), no unidades UTF-16.
const esDemasiadoLargo = (texto: string): boolean =>
  texto.length > LARGO_MAXIMO_INTERPRETABLE &&
  Array.from(texto).length > LARGO_MAXIMO_INTERPRETABLE;

/** Prueba un formato contra un texto y dice qué paso lo rechazó. Un patrón que no compila no coincide. */
export function probar(formato: FormatoSms, texto: string): ResultadoDePrueba {
  let m: RegExpExecArray | null;
  try {
    m = new RegExp(formato.patron, formato.banderas).exec(texto);
  } catch {
    return { coincide: false, fallo: 'patron' };
  }
  if (m?.groups === undefined) return { coincide: false, fallo: 'patron' };
  const grupos: Record<string, string> = {};
  for (const [nombre, valor] of Object.entries<string | undefined>(m.groups))
    if (valor !== undefined) grupos[nombre] = valor;

  const ultimos4 = normalizarUltimos4(grupos['ultimos4'] ?? '');
  if (ultimos4 === null) return { coincide: false, grupos, fallo: 'ultimos4' };
  const monto = normalizarMonto(
    grupos['monto'] ?? '',
    formato.montoSeparadorMiles,
    formato.montoSeparadorDecimal,
  );
  if (monto === null) return { coincide: false, grupos, fallo: 'monto' };
  let fecha: FechaLocal | null = null;
  if (grupos['fecha'] !== undefined) {
    fecha = normalizarFecha(grupos['fecha'], formato.formatosFecha);
    if (fecha === null) return { coincide: false, grupos, fallo: 'fecha' };
  }
  const comercio = normalizarComercio(grupos['comercio']);
  return { coincide: true, grupos, campos: { ultimos4, monto, comercio, fecha } };
}

export function interpretar(texto: string, formatos: readonly FormatoSms[]): Interpretacion {
  if (esDemasiadoLargo(texto))
    return { resultado: 'no_reconocido', coincidentes: [], motivo: 'demasiado_largo' };

  const coinciden = formatos
    .filter((f) => f.activo)
    .flatMap((formato) => {
      const r = probar(formato, texto);
      return r.coincide && r.campos !== undefined ? [{ formato, campos: r.campos }] : [];
    });
  const coincidentes = coinciden.map((c) => c.formato.id);
  const [unico] = coinciden;
  if (coinciden.length === 1 && unico !== undefined)
    return { resultado: 'reconocido', formato: unico.formato, campos: unico.campos, coincidentes };
  return {
    resultado: 'no_reconocido',
    coincidentes,
    motivo: coinciden.length === 0 ? 'ninguno' : 'varios',
  };
}
