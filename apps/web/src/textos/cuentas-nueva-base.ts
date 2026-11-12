// Textos de `/cuentas/nueva` (FT-50; 05 §12) que usa el formulario siempre. Los de los campos de tarjeta, préstamo e inversión
// van en `cuentas-nueva-tipos.ts`, que se carga con esos campos (05 §13.1). Los del servidor llegan compuestos en `mensaje`.
import { glosario } from './glosario.ts';

export const cuentasNuevaBase = {
  titulo: 'Nueva cuenta',
  tipo: 'Tipo de cuenta',
  tipos: {
    efectivo: 'Efectivo o ahorro',
    tarjeta: 'Tarjeta de crédito',
    prestamo: 'Préstamo',
    inversion: 'Inversión',
  },
  // CTA-02: la elección de tipo en tarjetas con ícono y una línea que dice qué es cada una
  tiposAyuda: {
    efectivo: 'Cuenta corriente, de ahorro o billetera',
    tarjeta: 'Con corte, pago y límite',
    prestamo: 'Con cuota y capital pendiente',
    inversion: 'Depósito a plazo, fondo o acciones',
  },
  entraALpa: 'Entra a Listo para asignar.',
  inversionFuera: 'No entra a Listo para asignar: las inversiones están fuera del presupuesto.',
  nombre: 'Nombre',
  institucion: 'Institución',
  sinInstitucion: 'Sin institución',
  ultimos4: 'Últimos 4 dígitos',
  apertura: 'Fecha de apertura',
  saldo: {
    efectivo: 'Saldo de hoy',
    tarjeta: 'Saldo de la tarjeta',
    prestamo: 'Capital pendiente',
    inversion: 'Valor de hoy',
  },
  debo: 'Debo',
  tengoAFavor: 'Tengo a favor',
  obligatorio: 'Completá este campo.',
  nombreEnUso: (nombre: string) => `Ya tenés una tarjeta llamada ${nombre}.`,
  nombreArchivada: (nombre: string) => `Ya tenés una tarjeta archivada llamada ${nombre}.`,
  guardar: 'Crear cuenta',
  guardando: 'Creando…',
  confirmar: 'Confirmar',
  volverAEditar: 'Volver a editar',
  revisar: 'Revisá el impacto',
  impactoLpa: (delta: string) => `${glosario.listoParaAsignar} cambia ${delta}.`,
  avisos: {
    'AV-01': 'La apertura es de un período cerrado: cambia el período activo.',
    'AV-07': `La deuda de esta tarjeta queda como «${glosario.teFaltaReservar}».`,
  } as Readonly<Record<string, string>>,
  listo: 'Cuenta creada',
} as const;
