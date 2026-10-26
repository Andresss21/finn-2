// Una fila por tabla [M] y [H] de 03 §0.4, con los nombres de campo del modelo Prisma (03 §10.3) y
// tipos del dominio. `revision` y `secuencia` son `null` mientras la base no los haya fijado
// (04 §2.4.1). Las columnas `?` de Prisma son `| null`.
import type { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import type * as E from './enums';
import type { BigintTexto, DecimalTexto, Instante, Uuid } from './identificadores';

/** Revisión que estampa la base en cada fila [M]; `null` si todavía no se completó. */
type Revision = BigintTexto | null;

// ───────────── [M]: entradas del motor ─────────────

export interface VigenciaCiclo {
  readonly id: Uuid;
  readonly diaInicio: number;
  readonly rigeDesde: FechaLocal | null;
  readonly revision: Revision;
}

export interface Cuenta {
  readonly id: Uuid;
  readonly tipo: E.TipoCuenta;
  readonly nombre: string;
  readonly institucionId: Uuid | null;
  readonly ultimos4: string | null;
  readonly fechaApertura: FechaLocal;
  readonly orden: number;
  readonly archivada: boolean;
  readonly revision: Revision;
}

export interface Tarjeta {
  readonly cuentaId: Uuid;
  readonly tipo: 'tarjeta';
  readonly limiteCredito: Centavos;
  readonly tasaAnualMillonesimas: number | null;
  readonly diaCorte: number;
  readonly diaPago: number;
  readonly red: E.RedTarjeta | null;
  readonly color: string | null;
  readonly revision: Revision;
}

export interface Prestamo {
  readonly cuentaId: Uuid;
  readonly tipo: 'prestamo';
  readonly contraparte: string;
  readonly montoOriginal: Centavos;
  readonly tasaNominalAnualMillonesimas: number | null;
  readonly tipoTasa: E.TipoTasa;
  readonly seguroPrimerMes: Centavos | null;
  readonly comision: Centavos | null;
  readonly frecuencia: E.Frecuencia;
  readonly frecuenciaDias: number | null;
  readonly cuotaPactada: Centavos;
  readonly plazoCuotas: number;
  readonly modeloCalculo: E.ModeloPrestamo | null;
  readonly cuotasPagadasAlCrear: number;
  readonly revision: Revision;
}

export interface Inversion {
  readonly cuentaId: Uuid;
  readonly tipo: 'inversion';
  readonly rendimientoAnualEsperadoMillonesimas: number | null;
  readonly revision: Revision;
}

export interface Grupo {
  readonly id: Uuid;
  readonly nombre: string;
  readonly orden: number;
  readonly archivado: boolean;
  readonly claveSistema: string | null;
  readonly revision: Revision;
}

export interface Categoria {
  readonly id: Uuid;
  readonly grupoId: Uuid;
  readonly nombre: string;
  readonly orden: number;
  readonly clase: E.ClaseCategoria;
  readonly tarjetaId: Uuid | null;
  readonly archivada: boolean;
  readonly revision: Revision;
}

export interface Asignacion {
  readonly id: Uuid;
  readonly categoriaId: Uuid;
  readonly periodoInicio: FechaLocal;
  readonly monto: Centavos;
  readonly revision: Revision;
}

export interface Deudor {
  readonly id: Uuid;
  readonly nombre: string;
  readonly revision: Revision;
}

export interface Transaccion {
  readonly id: Uuid;
  readonly tipo: E.TipoTransaccion;
  readonly fecha: FechaLocal;
  readonly horaRegistro: Instante;
  readonly claveOrden: Instante;
  readonly secuencia: BigintTexto | null;
  readonly origen: E.OrigenTransaccion;
  readonly estadoBancario: E.EstadoBancario;
  readonly conciliacionId: Uuid | null;
  readonly comercio: string | null;
  readonly nota: string | null;
  readonly total: Centavos;
  readonly monedaOriginal: string | null;
  readonly montoOriginal: DecimalTexto | null;
  readonly lineaCobradaId: Uuid | null;
  readonly revision: Revision;
}

export interface Efecto {
  readonly id: Uuid;
  readonly transaccionId: Uuid;
  readonly cuentaId: Uuid;
  readonly monto: Centavos;
  readonly interes: Centavos | null;
  readonly seguro: Centavos | null;
  readonly revision: Revision;
}

export interface Linea {
  readonly id: Uuid;
  readonly transaccionId: Uuid;
  readonly orden: number;
  readonly monto: Centavos;
  readonly categoriaId: Uuid | null;
  readonly deudorId: Uuid | null;
  readonly lineaOriginalId: Uuid | null;
  readonly revision: Revision;
}

export interface Condonacion {
  readonly id: Uuid;
  readonly lineaId: Uuid;
  readonly fecha: FechaLocal;
  readonly monto: Centavos;
  readonly claveOrden: Instante;
  readonly secuencia: BigintTexto | null;
  readonly categoriaId: Uuid;
  readonly revision: Revision;
}

export interface Meta {
  readonly id: Uuid;
  readonly categoriaId: Uuid;
  readonly tipo: E.TipoMeta;
  readonly modo: E.ModoMeta | null;
  readonly monto: Centavos;
  readonly fechaObjetivo: FechaLocal | null;
  readonly fechaCreacion: FechaLocal;
  readonly revision: Revision;
}

export interface Programada {
  readonly id: Uuid;
  readonly tipo: E.TipoProgramada;
  readonly cuentaId: Uuid;
  readonly cuentaDestinoId: Uuid | null;
  readonly comercio: string;
  readonly monto: Centavos;
  readonly tolerancia: Centavos;
  readonly frecuencia: E.Frecuencia;
  readonly frecuenciaDias: number | null;
  readonly primeraFecha: FechaLocal;
  readonly fechaFin: FechaLocal | null;
  readonly registroAutomatico: boolean;
  readonly activa: boolean;
  readonly revision: Revision;
}

export interface ProgramadaLinea {
  readonly id: Uuid;
  readonly programadaId: Uuid;
  readonly orden: number;
  readonly monto: Centavos;
  readonly categoriaId: Uuid;
  readonly revision: Revision;
}

export interface OcurrenciaResuelta {
  readonly id: Uuid;
  readonly programadaId: Uuid;
  readonly fechaEsperada: FechaLocal;
  readonly estado: E.EstadoOcurrencia;
  readonly transaccionId: Uuid | null;
  readonly revision: Revision;
}

export interface Conciliacion {
  readonly id: Uuid;
  readonly cuentaId: Uuid;
  readonly fechaEstado: FechaLocal;
  readonly saldoEstado: Centavos;
  readonly terminadaEn: Instante;
  readonly diferenciaAceptada: Centavos;
  readonly modo: 'estado_cuenta' | 'saldo'; // CF-01 (06 §3.2.3): OP-47 o OP-53
  readonly revision: Revision;
}

// ───────────── [H]: hechos que el motor no carga pero las operaciones escriben ─────────────

export interface Institucion {
  readonly id: Uuid;
  readonly nombre: string;
}

export interface Movimiento {
  readonly id: Uuid;
  readonly smsId: Uuid;
  readonly estado: E.EstadoMovimiento;
  readonly cuentaId: Uuid | null;
  readonly fecha: FechaLocal | null;
  readonly monto: Centavos | null;
  readonly comercio: string | null;
  readonly tipoPropuesto: E.TipoTransaccion | null;
  readonly nota: string | null;
  readonly duplicadoTransaccionId: Uuid | null;
  readonly duplicadoMovimientoId: Uuid | null;
  readonly esperadaProgramadaId: Uuid | null;
  readonly esperadaFecha: FechaLocal | null;
  readonly transaccionId: Uuid | null;
}

export interface MovimientoLinea {
  readonly id: Uuid;
  readonly movimientoId: Uuid;
  readonly orden: number;
  readonly monto: Centavos;
  readonly categoriaId: Uuid | null;
  readonly deudorId: Uuid | null;
  readonly lineaOriginalId: Uuid | null;
}

export interface FormatoBancario {
  readonly id: Uuid;
  readonly institucionId: Uuid;
  readonly nombre: string;
  readonly tipoMovimiento: E.TipoMovimientoBancario;
  readonly patron: string;
  readonly banderas: string;
  readonly montoSeparadorMiles: string;
  readonly montoSeparadorDecimal: string;
  readonly formatosFecha: readonly string[];
  readonly activo: boolean;
}

export interface ReglaComercio {
  readonly id: Uuid;
  readonly patron: string;
  readonly categoriaId: Uuid;
}

export interface CambioPosterior {
  readonly id: Uuid;
  readonly conciliacionId: Uuid;
  readonly transaccionId: Uuid | null;
  readonly registradoEn: Instante;
  readonly motivos: readonly E.MotivoCambio[];
  readonly fecha: FechaLocal;
  readonly montoEfecto: Centavos;
  readonly comercio: string | null;
}

/** Tabla de la base → tipo de su fila. Las claves son las tablas [M] y [H] de 03 §0.4. */
export interface FilasPorTabla {
  // [M]
  readonly vigencias_ciclo: VigenciaCiclo;
  readonly cuentas: Cuenta;
  readonly tarjetas: Tarjeta;
  readonly prestamos: Prestamo;
  readonly inversiones: Inversion;
  readonly grupos: Grupo;
  readonly categorias: Categoria;
  readonly asignaciones: Asignacion;
  readonly deudores: Deudor;
  readonly transacciones: Transaccion;
  readonly efectos: Efecto;
  readonly lineas: Linea;
  readonly condonaciones: Condonacion;
  readonly metas: Meta;
  readonly programadas: Programada;
  readonly programada_lineas: ProgramadaLinea;
  readonly ocurrencias_resueltas: OcurrenciaResuelta;
  readonly conciliaciones: Conciliacion;
  // [H]
  readonly instituciones: Institucion;
  readonly movimientos: Movimiento;
  readonly movimiento_lineas: MovimientoLinea;
  readonly formatos_bancarios: FormatoBancario;
  readonly reglas_comercio: ReglaComercio;
  readonly cambios_posteriores: CambioPosterior;
}
