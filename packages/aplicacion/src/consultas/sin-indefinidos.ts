// Zod entrega los parámetros opcionales como `T | undefined`; los selectores, con `exactOptionalPropertyTypes`, los
// esperan ausentes. Quita las claves indefinidas.
export function sinIndefinidos<T extends object>(
  o: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as never;
}
