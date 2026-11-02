// Textos de `/registrar/[tipo]` para el ingreso y la transferencia (FT-22, FT-23; 05 §12). Los de rechazo del servidor
// (`cuentas_iguales`, `cuenta_tipo_no_valido`…) llegan ya compuestos en `mensaje`.
import { glosario } from './glosario.ts';

export const registrarTipo = {
  tituloIngreso: 'Registrar ingreso',
  tituloTransferencia: 'Transferir entre cuentas',
  cuentaIngreso: 'Cuenta que recibe',
  origen: 'Cuenta de origen',
  destino: 'Cuenta de destino',
  fecha: 'Fecha',
  total: 'Monto',
  descripcion: 'Descripción',
  elegirCuenta: 'Elegí una cuenta.',
  completar: 'Completá este campo.',
  guardarIngreso: 'Guardar ingreso',
  guardarTransferencia: 'Transferir',
  guardando: 'Guardando…',
  confirmar: 'Confirmar',
  volverAEditar: 'Volver a editar',
  revisar: 'Revisá el impacto',
  impactoLpa: (delta: string) => `${glosario.listoParaAsignar} cambia ${delta}.`,
  avisoPeriodoCerrado: 'La fecha es de un período cerrado: cambia el período activo.',
  sinEfectivoTitulo: 'Todavía no tenés una cuenta de efectivo',
  sinEfectivoTexto: 'Un ingreso entra a una cuenta de efectivo. Creá una para registrarlo.',
  pocasTitulo: 'Necesitás dos cuentas de efectivo',
  pocasTexto: 'Para transferir dinero entre cuentas propias hacen falta al menos dos.',
  crearCuenta: 'Crear una cuenta',
  ingresoGuardado: (monto: string, cuenta: string) => `Ingreso guardado: ${monto} · ${cuenta}`,
  transferenciaGuardada: (monto: string, origen: string, destino: string) =>
    `Transferencia guardada: ${monto} · ${origen} a ${destino}`,
  listoIngreso: 'Ingreso registrado',
  listoTransferencia: 'Transferencia registrada',
  registrarOtro: 'Registrar otro',
} as const;
