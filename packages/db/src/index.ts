// Contrato público de @finn/db (04 §2.5). Sin tipos de Prisma: el cliente y `txPrisma` quedan dentro del paquete.
export {
  escribir,
  leer,
  OPERACIONES_DECLARADAS,
  type EscritorTx,
  type EstadoEscritura,
  type EstadoLectura,
  type LectorTx,
  type OpcionesTx,
  type OperacionDeclarada,
  type RelojTx,
  type TrabajoEscritura,
  type TrabajoLectura,
} from './transacciones.ts';
