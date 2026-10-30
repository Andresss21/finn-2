// Une nombres de clase omitiendo los vacíos (equivalente mínimo del `cn` de shadcn).
export const cn = (...clases: readonly (string | false | null | undefined)[]): string =>
  clases.filter(Boolean).join(' ');
