// Textos de `/presupuesto/categorias/[categoriaId]` (FT-14; 05 §2.3, §7, §12; 06-identidad-visual §6). Voseo (05 §12.2).
// Los términos del glosario no se repiten acá.
import { alcanceReserva, glosario } from './glosario.ts';

export const categoriaDetalle = {
  titulo: 'Detalle de categoría',
  volver: 'Volver a Presupuesto',
  // C-52 §9: los anuncios de la región de estado de la pantalla.
  anuncios: {
    entrada: (nombre: string) => `Detalle de ${nombre}`,
    periodoCerrado: (fechas: string) => `Período ${fechas}, cerrado`,
    periodoActual: (fechas: string) => `Período actual: ${fechas}`,
    dia: (dia: string) => `Consumos del ${dia}`,
    todos: 'Todos los consumos del período',
  },
  // D-5: el aviso de información del período cerrado; el cuerpo es el del catálogo de 04 (`periodo_cerrado`).
  periodoCerradoTitulo: (fechas: string) => `Período cerrado · ${fechas}`,
  periodoCerrado: 'No se puede cambiar lo asignado en un período cerrado.',
  irAlActual: 'Ir al período actual',
  archivada: 'Categoría archivada',
  // E4-7, E4-30: el detalle de una archivada con Disponible (AV-14) y su meta en pausa.
  archivadaConDinero: (nombre: string, monto: string) =>
    `${nombre} está archivada y tiene ${monto}`,
  archivadaTexto: 'Sacalo para usarlo en otra categoría.',
  elegirDestino: 'Elegir destino y monto',
  metaEnPausa: (nombre: string) => `En pausa: no pide dinero mientras ${nombre} esté archivada.`,
  desarchivarPrimero: 'Para asignarle dinero, desarchivala primero.',
  numeros: {
    disponible: glosario.disponible,
    asignado: glosario.asignado,
    gastado: glosario.gastado,
    arrastre: glosario.arrastrado,
    fondo: 'Fondo',
    entradas: 'Entradas',
    sobregiro: 'Sobregiro',
  },
  sobregiro: {
    debito: glosario.sobregiroConDebitoOEfectivo,
    tarjeta: glosario.deudaSinReservar,
    conDebito: 'Con débito',
    conTarjeta: 'Con tarjeta',
    alCerrar: 'Al cerrar el período, Listo para asignar bajará',
    alCerrarCerrado: 'Al cerrar el período, Listo para asignar bajó',
    sumaALoQueFalta: alcanceReserva.sumaALoQueFalta,
    cubrir: 'Cubrir',
    // C-52 §6: el aviso del sobregiro explica, sin botón; «Cubrir {total}» va en las acciones.
    tituloDebito: 'Sobregiro con débito o efectivo ·',
    tituloTarjeta: (nombre: string) => `Deuda sin reservar en ${nombre} ·`,
    conTarjetaMinuscula: 'con tarjeta',
  },
  consumos: {
    titulo: 'Consumos',
    vacio: 'Sin gastos en este período',
    vacioTexto: 'Cuando gastes en esta categoría, vas a ver acá de dónde salió cada peso.',
    medioDebito: 'débito',
    medioTarjeta: 'tarjeta',
    condonacion: 'Condonación',
    cubierto: 'cubierto',
    noCubierto: 'no cubierto',
    // C-52 §4: filtros, día elegido y la línea del orden de cobertura.
    filtros: 'Filtrar consumos',
    quitarDia: 'Quitar el filtro del día',
    ordenCobertura:
      'Lo asignado cubre los consumos del más antiguo al más reciente: los últimos son los que quedaron sin cubrir.',
    sinFiltro: 'Ningún consumo con este filtro.',
    entradas: 'Devoluciones y entradas',
  },
  // C-52 §2 y §3: la tarjeta «¿En qué se fue?» con sus dos vistas.
  enQueSeFue: {
    titulo: '¿En qué se fue?',
    ver: 'Ver',
    estePeriodo: 'Este período',
    ultimos: (n: number) => `Últimos ${String(n)}`,
  },
  calendario: {
    titulo: 'En el período',
    conGasto: (dia: string, monto: string) => `${dia}, gastaste ${monto}`,
    sinGasto: (dia: string) => `${dia}, sin gasto`,
    nota: 'El punto crece con el gasto del día. Tocá un día para ver sus consumos.',
    etiqueta: 'Días del período',
    dia: 'Día',
    gastado: glosario.gastado,
  },
  historial: {
    titulo: (n: number) => `Últimos ${n} períodos`,
    generico: 'Historial',
    sinDatos: 'Gráfico sin datos',
    vacio: 'Todavía no hay períodos cerrados con esta categoría.',
    sePaso: (k: number, n: number) => `Se pasó ${k} de ${n}`,
    promedio: 'Promedio gastado',
    leyendaGasto: glosario.gastado,
    leyendaAsignado: 'Asignado',
    columnas: ['Período', glosario.asignado, glosario.gastado, glosario.disponible],
  },
  meta: {
    titulo: 'Meta',
    de: 'de',
    pide: 'Pide',
    enElPeriodo: 'este período',
    falta: 'falta',
    asignar: 'Asignar',
    progreso: 'Progreso de la meta',
  },
  // C-52 §2.8: «Próxima: dd/mm».
  programadas: { titulo: 'Programadas', proxima: (fecha: string) => `Próxima: ${fecha}` },
  reglas: { titulo: 'Reglas de comercio' },
  // E2-13 [CH-248]: el resultado de Asignar y de Mover queda bajo las acciones, con «Deshacer» cuando hay operación inversa.
  resultado: {
    asignado: (monto: string, nombre: string) => `Asignaste ${monto} a ${nombre}.`,
    asignadoSinMonto: (nombre: string) => `Guardaste la asignación de ${nombre}.`,
    movido: (monto: string) => `Moviste ${monto}.`,
    deshacer: 'Deshacer',
    deshaciendo: 'Deshaciendo…',
    deshecho: (nombre: string) => `Deshiciste la asignación de ${nombre}.`,
    // [CH-254] el «Deshacer» de Mover: el monto que se movió, de vuelta
    movimientoDeshecho: (monto: string) => `Deshiciste el movimiento de ${monto}.`,
    confirmarDeshacer: 'Confirmar',
  },
  acciones: {
    etiqueta: 'Acciones de la categoría',
    asignar: 'Asignar',
    mover: 'Mover dinero',
    editar: 'Editar nombre y grupo',
    eliminar: 'Eliminar',
    archivar: 'Archivar',
    fusionar: 'Fusionar con otra',
    sacar: 'Sacar el dinero',
    desarchivar: 'Desarchivar',
    desarchivando: 'Desarchivando…',
    crearMeta: 'Crear una meta',
    verMetas: 'Editar la meta',
    bloqueos: {
      disponible: 'No se puede archivar: tiene Disponible distinto de cero.',
      asignaciones_futuras: 'No se puede archivar: tiene asignaciones en períodos futuros.',
      programadas: 'No se puede archivar: tiene programadas activas.',
      eliminar: 'Tiene historial. Podés archivarla o fusionarla.',
    },
  },
} as const;
