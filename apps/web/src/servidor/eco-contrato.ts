// Contrato del flujo de prueba `/pruebas/eco` (TA-210): el mismo para el servidor (`eco.ts`) y el formulario (`.omit()`).
import * as z from 'zod';

export const contratoEco = z.object({
  modo: z.enum(['previsualizar', 'confirmar']),
  id: z.uuid(),
  texto: z.string().trim().min(1, 'Escribí un texto.'),
  esperado: z.object({ texto: z.string() }).optional(),
  revisionVista: z.string().optional(),
  huellaImpacto: z.string().optional(),
});

export const contratoFormularioEco = contratoEco.omit({
  modo: true,
  id: true,
  esperado: true,
  revisionVista: true,
  huellaImpacto: true,
});
export type CamposEco = z.infer<typeof contratoFormularioEco>;
