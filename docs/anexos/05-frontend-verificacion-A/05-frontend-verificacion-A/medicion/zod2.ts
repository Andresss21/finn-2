import * as z from "zod";
export const contrato = z.object({ id: z.uuid(), fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), total: z.string().regex(/^\d{1,8}(\.\d{1,2})?$/),
  lineas: z.array(z.object({ monto: z.string(), destino: z.union([z.object({ categoriaId: z.uuid() }), z.object({ deudorNuevo: z.string().min(1) })]) })).min(1).max(20) });
