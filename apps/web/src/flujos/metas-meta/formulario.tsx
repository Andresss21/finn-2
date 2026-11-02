'use client';
// Los dos flujos cortos de las metas (FT-17, OP-18; 05 §2.3): `/metas/nueva` (crear) y `/metas/[metaId]` (editar y eliminar,
// con «Extender la fecha» y «Ajustar el monto» de una vencida). La carpeta es la del segundo flujo (05 §15.5) y la nueva la
// reutiliza. En la edición solo se envía lo que cambió, con lo que vio la persona como `esperado` (4.6.2). No calcula montos (PF-3).
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import { useCallback, useState } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Campo } from '../../componentes/base/campo';
import { SelectorSegmentado } from '../../componentes/base/selector-segmentado';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { centavosATextoDecimal } from '../../formato';
import { normalizarMontoEscrito, sumarMontosEscritos } from '../../formularios/normalizar-monto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { gestionarMeta } from '../../servidor/acciones/presupuesto';
import { formularios } from '../../textos/formularios';
import { metas as t } from '../../textos/metas';

export interface MetaParaEditar {
  readonly id: string;
  readonly categoria: string;
  readonly tipo: Tipo;
  readonly modoMeta?: Modo;
  readonly monto: Centavos;
  /** La fecha guardada: una anual sin fecha propia no la tiene. */
  readonly fechaObjetivo: string | null;
}

export interface PropsFormularioMeta {
  readonly categorias: readonly { readonly id: string; readonly nombre: string }[];
  readonly categoriaInicial?: string | undefined;
  readonly meta?: MetaParaEditar;
}

const TIPOS = ['mensual', 'semanal', 'anual', 'para_fecha'] as const;
const MODOS = ['acumular', 'rellenar_hasta'] as const;
type Tipo = (typeof TIPOS)[number];
type Modo = (typeof MODOS)[number];

const CONTRATO = z
  .object({
    categoriaId: z.string(),
    tipo: z.enum(TIPOS),
    modoMeta: z.enum(MODOS),
    monto: z.string(),
    fechaObjetivo: z.string(),
  })
  .superRefine((c, ctx) => {
    const falla = (path: string, message: string): void => {
      ctx.addIssue({ code: 'custom', path: [path], message });
    };
    const monto = normalizarMontoEscrito(c.monto);
    if (monto.estado !== 'valido') falla('monto', t.obligatorio);
    else if (monto.esCero) falla('monto', t.montoMayorACero);
    if (c.categoriaId === '') falla('categoriaId', t.obligatorio);
    if (c.tipo === 'para_fecha' && c.fechaObjetivo === '') falla('fechaObjetivo', t.obligatorio);
  });
type Campos = z.infer<typeof CONTRATO>;
type Cruda = Campos & { modo: string; id?: string; esperado?: Record<string, unknown> };

const RUTA_PADRE = '/metas';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const opciones = (m: Readonly<Record<string, string>>) =>
  Object.entries(m).map(([valor, etiqueta]) => ({ valor, etiqueta }));
const enSuCampo = (e: ErrorFinn): boolean => Object.values(e.campos ?? {}).includes(e.mensaje);
const textoMonto = (escrito: string): string => {
  const r = normalizarMontoEscrito(escrito);
  return r.estado === 'valido' ? r.texto : escrito;
};

export function FormularioMeta({ categorias, categoriaInicial, meta }: PropsFormularioMeta) {
  const editando = meta !== undefined;
  const inicial: Campos = {
    categoriaId: categorias.find((c) => c.id === categoriaInicial)?.id ?? categorias[0]?.id ?? '',
    tipo: meta?.tipo ?? 'mensual',
    modoMeta: meta?.modoMeta ?? 'acumular',
    monto: meta === undefined ? '' : centavosATextoDecimal(meta.monto),
    fechaObjetivo: meta?.fechaObjetivo ?? '',
  };

  const enviarFormulario = useCallback<AccionEscritura>(
    (payload) => {
      const c = payload as Cruda;
      const monto = textoMonto(c.monto);
      const porPeriodo = c.tipo === 'mensual' || c.tipo === 'semanal';
      if (meta === undefined)
        return gestionarMeta({
          accion: 'crear',
          id: c.id,
          modo: c.modo,
          categoriaId: c.categoriaId,
          tipo: c.tipo,
          monto,
          ...(porPeriodo ? { modoMeta: c.modoMeta } : {}),
          ...(c.fechaObjetivo === '' || porPeriodo ? {} : { fechaObjetivo: c.fechaObjetivo }),
        });
      const cambioMonto = sumarMontosEscritos([monto]) !== meta.monto;
      return gestionarMeta({
        accion: 'editar',
        metaId: meta.id,
        modo: c.modo,
        esperado: c.esperado,
        ...(cambioMonto ? { monto } : {}),
        ...(porPeriodo && c.modoMeta !== meta.modoMeta ? { modoMeta: c.modoMeta } : {}),
        ...(!porPeriodo && c.fechaObjetivo !== '' && c.fechaObjetivo !== meta.fechaObjetivo
          ? { fechaObjetivo: c.fechaObjetivo }
          : {}),
      });
    },
    [meta],
  );
  const operacion = useOperacion({
    accion: enviarFormulario,
    creacion: !editando,
    ...(meta === undefined
      ? {}
      : {
          esperado: {
            monto: centavosATextoDecimal(meta.monto),
            ...(meta.modoMeta === undefined ? {} : { modoMeta: meta.modoMeta }),
            fechaObjetivo: meta.fechaObjetivo,
          },
        }),
  });
  const formulario = useFormularioFinn<Campos>({
    contrato: CONTRATO,
    valoresIniciales: inicial,
    operacion,
  });
  const enviarBaja = useCallback<AccionEscritura>(
    (payload) =>
      gestionarMeta({
        accion: 'eliminar',
        metaId: meta?.id,
        modo: (payload as { modo: string }).modo,
      }),
    [meta?.id],
  );
  const baja = useOperacion({ accion: enviarBaja });
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);

  const c = formulario.watch();
  const { errors, isDirty } = formulario.formState;
  const poner = (n: keyof Campos) => (valor: string) => {
    formulario.setValue(n, valor, {
      shouldDirty: true,
      shouldValidate: formulario.formState.isSubmitted,
    });
  };
  const porPeriodo = c.tipo === 'mensual' || c.tipo === 'semanal';
  const { estado, error: fallo } = operacion;

  if (operacion.estado === 'listo' || baja.estado === 'listo')
    return (
      <PaginaFlujoDeRuta
        titulo={baja.estado === 'listo' ? t.eliminada : editando ? t.guardada : t.creada}
        rutaPadre={RUTA_PADRE}
      >
        <CerrarFlujoAlMontar rutaPadre={RUTA_PADRE} />
      </PaginaFlujoDeRuta>
    );

  const conflicto = fallo?.codigo === 'conflicto_desactualizado';
  const sinCambios = editando && !isDirty;
  const motivo = !operacion.enLinea
    ? operacion.motivoSinEnvio
    : sinCambios
      ? t.sinCambios
      : undefined;
  return (
    <PaginaFlujoDeRuta titulo={editando ? t.tituloEditar : t.tituloNueva} rutaPadre={RUTA_PADRE}>
      <form onSubmit={(e) => void formulario.enviar(e)} noValidate className="flex flex-col gap-5">
        {meta === undefined ? (
          <Campo
            etiqueta={t.categoria}
            requerido
            {...(errors.categoriaId?.message === undefined
              ? {}
              : { error: errors.categoriaId.message })}
          >
            {(props) => (
              <select
                {...props}
                value={c.categoriaId}
                onChange={(e) => {
                  poner('categoriaId')(e.target.value);
                }}
                className="min-h-11 rounded-control border border-borde bg-superficie px-3 text-base"
              >
                {categorias.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.nombre}
                  </option>
                ))}
              </select>
            )}
          </Campo>
        ) : (
          <p className="text-titulo-seccion">{meta.categoria}</p>
        )}
        {editando ? (
          <p data-tipo={c.tipo} className="text-cuerpo-pequeno text-texto-secundario">
            {t.tipo}: {t.tipos[c.tipo]}
          </p>
        ) : (
          <SelectorSegmentado
            etiqueta={t.tipo}
            opciones={opciones(t.tipos)}
            valor={c.tipo}
            alCambiar={poner('tipo')}
          />
        )}
        {porPeriodo ? (
          <SelectorSegmentado
            etiqueta={t.modo}
            opciones={opciones(t.modos)}
            valor={c.modoMeta}
            alCambiar={poner('modoMeta')}
          />
        ) : null}
        <EntradaMonto
          nombre="monto"
          etiqueta={t.monto}
          valor={c.monto}
          alCambiar={poner('monto')}
          error={errors.monto?.message}
          requerido
        />
        {porPeriodo ? null : (
          <EntradaFecha
            nombre="fechaObjetivo"
            etiqueta={c.tipo === 'anual' ? t.fechaObjetivoAnual : t.fechaObjetivo}
            valor={c.fechaObjetivo as FechaLocal}
            alCambiar={poner('fechaObjetivo')}
            error={errors.fechaObjetivo?.message}
            requerido={c.tipo === 'para_fecha'}
          />
        )}
        {estado === 'error' && fallo !== undefined && !enSuCampo(fallo) ? (
          <AvisoEnLinea
            estado="problema"
            aparecioDespues
            {...(conflicto
              ? {
                  accion: (
                    <Boton variante="secundaria" onClick={operacion.recargar}>
                      {t.cargarActual}
                    </Boton>
                  ),
                }
              : REINTENTABLES.includes(fallo.categoria)
                ? {
                    accion: (
                      <Boton variante="secundaria" onClick={() => void operacion.reintentar()}>
                        {formularios.intentarDeNuevo}
                      </Boton>
                    ),
                  }
                : {})}
          >
            {fallo.mensaje}
          </AvisoEnLinea>
        ) : null}
        <Boton
          tipo="submit"
          enviando={estado === 'enviando'}
          textoEnviando={editando ? t.guardando : t.creando}
          deshabilitado={motivo !== undefined}
          {...(motivo === undefined ? {} : { motivoDeshabilitado: motivo })}
        >
          {editando ? t.guardar : t.crear}
        </Boton>
      </form>
      {meta === undefined ? null : (
        <div className="mt-8 flex flex-col gap-3">
          {baja.estado === 'error' && baja.error !== undefined ? (
            <AvisoEnLinea estado="problema" aparecioDespues>
              {baja.error.mensaje}
            </AvisoEnLinea>
          ) : null}
          {confirmandoBaja ? (
            <AvisoEnLinea estado="advertencia" aparecioDespues>
              <p>{t.confirmarEliminar(meta.categoria)}</p>
              <span className="flex flex-wrap gap-2 pt-2">
                <Boton
                  variante="peligro"
                  enviando={baja.estado === 'enviando'}
                  textoEnviando={t.eliminando}
                  onClick={() => void baja.enviar({})}
                >
                  {t.siEliminar}
                </Boton>
                <Boton
                  variante="secundaria"
                  onClick={() => {
                    setConfirmandoBaja(false);
                  }}
                >
                  {t.noEliminar}
                </Boton>
              </span>
            </AvisoEnLinea>
          ) : (
            <Boton
              variante="peligro"
              onClick={() => {
                setConfirmandoBaja(true);
              }}
            >
              {t.eliminar}
            </Boton>
          )}
        </div>
      )}
    </PaginaFlujoDeRuta>
  );
}
