// Textos de `/presupuesto/categorias/[categoriaId]/archivar` y `…/sacar` (FT-19; 05 §2.3, §4.4, §7). Voseo (05 §12.2). Los rechazos
// (`programada_sin_decision`, `categoria_ya_archivada`, `categoria_de_pago_con_tarjeta`, `destino_igual_origen`,
// `monto_mayor_que_disponible`…) los trae el servidor; acá solo lo propio de cada flujo.
import { glosario } from './glosario.ts';

export const categoriasArchivar = {
  titulo: 'Archivar categoría',
  nadaQueDecidir: (nombre: string) =>
    `${nombre} no tiene dinero, asignaciones futuras ni programadas: se archiva sin más.`,
  destinoDisponible: (monto: string) => `Mandar ${monto} de ${glosario.disponible} a`,
  cubrirSobregiro: (monto: string) => `Cubrir el sobregiro de ${monto} con`,
  lpa: glosario.listoParaAsignar,
  disponibleDe: (monto: string) => `${glosario.disponible} ${monto}`,
  futuras: (n: number) =>
    n === 1
      ? `Tiene dinero asignado en 1 período futuro. Se devuelve a ${glosario.listoParaAsignar}.`
      : `Tiene dinero asignado en ${n} períodos futuros. Se devuelve a ${glosario.listoParaAsignar}.`,
  programada: (comercio: string, monto: string) => `Programada ${comercio} (${monto})`,
  desactivar: 'Desactivarla',
  reasignarA: (nombre: string) => `Pasarla a ${nombre}`,
  elegir: 'Elegí una opción.',
  archivar: 'Archivar',
  archivando: 'Archivando…',
  revisar: 'Revisá el impacto',
  impactoLpa: (delta: string) => `${glosario.listoParaAsignar} cambia ${delta}.`,
  confirmar: 'Confirmar',
  volverAEditar: 'Volver a editar',
  listo: 'Categoría archivada',
  // Lo que la previsualización de OP-09 rechaza llega como código, sin mensaje compuesto (04 §4.3).
  rechazos: {
    programada_sin_decision: 'Falta decidir qué hacer con una programada.',
    categoria_ya_archivada: 'Esta categoría ya está archivada.',
    categoria_de_pago_con_tarjeta: 'Una categoría de pago se archiva junto con su tarjeta.',
    otro: 'No se puede archivar con lo elegido. Volvé a editar y revisá las opciones.',
  },
  sacar: {
    titulo: 'Sacar el dinero',
    disponible: (nombre: string, monto: string) => `${nombre}: ${glosario.disponible} ${monto}.`,
    destino: 'Poner en',
    monto: 'Monto a sacar',
    obligatorio: 'Ingresá un monto.',
    sacar: 'Sacar',
    sacando: 'Sacando…',
    listo: 'Dinero sacado',
    usarValoresActuales: 'Usar los valores actuales',
    valoresActuales: (origen: string, destino: string) =>
      `${glosario.asignado} ahora: ${origen} en la categoría archivada y ${destino} en el destino.`,
    unToque: (monto: string) => `Sacar ${monto} a ${glosario.listoParaAsignar}`,
  },
} as const;
