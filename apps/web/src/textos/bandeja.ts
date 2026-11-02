// Textos de `/bandeja` (FT-34, 05 §2.5, 06-identidad-visual §7). Los de cada fila están en `cuentas.bandeja`; los avisos
// y push de AV-23 son los de 04 §11.4. Voseo (§12.2).
const plural = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

export const bandeja = {
  titulo: 'Bandeja',
  porRevisar: (n: number) => `${n} por revisar`,
  lista: 'Movimientos por revisar',
  desglose: {
    pendientes: (n: number) => plural(n, 'pendiente', 'pendientes'),
    conCoincidencia: (n: number) => plural(n, 'con coincidencia', 'con coincidencia'),
    posiblesDuplicados: (n: number) => plural(n, 'posible duplicado', 'posibles duplicados'),
    noReconocidos: (n: number) => plural(n, 'no reconocido', 'no reconocidos'),
    errores: (n: number) => plural(n, 'con error', 'con error'),
  },
  nota: 'Tocá un movimiento para revisarlo completo.',
  alDia: {
    titulo: 'Bandeja al día',
    texto: 'No hay movimientos por revisar.',
  },
} as const;
