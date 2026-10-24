import * as z from "zod/mini";
export const contrato = z.object({ id: z.uuid(), fecha: z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/)), total: z.string().check(z.regex(/^\d{1,8}(\.\d{1,2})?$/)),
  lineas: z.array(z.object({ monto: z.string(), destino: z.union([z.object({ categoriaId: z.uuid() }), z.object({ deudorNuevo: z.string().check(z.minLength(1)) })]) })).check(z.minLength(1), z.maxLength(20)) });
