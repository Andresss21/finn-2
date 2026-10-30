// Catálogo de mensajes de los rechazos del dominio (04 §3.0.6, §7.5, §7.10; BE-34; CF-15). Voseo salvadoreño, montos
// `$1,234.50` (U+2212 si son negativos), fechas `dd/mm/aaaa`. Plantillas: `{dato}` se copia tal cual (una fecha
// `AAAA-MM-DD` sale `dd/mm/aaaa`) y `{dato:$}` formatea los centavos como monto.
import type { Rechazo } from '@finn/dominio';
import { formatearFecha, formatearMonto } from './formato.ts';
import type { Centavos } from '@finn/dominio/valores';

type Datos = NonNullable<Rechazo['datos']>;

const SIN_ARCHIVAR = 'Elegí una categoría activa.';

/** Código → plantilla. Una función elige entre dos textos según los datos (`nombre_repetido`, R2). */
export const MENSAJES_RECHAZO: Readonly<Record<string, string | ((d: Datos) => string)>> = {
  // Comunes
  fecha_posterior_a_hoy: 'La fecha no puede ser posterior a hoy ({hoy}).',
  fecha_anterior_a_apertura:
    '{cuenta} se abrió el {apertura}; la fecha no puede ser anterior. Podés cambiar la fecha de apertura.',
  cuenta_archivada: '{cuenta} está archivada. Desarchivala para registrar o cambiar movimientos.',
  cuenta_tipo_no_valido: 'Esta operación no se puede hacer con una cuenta de tipo {tipo}.',
  cuentas_iguales: 'Elegí dos cuentas distintas.',
  categoria_archivada: `{categoria} está archivada. ${SIN_ARCHIVAR}`,
  categoria_de_pago_no_permitida: 'Las categorías de pago de tarjeta no se pueden usar aquí.',
  suma_lineas_distinta: 'Las partes suman {suma:$} y el total es {total:$}.',
  linea_sin_destino: 'Cada parte necesita una categoría o un por cobrar.',
  // Cuentas
  ultimos4_repetidos: 'Ya tenés una cuenta de {institucion} terminada en {ultimos4}.',
  apertura_posterior_a_movimientos:
    'Hay movimientos desde el {fecha}; la apertura no puede ser posterior.',
  cuenta_con_saldo: 'Para archivar {cuenta}, su saldo debe ser $0.00 (hoy es {saldo:$}).',
  tarjeta_con_deuda: '{cuenta} todavía tiene una deuda de {deuda:$}.',
  reserva_tarjeta_no_cero:
    'La categoría de pago de {cuenta} tiene {disponible:$}; movelo antes de archivar.',
  cuenta_con_movimientos: '{cuenta} tiene movimientos. Podés archivarla en lugar de eliminarla.',
  cuenta_con_programadas:
    '{cuenta} se usa en {n} transacciones programadas. Cambialas o eliminalas primero.',
  cuenta_ya_archivada: '{cuenta} ya está archivada.',
  cuenta_no_archivada: '{cuenta} no está archivada.',
  // Categorías y grupos
  nombre_repetido: (d) =>
    d['deudorId'] !== undefined
      ? 'Ya existe un deudor llamado {nombre}.' // OP-52 (R2)
      : d['tarjeta'] !== undefined
        ? 'El nombre {nombre} lo usa la tarjeta archivada {tarjeta}. Elegí otro o desarchivala.'
        : d['grupo'] === undefined
          ? 'Ya existe un grupo llamado {nombre}.' // un grupo repetido no trae {grupo} [CH-40]
          : 'Ya existe {nombre} en {grupo}.',
  grupo_archivado: '{grupo} está archivado.',
  grupo_del_sistema: 'El grupo Pagos de tarjeta lo administra Finn.',
  categoria_ya_archivada: '{categoria} ya está archivada.',
  categoria_no_archivada: '{categoria} no está archivada.',
  categoria_de_pago_con_tarjeta: 'Esta categoría se archiva o elimina junto con su tarjeta.',
  programada_sin_decision: 'Decidí qué hacer con {n} transacciones programadas de {categoria}.',
  destino_igual_origen: 'Elegí otra categoría.',
  monto_mayor_que_disponible: '{categoria} tiene {disponible:$}.',
  fusion_misma_categoria: 'Elegí dos categorías distintas.',
  fusion_categoria_de_pago: 'Las categorías de pago de tarjeta no se fusionan.',
  fusion_destino_archivado: 'La categoría destino debe estar activa.',
  categoria_con_historial: '{categoria} tiene historial. Podés archivarla o fusionarla.',
  grupo_no_vacio: '{grupo} tiene categorías.',
  grupo_con_categorias_activas: 'Archivá primero todas las categorías de {grupo}.',
  // Presupuesto, metas y ciclo
  periodo_no_valido: 'Ese período no existe.',
  periodo_cerrado: 'No se puede cambiar lo asignado en un período cerrado.',
  lpa_negativo_en_futuro:
    'Para asignar en un período futuro necesitás dinero listo para asignar; te faltan {faltante:$}.',
  meta_ya_existe: '{categoria} ya tiene una meta.',
  meta_en_categoria_de_pago: 'Las categorías de pago de tarjeta no tienen metas.',
  fecha_objetivo_pasada: 'La fecha objetivo no puede ser anterior a hoy.',
  ciclo_sin_cambio: 'El ciclo ya empieza el día {dia}.',
  // Transacciones y eventos
  desglose_no_cuadra: 'Capital, interés y seguro suman {suma:$}; el pago es de {total:$}.',
  capital_mayor_que_pendiente:
    'El capital ({capital:$}) supera lo que debés del préstamo ({pendiente:$}).',
  retiro_mayor_que_valor: 'La inversión vale {valor:$}.',
  valor_inversion_negativo: 'El valor de la inversión no puede quedar negativo.',
  cambio_cuenta_con_devoluciones: 'Esta compra tiene devoluciones; no se puede cambiar su cuenta.',
  cambio_tipo_de_cuenta_incompatible: 'Esta transacción no puede pasar a {cuenta}.',
  linea_menor_que_eventos: 'Esa parte ya tiene {resuelto:$} cobrado, condonado o devuelto.',
  linea_con_eventos_cambio_destino:
    'Esa parte tiene cobros o devoluciones; no puede cambiar de destino.',
  fecha_posterior_a_eventos:
    'Hay cobros o devoluciones del {fecha}; la compra no puede ser posterior.',
  transaccion_con_eventos:
    'Esta compra tiene cobros, condonaciones o devoluciones. Eliminalos primero.',
  transicion_estado_bancario_invalida: 'Ese cambio de estado no está permitido.',
  linea_no_es_por_cobrar: 'Esa parte no es un por cobrar.',
  sin_saldo_abierto: 'Ese por cobrar no tiene saldo pendiente al {fecha}.',
  condonacion_mayor_que_abierto: 'Solo quedan {abierto:$} por cobrar.',
  devolucion_mayor_que_linea: 'En esa parte quedan {capacidad:$} por devolver.',
  devolucion_mayor_que_total: 'Las devoluciones superarían el total de la compra ({total:$}).',
  reparto_devolucion_distinto: 'El reparto suma {suma:$} y la devolución es de {total:$}.',
  devolucion_de_no_gasto: 'Solo las compras admiten devoluciones vinculadas.',
  evento_anterior_a_original: 'El evento no puede ser anterior a la compra ({fecha}).',
  eliminar_evento_rompe_limites: 'No se puede eliminar: otros eventos dependen de este.',
  // Revisión, programadas y conciliación
  arrastre_no_permitido:
    'Este movimiento no se puede aprobar arrastrándolo. Abrilo para revisarlo.',
  movimiento_estado_no_valido: 'Este movimiento ya está {estado}.',
  movimiento_sin_cuenta: 'Elegí la cuenta de este movimiento.',
  movimiento_incompleto: 'Completá {campos} antes de aprobar.',
  ocurrencia_ya_resuelta: 'Ese pago programado ya está registrado.',
  ocurrencia_no_valida: 'Esa fecha no corresponde a la programada.',
  sms_no_reprocesable: 'Este SMS no tiene un error que reprocesar.',
  patron_repetido: 'Ya hay una regla para {patron}.',
  calendario_con_historial:
    'Esta programada ya tiene pagos registrados. Terminala y creá otra con el calendario nuevo.',
  programada_con_historial: 'Esta programada tiene historial. Podés desactivarla.',
  registro_automatico_sin_modelo:
    'Para registrar sola una cuota, el préstamo necesita un modelo de cálculo.',
  formato_no_reconocido:
    'No reconocimos el formato. Descargá el estado de cuenta en CSV desde el portal del banco.',
  formato_ambiguo:
    'El archivo coincide con más de un formato y no sabemos de qué banco es. Revisá que sea el estado de cuenta correcto.',
  archivo_pdf: 'Finn lee el estado de cuenta en CSV, no en PDF.',
  firma_no_valida: 'El estado de cuenta cambió o no es válido. Volvé a subirlo.',
  firma_vencida: 'Pasaron más de 24 horas. Volvé a subir el estado de cuenta.',
  coincidencia_no_valida: 'Ese movimiento no coincide con la transacción elegida.',
  transaccion_ya_conciliada: 'Esa transacción ya está conciliada.',
  transaccion_fuera_de_verificacion: 'Esa transacción es posterior a la fecha que verificaste.',
  // Comunes a todas las operaciones (3.0.7, 7.7)
  no_encontrado: 'Esto ya no existe.',
  conflicto_id:
    'Ya existe un registro con este identificador y datos distintos. No se guardó nada.',
  conflicto_desactualizado:
    'Este valor cambió mientras lo editabas. Recargá para ver el valor actual.',
};

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Texto de una plantilla con sus datos; un dato ausente queda vacío. */
export function rellenar(plantilla: string, datos: Datos = {}): string {
  return plantilla.replace(/\{(\w+)(:\$)?\}/g, (_, clave: string, monto?: string) => {
    const v = datos[clave];
    if (v === undefined) return '';
    if (monto !== undefined) return formatearMonto(v as Centavos);
    return typeof v === 'string' && FECHA.test(v) ? formatearFecha(v) : String(v);
  });
}

/** El mensaje de un rechazo del dominio, o `null` si el código no está en el catálogo (04 §7.5). */
export function mensajeDeRechazo(r: Pick<Rechazo, 'codigo' | 'datos'>): string | null {
  const m = MENSAJES_RECHAZO[r.codigo];
  if (m === undefined) return null;
  const datos = r.datos ?? {};
  return rellenar(typeof m === 'function' ? m(datos) : m, datos);
}
