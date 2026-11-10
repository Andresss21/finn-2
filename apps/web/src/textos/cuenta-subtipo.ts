// [CH-224] D1: el subtipo de una cuenta de efectivo, su ayuda y el nombre que se propone (05 §12). Fuera de `cuentas-nueva.ts`:
// en `/cuentas/nueva` los pasa el lector como datos, así no suman al JS de la ruta (05 §13.1).
export const cuentaSubtipo = {
  etiqueta: 'Tipo de cuenta de efectivo',
  opciones: { corriente: 'Corriente', ahorro: 'Ahorro', billetera: 'Billetera' },
  ayudas: {
    corriente: 'La que usás para el día a día y para pagar tus tarjetas.',
    ahorro: 'Dinero guardado en el banco; se ve con el motivo de anillos.',
    billetera: 'Efectivo en mano, sin banco ni últimos 4.',
  },
  nombres: { corriente: 'Cuenta corriente', ahorro: 'Cuenta de ahorro', billetera: 'Billetera' },
  opcional: 'Opcional',
} as const;

/** Los textos del subtipo tal como viajan del lector al formulario. */
export interface TextosSubtipo {
  readonly etiqueta: string;
  readonly opciones: Readonly<Record<string, string>>;
  readonly ayudas: Readonly<Record<string, string>>;
  readonly nombres: Readonly<Record<string, string>>;
  readonly opcional: string;
}
