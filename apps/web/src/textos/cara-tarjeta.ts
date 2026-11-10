// Los textos de la cara de tarjeta (06-identidad-visual 2.9), aparte de `cuentas.ts` para que la vista previa de crear la
// tarjeta no traiga los textos de toda la billetera al paquete de su ruta.
export const caraTarjeta = {
  credito: (red: string) => `${red} · crédito`,
  ultimos4: (digitos: string) => `•••• ${digitos}`,
} as const;
