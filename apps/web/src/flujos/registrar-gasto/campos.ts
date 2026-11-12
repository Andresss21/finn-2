// Los campos de `/registrar/gasto` (FT-21), su contrato y la entrada de OP-20. Los valores del formulario son texto, como
// los escribe la persona (05 §4.2); el contrato completo (suma de las partes, cuenta, fecha…) lo aplica el servidor.
import * as z from 'zod';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import type { ValoresDeUrl } from '../../formularios/valores-de-url';
import { registrarGasto as t } from '../../textos/registrar-gasto';

/** Valor de `deudorId` que significa «otra persona»: la parte lleva `deudorNuevo` con el nombre escrito. */
export const DEUDOR_NUEVO = 'nuevo';
export const MAXIMO_PARTES = 20;

export type DestinoDeParte = 'categoria' | 'por_cobrar';

const PARTE = z.object({
  monto: z.string(),
  destino: z.enum(['categoria', 'por_cobrar']),
  categoriaId: z.string(),
  deudorId: z.string(),
  deudorNuevo: z.string(),
});
export type Parte = z.infer<typeof PARTE>;

const CAMPOS = z.object({
  cuentaId: z.string(),
  fecha: z.string(),
  total: z.string(),
  comercio: z.string(),
  nota: z.string(),
  lineas: z.array(PARTE),
});
export type Campos = z.infer<typeof CAMPOS>;

const montoValido = (texto: string): boolean => normalizarMontoEscrito(texto).estado === 'valido';

/**
 * El contrato de la pantalla: lo obligatorio escrito y que cada parte tenga destino (`linea_sin_destino`, inv. 8). Que las
 * partes sumen el total y los rechazos de negocio los dice el servidor (PF-3): el botón nunca se bloquea por la suma.
 */
export const contrato = CAMPOS.superRefine((c, ctx) => {
  if (c.cuentaId === '')
    ctx.addIssue({ code: 'custom', path: ['cuentaId'], message: t.elegirCuenta });
  if (c.fecha === '') ctx.addIssue({ code: 'custom', path: ['fecha'], message: t.completar });
  if (!montoValido(c.total))
    ctx.addIssue({ code: 'custom', path: ['total'], message: t.completar });
  if (c.lineas.length > MAXIMO_PARTES)
    ctx.addIssue({ code: 'custom', path: ['lineas'], message: t.maximoPartes });
  c.lineas.forEach((l, i) => {
    if (!montoValido(l.monto))
      ctx.addIssue({ code: 'custom', path: ['lineas', i, 'monto'], message: t.completar });
    if (l.destino === 'categoria' && l.categoriaId === '')
      ctx.addIssue({
        code: 'custom',
        path: ['lineas', i, 'categoriaId'],
        message: t.lineaSinDestino,
      });
    if (l.destino === 'por_cobrar' && l.deudorId === '')
      ctx.addIssue({ code: 'custom', path: ['lineas', i, 'deudorId'], message: t.lineaSinDestino });
    if (l.destino === 'por_cobrar' && l.deudorId === DEUDOR_NUEVO && l.deudorNuevo.trim() === '')
      ctx.addIssue({
        code: 'custom',
        path: ['lineas', i, 'deudorNuevo'],
        message: t.lineaSinDestino,
      });
  });
});

export const monto = (texto: string): string => {
  const r = normalizarMontoEscrito(texto);
  return r.estado === 'valido' ? r.texto : texto;
};

export const destinoDe = (l: Parte): Record<string, string> =>
  l.destino === 'categoria'
    ? { categoriaId: l.categoriaId }
    : l.deudorId === DEUDOR_NUEVO
      ? { deudorNuevo: l.deudorNuevo.trim() }
      : { deudorId: l.deudorId };

/** `useOperacion` entrega los campos más `modo`, `id` y la confirmación: la entrada de OP-20 sale de ellos. */
export function aEntradaDeAccion(payload: unknown): Record<string, unknown> {
  const { modo, id, revisionVista, huellaImpacto, ...escrito } = payload as Record<string, unknown>;
  const c = escrito as Campos;
  return {
    cuentaId: c.cuentaId,
    fecha: c.fecha,
    total: monto(c.total),
    ...(c.comercio.trim() === '' ? {} : { comercio: c.comercio.trim() }),
    ...(c.nota.trim() === '' ? {} : { nota: c.nota.trim() }),
    lineas: c.lineas.map((l) => ({ monto: monto(l.monto), destino: destinoDe(l) })),
    modo,
    id,
    ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
  };
}

export const parteVacia = (): Parte => ({
  monto: '',
  destino: 'categoria',
  categoriaId: '',
  deudorId: '',
  deudorNuevo: '',
});

/** Los valores con que abre el formulario: la fecha es el `hoy` del servidor, nunca la del dispositivo (05 §5.5). */
export const valoresIniciales = (
  hoy: string,
  cuentaPropuesta: string | undefined,
  inicial: ValoresDeUrl = {},
): Campos => ({
  cuentaId: cuentaPropuesta ?? '',
  fecha: inicial.fecha ?? hoy,
  total: inicial.total ?? '',
  comercio: inicial.comercio ?? '',
  nota: '',
  // El ajuste es un gasto de una sola parte: el monto de la parte es el de la propuesta, copiado tal cual (PF-3)
  lineas: [{ ...parteVacia(), monto: inicial.total ?? '' }],
});

/** Los nombres de deudor que ya existían y que la persona volvió a escribir como «otra persona» (04 §3.0.2). */
export function deudoresReutilizados(
  c: Campos,
  existentes: readonly { readonly id: string; readonly nombre: string }[],
): readonly string[] {
  const nombres = c.lineas
    .filter((l) => l.destino === 'por_cobrar' && l.deudorId === DEUDOR_NUEVO)
    .map((l) => l.deudorNuevo.trim().toLowerCase());
  return existentes.filter((d) => nombres.includes(d.nombre.toLowerCase())).map((d) => d.nombre);
}

/**
 * El destino de una línea compacta (K4) es una sola selección: `c:<categoría>` o `d:<persona>` (`d:nuevo` = otra persona). Esto
 * traduce entre ese valor y los tres campos de la parte, que son los que viajan al servidor y al borrador.
 */
export const valorDeDestino = (l: Parte): string => {
  const id = l.destino === 'categoria' ? l.categoriaId : l.deudorId;
  return id === '' ? '' : `${l.destino === 'categoria' ? 'c' : 'd'}:${id}`;
};

export const destinoDeValor = (
  valor: string,
): Pick<Parte, 'destino' | 'categoriaId' | 'deudorId'> =>
  valor.startsWith('d:')
    ? { destino: 'por_cobrar', categoriaId: '', deudorId: valor.slice(2) }
    : { destino: 'categoria', categoriaId: valor.slice(2), deudorId: '' };

/** Los avisos «antes» de la previsualización con su texto (04 §7.5): un código sin texto se muestra tal cual. */
const AVISOS: Readonly<Record<string, string>> = {
  'AV-01': t.avisoPeriodoCerrado,
  'AV-07': t.avisoDeudaTarjeta,
};
export const textoDeAviso = (codigo: string): string => AVISOS[codigo] ?? codigo;

/**
 * [CH-240 E3-18, E6-21] El motivo escrito de «Guardar» deshabilitado, en el orden en que importa: sin conexión; una fecha que no
 * vale (el campo ya dice cuál); las partes que el servidor rechazó con `suma_lineas_distinta`, con su mensaje, mientras no cambien.
 */
export function motivoDeGuardar(e: {
  readonly sinConexion: string | undefined;
  readonly fechaConError: boolean;
  readonly sumaRechazada: string | undefined;
  readonly textoFecha: string;
}): string | undefined {
  return e.sinConexion ?? (e.fechaConError ? e.textoFecha : e.sumaRechazada);
}
