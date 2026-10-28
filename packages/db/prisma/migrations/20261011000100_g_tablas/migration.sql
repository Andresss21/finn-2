-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "finn";

-- CreateEnum
CREATE TYPE "finn"."tipo_cuenta" AS ENUM ('efectivo', 'tarjeta', 'prestamo', 'inversion');

-- CreateEnum
CREATE TYPE "finn"."clase_categoria" AS ENUM ('normal', 'pago');

-- CreateEnum
CREATE TYPE "finn"."tipo_transaccion" AS ENUM ('gasto', 'ingreso', 'saldo_inicial', 'transferencia', 'pago_tarjeta', 'cuota_prestamo', 'abono_capital', 'aporte_inversion', 'desembolso_prestamo', 'retiro_inversion', 'avance_efectivo', 'entrada_tarjeta', 'transferencia_tarjetas', 'cobro', 'devolucion', 'ajuste_inversion');

-- CreateEnum
CREATE TYPE "finn"."origen_transaccion" AS ENUM ('sms', 'manual', 'importada', 'programada');

-- CreateEnum
CREATE TYPE "finn"."estado_bancario" AS ENUM ('pendiente', 'confirmada', 'conciliada');

-- CreateEnum
CREATE TYPE "finn"."red_tarjeta" AS ENUM ('visa', 'mastercard', 'otra');

-- CreateEnum
CREATE TYPE "finn"."tipo_tasa" AS ENUM ('fija', 'variable');

-- CreateEnum
CREATE TYPE "finn"."frecuencia" AS ENUM ('semanal', 'quincenal', 'mensual', 'anual', 'cada_n_dias');

-- CreateEnum
CREATE TYPE "finn"."modelo_prestamo" AS ENUM ('banco_agricola');

-- CreateEnum
CREATE TYPE "finn"."tipo_meta" AS ENUM ('mensual', 'semanal', 'anual', 'para_fecha');

-- CreateEnum
CREATE TYPE "finn"."modo_meta" AS ENUM ('acumular', 'rellenar_hasta');

-- CreateEnum
CREATE TYPE "finn"."tipo_programada" AS ENUM ('gasto', 'pago_tarjeta', 'cuota_prestamo', 'aporte_inversion');

-- CreateEnum
CREATE TYPE "finn"."estado_ocurrencia" AS ENUM ('emparejada', 'registrada', 'omitida');

-- CreateEnum
CREATE TYPE "finn"."tipo_movimiento_bancario" AS ENUM ('compra', 'deposito', 'pago_tarjeta', 'devolucion');

-- CreateEnum
CREATE TYPE "finn"."estado_movimiento" AS ENUM ('pendiente', 'con_coincidencia', 'posible_duplicado', 'no_reconocido', 'error', 'aprobado', 'descartado', 'autodescartado');

-- CreateEnum
CREATE TYPE "finn"."resultado_procesamiento" AS ENUM ('pendiente', 'con_coincidencia', 'posible_duplicado', 'no_reconocido', 'autodescartado', 'error');

-- CreateEnum
CREATE TYPE "finn"."motivo_cambio" AS ENUM ('monto', 'fecha', 'cuenta', 'eliminacion');

-- CreateEnum
CREATE TYPE "finn"."nivel_evento" AS ENUM ('info', 'aviso', 'error');

-- CreateTable
CREATE TABLE "finn"."vigencias_ciclo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dia_inicio" SMALLINT NOT NULL,
    "rige_desde" DATE,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "vigencias_ciclo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."instituciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,

    CONSTRAINT "instituciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."cuentas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo" "finn"."tipo_cuenta" NOT NULL,
    "nombre" TEXT NOT NULL,
    "institucion_id" UUID,
    "ultimos4" TEXT,
    "fecha_apertura" DATE NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "archivada" BOOLEAN NOT NULL DEFAULT false,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "cuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."tarjetas" (
    "cuenta_id" UUID NOT NULL,
    "tipo" "finn"."tipo_cuenta" NOT NULL DEFAULT 'tarjeta',
    "limite_credito" INTEGER NOT NULL,
    "tasa_anual_millonesimas" INTEGER,
    "dia_corte" SMALLINT NOT NULL,
    "dia_pago" SMALLINT NOT NULL,
    "red" "finn"."red_tarjeta",
    "color" TEXT,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "tarjetas_pkey" PRIMARY KEY ("cuenta_id")
);

-- CreateTable
CREATE TABLE "finn"."prestamos" (
    "cuenta_id" UUID NOT NULL,
    "tipo" "finn"."tipo_cuenta" NOT NULL DEFAULT 'prestamo',
    "contraparte" TEXT NOT NULL,
    "monto_original" INTEGER NOT NULL,
    "tasa_nominal_anual_millonesimas" INTEGER,
    "tipo_tasa" "finn"."tipo_tasa" NOT NULL,
    "seguro_primer_mes" INTEGER,
    "comision" INTEGER,
    "frecuencia" "finn"."frecuencia" NOT NULL,
    "frecuencia_dias" SMALLINT,
    "cuota_pactada" INTEGER NOT NULL,
    "plazo_cuotas" INTEGER NOT NULL,
    "modelo_calculo" "finn"."modelo_prestamo",
    "cuotas_pagadas_al_crear" INTEGER NOT NULL DEFAULT 0,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "prestamos_pkey" PRIMARY KEY ("cuenta_id")
);

-- CreateTable
CREATE TABLE "finn"."inversiones" (
    "cuenta_id" UUID NOT NULL,
    "tipo" "finn"."tipo_cuenta" NOT NULL DEFAULT 'inversion',
    "rendimiento_anual_esperado_millonesimas" INTEGER,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "inversiones_pkey" PRIMARY KEY ("cuenta_id")
);

-- CreateTable
CREATE TABLE "finn"."grupos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "archivado" BOOLEAN NOT NULL DEFAULT false,
    "clave_sistema" TEXT,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."categorias" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "grupo_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "clase" "finn"."clase_categoria" NOT NULL DEFAULT 'normal',
    "tarjeta_id" UUID,
    "archivada" BOOLEAN NOT NULL DEFAULT false,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."asignaciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "categoria_id" UUID NOT NULL,
    "periodo_inicio" DATE NOT NULL,
    "monto" INTEGER NOT NULL,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "asignaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."deudores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "deudores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."transacciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo" "finn"."tipo_transaccion" NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_registro" TIMESTAMPTZ(6) NOT NULL,
    "clave_orden" TIMESTAMPTZ(6) NOT NULL,
    "secuencia" BIGINT NOT NULL,
    "origen" "finn"."origen_transaccion" NOT NULL,
    "estado_bancario" "finn"."estado_bancario" NOT NULL,
    "conciliacion_id" UUID,
    "comercio" TEXT,
    "nota" TEXT,
    "total" INTEGER NOT NULL,
    "moneda_original" TEXT,
    "monto_original" DECIMAL(18,4),
    "linea_cobrada_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "transacciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."efectos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaccion_id" UUID NOT NULL,
    "cuenta_id" UUID NOT NULL,
    "monto" INTEGER NOT NULL,
    "interes" INTEGER,
    "seguro" INTEGER,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "efectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."lineas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaccion_id" UUID NOT NULL,
    "orden" SMALLINT NOT NULL,
    "monto" INTEGER NOT NULL,
    "categoria_id" UUID,
    "deudor_id" UUID,
    "linea_original_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "lineas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."condonaciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "linea_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "monto" INTEGER NOT NULL,
    "clave_orden" TIMESTAMPTZ(6) NOT NULL,
    "secuencia" BIGINT NOT NULL,
    "categoria_id" UUID NOT NULL,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "condonaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."metas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "categoria_id" UUID NOT NULL,
    "tipo" "finn"."tipo_meta" NOT NULL,
    "modo" "finn"."modo_meta",
    "monto" INTEGER NOT NULL,
    "fecha_objetivo" DATE,
    "fecha_creacion" DATE NOT NULL,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "metas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."sms_recibidos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "texto" TEXT NOT NULL,
    "remitente" TEXT NOT NULL,
    "recibido_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_recibidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."sms_procesamientos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sms_id" UUID NOT NULL,
    "intento" SMALLINT NOT NULL,
    "procesado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultado" "finn"."resultado_procesamiento" NOT NULL,
    "formato_id" UUID,
    "formatos_coincidentes" UUID[] DEFAULT ARRAY[]::UUID[],
    "tipo_movimiento" "finn"."tipo_movimiento_bancario",
    "ultimos4" TEXT,
    "monto" INTEGER,
    "comercio" TEXT,
    "fecha" DATE,
    "cuenta_id" UUID,
    "esperada_programada_id" UUID,
    "esperada_fecha" DATE,
    "duplicado_transaccion_id" UUID,
    "duplicado_movimiento_id" UUID,
    "categoria_sugerida_id" UUID,
    "error_detalle" TEXT,

    CONSTRAINT "sms_procesamientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."movimientos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sms_id" UUID NOT NULL,
    "estado" "finn"."estado_movimiento" NOT NULL,
    "cuenta_id" UUID,
    "fecha" DATE,
    "monto" INTEGER,
    "comercio" TEXT,
    "tipo_propuesto" "finn"."tipo_transaccion",
    "nota" TEXT,
    "duplicado_transaccion_id" UUID,
    "duplicado_movimiento_id" UUID,
    "esperada_programada_id" UUID,
    "esperada_fecha" DATE,
    "transaccion_id" UUID,

    CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."movimiento_lineas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "movimiento_id" UUID NOT NULL,
    "orden" SMALLINT NOT NULL,
    "monto" INTEGER NOT NULL,
    "categoria_id" UUID,
    "deudor_id" UUID,
    "linea_original_id" UUID,

    CONSTRAINT "movimiento_lineas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."formatos_bancarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "institucion_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo_movimiento" "finn"."tipo_movimiento_bancario" NOT NULL,
    "patron" TEXT NOT NULL,
    "banderas" TEXT NOT NULL DEFAULT 'i',
    "monto_separador_miles" TEXT NOT NULL DEFAULT ',',
    "monto_separador_decimal" TEXT NOT NULL DEFAULT '.',
    "formatos_fecha" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "formatos_bancarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."reglas_comercio" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patron" TEXT NOT NULL,
    "categoria_id" UUID NOT NULL,

    CONSTRAINT "reglas_comercio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."programadas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo" "finn"."tipo_programada" NOT NULL,
    "cuenta_id" UUID NOT NULL,
    "cuenta_destino_id" UUID,
    "comercio" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "tolerancia" INTEGER NOT NULL DEFAULT 0,
    "frecuencia" "finn"."frecuencia" NOT NULL,
    "frecuencia_dias" SMALLINT,
    "primera_fecha" DATE NOT NULL,
    "fecha_fin" DATE,
    "registro_automatico" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "programadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."programada_lineas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "programada_id" UUID NOT NULL,
    "orden" SMALLINT NOT NULL,
    "monto" INTEGER NOT NULL,
    "categoria_id" UUID NOT NULL,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "programada_lineas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."ocurrencias_resueltas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "programada_id" UUID NOT NULL,
    "fecha_esperada" DATE NOT NULL,
    "estado" "finn"."estado_ocurrencia" NOT NULL,
    "transaccion_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "ocurrencias_resueltas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."conciliaciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cuenta_id" UUID NOT NULL,
    "fecha_estado" DATE NOT NULL,
    "saldo_estado" INTEGER NOT NULL,
    "terminada_en" TIMESTAMPTZ(6) NOT NULL,
    "diferencia_aceptada" INTEGER NOT NULL,
    "revision" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "conciliaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."cambios_posteriores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conciliacion_id" UUID NOT NULL,
    "transaccion_id" UUID,
    "registrado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivos" "finn"."motivo_cambio"[],
    "fecha" DATE NOT NULL,
    "monto_efecto" INTEGER NOT NULL,
    "comercio" TEXT,

    CONSTRAINT "cambios_posteriores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."revision" (
    "id" SMALLINT NOT NULL DEFAULT 1,
    "valor" BIGINT NOT NULL DEFAULT 0,
    "ultima_transaccion" BIGINT,
    "revision_minima_incremental" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."eliminaciones" (
    "id" BIGSERIAL NOT NULL,
    "tabla" TEXT NOT NULL,
    "fila_id" UUID NOT NULL,
    "revision" BIGINT NOT NULL,
    "eliminada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eliminaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."suscripciones_push" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "endpoint" TEXT NOT NULL,
    "clave_p256dh" TEXT NOT NULL,
    "clave_auth" TEXT NOT NULL,
    "agente" TEXT,
    "creada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renovada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suscripciones_push_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."notificaciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aviso" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "datos" JSONB,
    "leida_en" TIMESTAMPTZ(6),
    "push_enviada_en" TIMESTAMPTZ(6),
    "push_error" TEXT,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."eventos_sistema" (
    "id" BIGSERIAL NOT NULL,
    "ocurrido_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nivel" "finn"."nivel_evento" NOT NULL,
    "origen" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "datos" JSONB,

    CONSTRAINT "eventos_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."estado_respaldo" (
    "id" SMALLINT NOT NULL DEFAULT 1,
    "ultimo_respaldo_en" TIMESTAMPTZ(6),
    "ultimo_respaldo_objeto" TEXT,
    "ultima_restauracion_en" TIMESTAMPTZ(6),

    CONSTRAINT "estado_respaldo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finn"."token_webhook" (
    "id" SMALLINT NOT NULL DEFAULT 1,
    "hash_sha256" TEXT NOT NULL,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_webhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ux_vigencias_rige_desde" ON "finn"."vigencias_ciclo"("rige_desde");

-- CreateIndex
CREATE UNIQUE INDEX "ux_cuentas_id_tipo" ON "finn"."cuentas"("id", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "ux_cuentas_institucion_ultimos4" ON "finn"."cuentas"("institucion_id", "ultimos4");

-- CreateIndex
CREATE UNIQUE INDEX "ux_tarjetas_cuenta_tipo" ON "finn"."tarjetas"("cuenta_id", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "ux_prestamos_cuenta_tipo" ON "finn"."prestamos"("cuenta_id", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "ux_inversiones_cuenta_tipo" ON "finn"."inversiones"("cuenta_id", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "ux_grupos_clave_sistema" ON "finn"."grupos"("clave_sistema");

-- CreateIndex
CREATE UNIQUE INDEX "ux_categorias_tarjeta" ON "finn"."categorias"("tarjeta_id");

-- CreateIndex
CREATE INDEX "ix_categorias_grupo" ON "finn"."categorias"("grupo_id");

-- CreateIndex
CREATE INDEX "ix_asignaciones_periodo" ON "finn"."asignaciones"("periodo_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "ux_asignaciones_categoria_periodo" ON "finn"."asignaciones"("categoria_id", "periodo_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "ux_transacciones_secuencia" ON "finn"."transacciones"("secuencia");

-- CreateIndex
CREATE INDEX "ix_transacciones_fecha" ON "finn"."transacciones"("fecha");

-- CreateIndex
CREATE INDEX "ix_transacciones_conciliacion" ON "finn"."transacciones"("conciliacion_id");

-- CreateIndex
CREATE INDEX "ix_transacciones_linea_cobrada" ON "finn"."transacciones"("linea_cobrada_id");

-- CreateIndex
CREATE INDEX "ix_efectos_cuenta" ON "finn"."efectos"("cuenta_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_efectos_transaccion_cuenta" ON "finn"."efectos"("transaccion_id", "cuenta_id");

-- CreateIndex
CREATE INDEX "ix_lineas_categoria" ON "finn"."lineas"("categoria_id");

-- CreateIndex
CREATE INDEX "ix_lineas_deudor" ON "finn"."lineas"("deudor_id");

-- CreateIndex
CREATE INDEX "ix_lineas_original" ON "finn"."lineas"("linea_original_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_lineas_transaccion_orden" ON "finn"."lineas"("transaccion_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "ux_condonaciones_secuencia" ON "finn"."condonaciones"("secuencia");

-- CreateIndex
CREATE INDEX "ix_condonaciones_linea" ON "finn"."condonaciones"("linea_id");

-- CreateIndex
CREATE INDEX "ix_condonaciones_categoria" ON "finn"."condonaciones"("categoria_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_metas_categoria" ON "finn"."metas"("categoria_id");

-- CreateIndex
CREATE INDEX "ix_sms_recibidos_recibido" ON "finn"."sms_recibidos"("recibido_en");

-- CreateIndex
CREATE INDEX "ix_procesamientos_formato" ON "finn"."sms_procesamientos"("formato_id");

-- CreateIndex
CREATE INDEX "ix_procesamientos_cuenta" ON "finn"."sms_procesamientos"("cuenta_id");

-- CreateIndex
CREATE INDEX "ix_procesamientos_programada" ON "finn"."sms_procesamientos"("esperada_programada_id");

-- CreateIndex
CREATE INDEX "ix_procesamientos_dup_transaccion" ON "finn"."sms_procesamientos"("duplicado_transaccion_id");

-- CreateIndex
CREATE INDEX "ix_procesamientos_dup_movimiento" ON "finn"."sms_procesamientos"("duplicado_movimiento_id");

-- CreateIndex
CREATE INDEX "ix_procesamientos_categoria" ON "finn"."sms_procesamientos"("categoria_sugerida_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_procesamientos_sms_intento" ON "finn"."sms_procesamientos"("sms_id", "intento");

-- CreateIndex
CREATE UNIQUE INDEX "ux_movimientos_sms" ON "finn"."movimientos"("sms_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_movimientos_transaccion" ON "finn"."movimientos"("transaccion_id");

-- CreateIndex
CREATE INDEX "ix_movimientos_estado" ON "finn"."movimientos"("estado");

-- CreateIndex
CREATE INDEX "ix_movimientos_cuenta_fecha" ON "finn"."movimientos"("cuenta_id", "fecha");

-- CreateIndex
CREATE INDEX "ix_movimientos_esperada" ON "finn"."movimientos"("esperada_programada_id", "esperada_fecha");

-- CreateIndex
CREATE INDEX "ix_movimientos_dup_transaccion" ON "finn"."movimientos"("duplicado_transaccion_id");

-- CreateIndex
CREATE INDEX "ix_movimientos_dup_movimiento" ON "finn"."movimientos"("duplicado_movimiento_id");

-- CreateIndex
CREATE INDEX "ix_movimiento_lineas_categoria" ON "finn"."movimiento_lineas"("categoria_id");

-- CreateIndex
CREATE INDEX "ix_movimiento_lineas_deudor" ON "finn"."movimiento_lineas"("deudor_id");

-- CreateIndex
CREATE INDEX "ix_movimiento_lineas_original" ON "finn"."movimiento_lineas"("linea_original_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_movimiento_lineas_orden" ON "finn"."movimiento_lineas"("movimiento_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "ux_formatos_institucion_nombre" ON "finn"."formatos_bancarios"("institucion_id", "nombre");

-- CreateIndex
CREATE INDEX "ix_reglas_categoria" ON "finn"."reglas_comercio"("categoria_id");

-- CreateIndex
CREATE INDEX "ix_programadas_cuenta" ON "finn"."programadas"("cuenta_id");

-- CreateIndex
CREATE INDEX "ix_programadas_cuenta_destino" ON "finn"."programadas"("cuenta_destino_id");

-- CreateIndex
CREATE INDEX "ix_programada_lineas_categoria" ON "finn"."programada_lineas"("categoria_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_programada_lineas_orden" ON "finn"."programada_lineas"("programada_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "ux_ocurrencias_transaccion" ON "finn"."ocurrencias_resueltas"("transaccion_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_ocurrencias_programada_fecha" ON "finn"."ocurrencias_resueltas"("programada_id", "fecha_esperada");

-- CreateIndex
CREATE INDEX "ix_conciliaciones_cuenta" ON "finn"."conciliaciones"("cuenta_id", "terminada_en");

-- CreateIndex
CREATE INDEX "ix_cambios_conciliacion" ON "finn"."cambios_posteriores"("conciliacion_id");

-- CreateIndex
CREATE INDEX "ix_cambios_transaccion" ON "finn"."cambios_posteriores"("transaccion_id");

-- CreateIndex
CREATE INDEX "ix_eliminaciones_revision" ON "finn"."eliminaciones"("revision");

-- CreateIndex
CREATE UNIQUE INDEX "ux_suscripciones_endpoint" ON "finn"."suscripciones_push"("endpoint");

-- CreateIndex
CREATE INDEX "ix_notificaciones_creada" ON "finn"."notificaciones"("creada_en");

-- CreateIndex
CREATE INDEX "ix_eventos_ocurrido" ON "finn"."eventos_sistema"("ocurrido_en");

-- AddForeignKey
ALTER TABLE "finn"."cuentas" ADD CONSTRAINT "fk_cuentas_institucion" FOREIGN KEY ("institucion_id") REFERENCES "finn"."instituciones"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."tarjetas" ADD CONSTRAINT "fk_tarjetas_cuenta" FOREIGN KEY ("cuenta_id", "tipo") REFERENCES "finn"."cuentas"("id", "tipo") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."prestamos" ADD CONSTRAINT "fk_prestamos_cuenta" FOREIGN KEY ("cuenta_id", "tipo") REFERENCES "finn"."cuentas"("id", "tipo") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."inversiones" ADD CONSTRAINT "fk_inversiones_cuenta" FOREIGN KEY ("cuenta_id", "tipo") REFERENCES "finn"."cuentas"("id", "tipo") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."categorias" ADD CONSTRAINT "fk_categorias_grupo" FOREIGN KEY ("grupo_id") REFERENCES "finn"."grupos"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."categorias" ADD CONSTRAINT "fk_categorias_tarjeta" FOREIGN KEY ("tarjeta_id") REFERENCES "finn"."tarjetas"("cuenta_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."asignaciones" ADD CONSTRAINT "fk_asignaciones_categoria" FOREIGN KEY ("categoria_id") REFERENCES "finn"."categorias"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."transacciones" ADD CONSTRAINT "fk_transacciones_conciliacion" FOREIGN KEY ("conciliacion_id") REFERENCES "finn"."conciliaciones"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."transacciones" ADD CONSTRAINT "fk_transacciones_linea_cobrada" FOREIGN KEY ("linea_cobrada_id") REFERENCES "finn"."lineas"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."efectos" ADD CONSTRAINT "fk_efectos_transaccion" FOREIGN KEY ("transaccion_id") REFERENCES "finn"."transacciones"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."efectos" ADD CONSTRAINT "fk_efectos_cuenta" FOREIGN KEY ("cuenta_id") REFERENCES "finn"."cuentas"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."lineas" ADD CONSTRAINT "fk_lineas_transaccion" FOREIGN KEY ("transaccion_id") REFERENCES "finn"."transacciones"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."lineas" ADD CONSTRAINT "fk_lineas_categoria" FOREIGN KEY ("categoria_id") REFERENCES "finn"."categorias"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."lineas" ADD CONSTRAINT "fk_lineas_deudor" FOREIGN KEY ("deudor_id") REFERENCES "finn"."deudores"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."lineas" ADD CONSTRAINT "fk_lineas_linea_original" FOREIGN KEY ("linea_original_id") REFERENCES "finn"."lineas"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."condonaciones" ADD CONSTRAINT "fk_condonaciones_linea" FOREIGN KEY ("linea_id") REFERENCES "finn"."lineas"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."condonaciones" ADD CONSTRAINT "fk_condonaciones_categoria" FOREIGN KEY ("categoria_id") REFERENCES "finn"."categorias"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."metas" ADD CONSTRAINT "fk_metas_categoria" FOREIGN KEY ("categoria_id") REFERENCES "finn"."categorias"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."sms_procesamientos" ADD CONSTRAINT "fk_procesamientos_sms" FOREIGN KEY ("sms_id") REFERENCES "finn"."sms_recibidos"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."sms_procesamientos" ADD CONSTRAINT "fk_procesamientos_formato" FOREIGN KEY ("formato_id") REFERENCES "finn"."formatos_bancarios"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."sms_procesamientos" ADD CONSTRAINT "fk_procesamientos_cuenta" FOREIGN KEY ("cuenta_id") REFERENCES "finn"."cuentas"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."sms_procesamientos" ADD CONSTRAINT "fk_procesamientos_programada" FOREIGN KEY ("esperada_programada_id") REFERENCES "finn"."programadas"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."sms_procesamientos" ADD CONSTRAINT "fk_procesamientos_dup_transaccion" FOREIGN KEY ("duplicado_transaccion_id") REFERENCES "finn"."transacciones"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."sms_procesamientos" ADD CONSTRAINT "fk_procesamientos_dup_movimiento" FOREIGN KEY ("duplicado_movimiento_id") REFERENCES "finn"."movimientos"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."sms_procesamientos" ADD CONSTRAINT "fk_procesamientos_categoria" FOREIGN KEY ("categoria_sugerida_id") REFERENCES "finn"."categorias"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."movimientos" ADD CONSTRAINT "fk_movimientos_sms" FOREIGN KEY ("sms_id") REFERENCES "finn"."sms_recibidos"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."movimientos" ADD CONSTRAINT "fk_movimientos_cuenta" FOREIGN KEY ("cuenta_id") REFERENCES "finn"."cuentas"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."movimientos" ADD CONSTRAINT "fk_movimientos_dup_transaccion" FOREIGN KEY ("duplicado_transaccion_id") REFERENCES "finn"."transacciones"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."movimientos" ADD CONSTRAINT "fk_movimientos_dup_movimiento" FOREIGN KEY ("duplicado_movimiento_id") REFERENCES "finn"."movimientos"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."movimientos" ADD CONSTRAINT "fk_movimientos_programada" FOREIGN KEY ("esperada_programada_id") REFERENCES "finn"."programadas"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."movimientos" ADD CONSTRAINT "fk_movimientos_transaccion" FOREIGN KEY ("transaccion_id") REFERENCES "finn"."transacciones"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."movimiento_lineas" ADD CONSTRAINT "fk_movimiento_lineas_movimiento" FOREIGN KEY ("movimiento_id") REFERENCES "finn"."movimientos"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."movimiento_lineas" ADD CONSTRAINT "fk_movimiento_lineas_categoria" FOREIGN KEY ("categoria_id") REFERENCES "finn"."categorias"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."movimiento_lineas" ADD CONSTRAINT "fk_movimiento_lineas_deudor" FOREIGN KEY ("deudor_id") REFERENCES "finn"."deudores"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."movimiento_lineas" ADD CONSTRAINT "fk_movimiento_lineas_linea_original" FOREIGN KEY ("linea_original_id") REFERENCES "finn"."lineas"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."formatos_bancarios" ADD CONSTRAINT "fk_formatos_institucion" FOREIGN KEY ("institucion_id") REFERENCES "finn"."instituciones"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."reglas_comercio" ADD CONSTRAINT "fk_reglas_categoria" FOREIGN KEY ("categoria_id") REFERENCES "finn"."categorias"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."programadas" ADD CONSTRAINT "fk_programadas_cuenta" FOREIGN KEY ("cuenta_id") REFERENCES "finn"."cuentas"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."programadas" ADD CONSTRAINT "fk_programadas_cuenta_destino" FOREIGN KEY ("cuenta_destino_id") REFERENCES "finn"."cuentas"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."programada_lineas" ADD CONSTRAINT "fk_programada_lineas_programada" FOREIGN KEY ("programada_id") REFERENCES "finn"."programadas"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."programada_lineas" ADD CONSTRAINT "fk_programada_lineas_categoria" FOREIGN KEY ("categoria_id") REFERENCES "finn"."categorias"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."ocurrencias_resueltas" ADD CONSTRAINT "fk_ocurrencias_programada" FOREIGN KEY ("programada_id") REFERENCES "finn"."programadas"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."ocurrencias_resueltas" ADD CONSTRAINT "fk_ocurrencias_transaccion" FOREIGN KEY ("transaccion_id") REFERENCES "finn"."transacciones"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."conciliaciones" ADD CONSTRAINT "fk_conciliaciones_cuenta" FOREIGN KEY ("cuenta_id") REFERENCES "finn"."cuentas"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."cambios_posteriores" ADD CONSTRAINT "fk_cambios_conciliacion" FOREIGN KEY ("conciliacion_id") REFERENCES "finn"."conciliaciones"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "finn"."cambios_posteriores" ADD CONSTRAINT "fk_cambios_transaccion" FOREIGN KEY ("transaccion_id") REFERENCES "finn"."transacciones"("id") ON DELETE SET NULL ON UPDATE RESTRICT;
