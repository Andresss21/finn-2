// Los textos de la cara de tarjeta (06-identidad-visual 2.9), aparte de `cuentas.ts` para que la vista previa de crear la
// tarjeta no traiga los textos de toda la billetera al paquete de su ruta.
export const caraTarjeta = {
  // [CH-225] Aquí y no en `cuentas-nueva.ts`: solo los usa el selector diferido de color. Los 8 colores de 06-identidad-visual (§2.9), por su nombre de `colores-tarjeta.ts`.
  colores: {
    oro: 'Oro',
    plata: 'Plata',
    grafito: 'Grafito',
    zafiro: 'Zafiro',
    rubi: 'Rubí',
    esmeralda: 'Esmeralda',
    amatista: 'Amatista',
    cobre: 'Cobre',
  } as Readonly<Record<string, string>>,
  credito: (red: string) => `${red} · crédito`,
  ultimos4: (digitos: string) => `•••• ${digitos}`,
} as const;
