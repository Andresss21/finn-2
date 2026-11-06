// Textos de `/registrar/aporte-inversion`, `/registrar/retiro-inversion` y `/registrar/ajuste-inversion` (FT-57; 05 §12). Los de
// rechazo del servidor (`retiro_mayor_que_valor`, `valor_inversion_negativo`, `categoria_archivada`…) llegan ya compuestos en `mensaje`.
export const registrarInversion = {
  titulo: {
    aporte: 'Aportar a una inversión',
    retiro: 'Retirar de una inversión',
    ajuste: 'Ajustar el valor de una inversión',
  },
  inversion: 'Inversión',
  valorDe: (monto: string) => `Valor ${monto}`,
  cuentaAporte: 'Sale de la cuenta',
  cuentaRetiro: 'Entra a la cuenta',
  categoria: 'Categoría del aporte',
  fecha: 'Fecha',
  monto: 'Monto',
  montoAjuste: 'Cambio de valor',
  sube: 'Sube',
  baja: 'Baja',
  elegirInversion: 'Elegí una inversión.',
  elegirCuenta: 'Elegí una cuenta.',
  elegirCategoria: 'Elegí una categoría.',
  completar: 'Completá este campo.',
  guardar: { aporte: 'Aportar', retiro: 'Retirar', ajuste: 'Guardar ajuste' },
  guardando: 'Guardando…',
  confirmar: 'Confirmar',
  volverAEditar: 'Volver a editar',
  revisar: 'Revisá el impacto',
  avisoPeriodoCerrado: 'La fecha es de un período cerrado: cambia el período activo.',
  sinInversionesTitulo: 'Todavía no tenés inversiones',
  sinInversionesTexto:
    'Un aporte, un retiro o un ajuste necesitan una cuenta de inversión. Creá una para empezar.',
  sinEfectivoTitulo: 'Todavía no tenés una cuenta de efectivo',
  sinEfectivoTexto:
    'El dinero de un aporte sale de una cuenta de efectivo y el de un retiro entra a una. Creá una.',
  crearCuenta: 'Crear una cuenta',
  listo: { aporte: 'Aporte registrado', retiro: 'Retiro registrado', ajuste: 'Ajuste registrado' },
  aporteGuardado: (monto: string, cuenta: string, inversion: string) =>
    `Aporte guardado: ${monto} · ${cuenta} a ${inversion}`,
  retiroGuardado: (monto: string, inversion: string, cuenta: string) =>
    `Retiro guardado: ${monto} · ${inversion} a ${cuenta}`,
  ajusteGuardado: (monto: string, inversion: string) => `Ajuste guardado: ${monto} · ${inversion}`,
  registrarOtro: 'Registrar otro',
  // `/registrar`: el listado de qué registrar
  tipoAporte: 'Un aporte a una inversión',
  tipoAporteDetalle: 'Dinero de una categoría que pasa a una inversión.',
  tipoRetiro: 'Un retiro de una inversión',
  tipoRetiroDetalle: 'Dinero de una inversión que vuelve a Listo para asignar.',
  tipoAjuste: 'Un ajuste de valor',
  tipoAjusteDetalle: 'El valor que informa el banco; no cambia tu presupuesto.',
} as const;
