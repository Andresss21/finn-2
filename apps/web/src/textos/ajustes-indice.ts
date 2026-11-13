// [CH-251] Los resúmenes de las filas del índice de Ajustes (AJU-01; entrega 3, `16-salir/ajustes-indice`). Voseo (05 §12.2).
export const ajustesIndice = {
  ciclo: (dia: number) => `Empieza el día ${dia}`,
  sinConectar: 'Sin conectar',
  conectado: 'Conectado',
  conectadoUltimo: (cuando: string) => `Conectado · último SMS ${cuando}`,
  activos: (n: number) => (n === 1 ? '1 activo' : `${n} activos`),
  // [CH-254] Seguridad: solo los factores; Auth no lista las sesiones sin la clave de servicio (04 §6.11).
  factores: (n: number) => (n === 1 ? '1 factor' : `${n} factores`),
  exportar: 'JSON y CSV',
  errores: (n: number) =>
    n === 0 ? 'Sin errores en 7 días' : n === 1 ? '1 error en 7 días' : `${n} errores en 7 días`,
} as const;
