// Textos de `/presupuesto` (FT-09; 05 §2.3, §7; 06-identidad-visual §5). Voseo (05 §12.2). Los términos del glosario no se repiten acá.
import { estados } from './estados.ts';
import { glosario } from './glosario.ts';

export const presupuesto = {
  titulo: 'Presupuesto',
  filtros: {
    etiqueta: 'Filtrar categorías',
    todas: 'Todas',
    sobregiradas: 'Sobregiradas',
    sinFondos: 'Sin fondos',
    cubiertas: 'Cubiertas',
  },
  sinResultados: {
    titulo: 'Ninguna categoría cumple este filtro',
    texto: estados.sinResultados.texto,
    quitar: estados.sinResultados.quitar,
  },
  // [CH-269] C-43: sin ninguna categoría, la lista sugerida o armarlas a mano.
  sinCategorias: {
    titulo: 'Todavía no tenés categorías',
    texto: 'Creá tus grupos y categorías para empezar a repartir tu dinero.',
    sugerida: 'Usar la lista sugerida',
    aMano: 'Armarlas a mano',
  },
  // [CH-269] C-43: el acceso a la estructura en «Más acciones».
  enPresupuesto: 'En Presupuesto',
  editarEstructura: 'Editar estructura',
  editarEstructuraDetalle: 'Grupos, categorías y su orden',
  acciones: {
    etiqueta: 'Acciones del período',
    mover: 'Mover dinero',
    autoAsignar: 'Auto-asignar',
    asignar: 'Asignar',
    comoSeCompone: 'Ver cómo se compone',
  },
  columnaCategoria: 'Categoría',
  grupoTotal: (grupo: string) => `Total de ${grupo}`,
  pagosTarjeta: 'Pagos de tarjeta',
  totales: 'Totales del período',
  archivadas: {
    titulo: 'Archivadas con dinero',
    texto:
      'Estas categorías están archivadas y todavía tienen dinero. Sacalo para devolverlo a Listo para asignar.',
    sacar: (categoria: string) => `Sacar el dinero de ${categoria}`,
    disponible: glosario.disponible,
  },
} as const;
