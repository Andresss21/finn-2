// Textos de editar y ordenar cuentas (FT-53; 05 §2.7, §12). Los de la creación se reusan de `cuentas-nueva`; los rechazos del
// servidor (`apertura_posterior_a_movimientos`, `ultimos4_repetidos`, `nombre_repetido`…) llegan ya compuestos en `mensaje`.
import { cuentasNueva } from './cuentas-nueva.ts';

export const cuentasGestion = {
  editar: {
    titulo: 'Editar cuenta',
    guardar: 'Guardar cambios',
    guardando: 'Guardando…',
    usarValorActual: 'Usar el valor actual',
  },
  ordenar: {
    titulo: 'Ordenar cuentas',
    guardar: 'Guardar orden',
    guardando: 'Guardando…',
    subir: (nombre: string) => `Subir ${nombre}`,
    bajar: (nombre: string) => `Bajar ${nombre}`,
    subirCorto: 'Subir',
    bajarCorto: 'Bajar',
    conflicto: 'Tus cuentas cambiaron. Recargá para ver el orden actual.',
  },
  comunes: cuentasNueva,
} as const;
