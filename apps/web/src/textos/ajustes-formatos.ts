// Textos de `/ajustes/formatos` (FT-73; 05 §2.11, §12; 04 §8.5, §8.7). Voseo (05 §12.2). Los rechazos de la política del patrón
// (`patron_invalido`, `banderas_no_permitidas`, `grupos_obligatorios`, `patron_lento`) llegan ya compuestos del servidor en `mensaje`:
// acá no se repiten. Los textos del formulario y de Instituciones se suman con sus partes (CH-125).
export const ajustesFormatos = {
  titulo: 'Formatos bancarios',
  enlace: 'Formatos bancarios',
  descripcion: 'Cómo Finn lee los SMS de cada banco. Los cambios rigen desde el próximo SMS.',
  nuevo: 'Nuevo formato',
  instituciones: 'Instituciones',
  vacio: {
    titulo: 'Todavía no hay formatos',
    texto: 'Creá el primero para que Finn lea los SMS de tu banco.',
  },
  sinUsos: 'Sin usos todavía',
  usos: (n: number | string, ultimo: string) =>
    `${n} ${Number(n) === 1 ? 'uso' : 'usos'} · último ${ultimo}`,
  inactivo: 'Inactivo',
  tipos: {
    compra: 'Compra',
    deposito: 'Depósito',
    pago_tarjeta: 'Pago de tarjeta',
    devolucion: 'Devolución',
  },
} as const;
