// Los textos de la cara de tarjeta (06-identidad-visual 2.9), aparte de `cuentas.ts` para que la vista previa de crear la
// tarjeta no traiga los textos de toda la billetera al paquete de su ruta.
export const caraTarjeta = {
  // [CH-225] Aquí y no en `cuentas-nueva.ts`: solo los usa el selector diferido de color. Los 8 colores de 06-identidad-visual (§2.9, CH-225), con su hex canónico como #RRGGBB
  colores: {
    '#7E6638': 'Oro',
    '#5C6670': 'Plata',
    '#2E3138': 'Grafito',
    '#24509A': 'Zafiro',
    '#7E2231': 'Rubí',
    '#1A6043': 'Esmeralda',
    '#52308C': 'Amatista',
    '#7C4626': 'Cobre',
  } as Readonly<Record<string, string>>,
  credito: (red: string) => `${red} · crédito`,
  ultimos4: (digitos: string) => `•••• ${digitos}`,
} as const;
