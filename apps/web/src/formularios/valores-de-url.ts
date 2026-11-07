// Los valores iniciales que una propuesta de ajuste de AV-21 deja en la URL (05 §2.2, CH-212), compartidos por
// `/registrar/gasto`, `/registrar/ingreso` y `/registrar/entrada-tarjeta`. Solo se aceptan con la forma esperada.

/** Lo que una propuesta de AV-21 deja en la URL (06 FD-06): la fecha del estado, el monto y el comercio del ajuste. */
export interface ValoresDeUrl {
  readonly fecha?: string;
  readonly total?: string;
  readonly comercio?: string;
}

const UNO = (v: string | readonly string[] | undefined): string | undefined =>
  typeof v === 'string' ? v : v?.[0];

/** `?fecha=`, `?total=` y `?comercio=` de la URL, solo si tienen la forma esperada; el servidor valida de nuevo. */
export function valoresDeUrl(
  busqueda: Readonly<Record<string, string | readonly string[] | undefined>>,
): ValoresDeUrl {
  const fecha = UNO(busqueda['fecha']);
  const total = UNO(busqueda['total']);
  const comercio = UNO(busqueda['comercio'])?.trim();
  return {
    ...(fecha !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? { fecha } : {}),
    ...(total !== undefined && /^\d{1,8}(\.\d{1,2})?$/.test(total) ? { total } : {}),
    ...(comercio !== undefined && comercio !== '' && comercio.length <= 80 ? { comercio } : {}),
  };
}
