// Textos que la entrega 4 agrega a Por cobrar (E4-21): la sección «Cerrados · N», una fila por partida cerrada sin acciones.
export const porCobrarEntrega4 = {
  cerrados: (n: number) => `Cerrados · ${n}`,
  ocultarCerrados: 'Ocultar los cerrados',
  cobrado: 'cobrado',
  condonado: 'condonado',
} as const;
