// Contrato público de @finn/db (04 §2.5). Sin tipos de Prisma: el cliente y `txPrisma` quedan dentro del paquete.
export {
  escribir,
  escribirSms,
  escribirTecnico,
  leer,
  OPERACIONES_DECLARADAS,
  type EscritorSmsTx,
  type EscritorTablasT,
  type EscritorTecnicoTx,
  type EscritorTx,
  type EstadoEscritura,
  type EstadoLectura,
  type LectorTx,
  type OpcionesTx,
  type OperacionDeclarada,
  type RelojTx,
  type TrabajoEscritura,
  type TrabajoLectura,
  type TrabajoSms,
  type TrabajoTecnico,
} from './transacciones.ts';
export { cargarHechos, COLUMNAS_CARGADAS, COLUMNAS_NO_CARGADAS } from './hechos/cargar.ts';
export { Memoria } from './hechos/memoria.ts';
export { ErrorTraductor, type ValorDeLaBase, type ValoresDeLaBase } from './hechos/traductor.ts';
export { sqlstateDe, type SqlstateDe } from './errores.ts';
export * from './repositorios/index.ts';
