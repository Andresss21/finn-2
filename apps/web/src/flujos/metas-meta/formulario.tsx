'use client';
// `/metas/[metaId]` (FT-17, OP-18 editar y eliminar; 05 §2.3): el flujo corto de cambiar el monto, el modo o la fecha de una
// meta, o de eliminarla; con «Extender la fecha» y «Ajustar el monto» si venció. Es el formulario de `/metas/nueva` sin el tipo
// ni la categoría. Envía solo lo que cambió, con lo que vio la persona como `esperado` (4.6.2). No calcula montos (PF-3).
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import { useCallback, useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { SelectorSegmentado } from '../../componentes/base/selector-segmentado';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { centavosATextoDecimal, formatearFecha } from '../../formato';
import { normalizarMontoEscrito, sumarMontosEscritos } from '../../formularios/normalizar-monto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { gestionarMeta } from '../../servidor/acciones/presupuesto';
import { formularios } from '../../textos/formularios';
import { metas as t } from '../../textos/metas';
import {
  CONTRATO,
  enSuCampo,
  opciones,
  REINTENTABLES,
  type Campos,
} from '../metas-nueva/formulario';

export interface MetaParaEditar {
  readonly id: string;
  readonly categoria: string;
  readonly tipo: 'mensual' | 'semanal' | 'anual' | 'para_fecha';
  readonly modoMeta?: 'acumular' | 'rellenar_hasta';
  readonly monto: Centavos;
  /** La fecha guardada: una anual sin fecha propia no la tiene. */
  readonly fechaObjetivo: string | null;
  readonly vencida: boolean;
}
type Esperado = Record<string, string | null>;
type Cruda = Campos & { modo: string; esperado: Esperado };

const RUTA_PADRE = '/metas';
const enfocar = (nombre: string) => () => {
  document.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)?.focus();
};

function Cuerpo(p: {
  readonly meta: MetaParaEditar;
  readonly inicial: Campos;
  readonly esperado: Esperado;
  readonly alUsarActual: (actuales: Record<string, unknown>, escrito: Campos) => void;
}) {
  const { meta, inicial } = p;
  const enviar = useCallback<AccionEscritura>(
    (payload) => {
      const { modo, esperado, ...c } = payload as Cruda;
      const r = normalizarMontoEscrito(c.monto);
      const monto = r.estado === 'valido' ? r.texto : c.monto;
      const porPeriodo = meta.tipo === 'mensual' || meta.tipo === 'semanal';
      return gestionarMeta({
        accion: 'editar',
        metaId: meta.id,
        modo,
        esperado,
        ...(sumarMontosEscritos([monto]) !== sumarMontosEscritos([esperado['monto'] ?? ''])
          ? { monto }
          : {}),
        ...(porPeriodo && c.modoMeta !== esperado['modoMeta'] ? { modoMeta: c.modoMeta } : {}),
        ...(!porPeriodo && c.fechaObjetivo !== '' && c.fechaObjetivo !== esperado['fechaObjetivo']
          ? { fechaObjetivo: c.fechaObjetivo }
          : {}),
      });
    },
    [meta.id, meta.tipo],
  );
  const operacion = useOperacion({ accion: enviar, esperado: p.esperado });
  const formulario = useFormularioFinn<Campos>({
    contrato: CONTRATO,
    valoresIniciales: inicial,
    operacion,
  });
  const enviarBaja = useCallback<AccionEscritura>(
    (payload) =>
      gestionarMeta({
        accion: 'eliminar',
        metaId: meta.id,
        modo: (payload as { modo: string }).modo,
      }),
    [meta.id],
  );
  const baja = useOperacion({ accion: enviarBaja });
  const [confirmando, setConfirmando] = useState(false);
  const c = formulario.watch();
  const { errors } = formulario.formState;
  const porPeriodo = meta.tipo === 'mensual' || meta.tipo === 'semanal';
  const esp = p.esperado;
  const hayCambio =
    sumarMontosEscritos([c.monto]) !== sumarMontosEscritos([esp['monto'] ?? '']) ||
    (porPeriodo
      ? c.modoMeta !== esp['modoMeta']
      : c.fechaObjetivo !== (esp['fechaObjetivo'] ?? ''));
  const poner = (n: keyof Campos) => (valor: string) => {
    formulario.setValue(n, valor, {
      shouldDirty: true,
      shouldValidate: formulario.formState.isSubmitted,
    });
  };
  const { estado, error: fallo } = operacion;
  const actuales = fallo?.datos?.['actuales'] as Record<string, unknown> | undefined;
  const conflicto = fallo?.codigo === 'conflicto_desactualizado' && actuales !== undefined;

  if (estado === 'listo' || baja.estado === 'listo')
    return (
      <PaginaFlujoDeRuta
        titulo={baja.estado === 'listo' ? t.eliminada : t.guardada}
        rutaPadre={RUTA_PADRE}
      >
        <CerrarFlujoAlMontar rutaPadre={RUTA_PADRE} />
      </PaginaFlujoDeRuta>
    );

  const motivo = !operacion.enLinea
    ? operacion.motivoSinEnvio
    : hayCambio
      ? undefined
      : t.sinCambios;
  return (
    <PaginaFlujoDeRuta titulo={t.tituloEditar(meta.categoria)} rutaPadre={RUTA_PADRE}>
      <form onSubmit={(e) => void formulario.enviar(e)} noValidate className="flex flex-col gap-5">
        {meta.vencida ? (
          <AvisoEnLinea
            estado="advertencia"
            titulo={t.vencida.titulo}
            accion={
              <span className="flex flex-wrap gap-2">
                {meta.tipo === 'para_fecha' || meta.tipo === 'anual' ? (
                  <Boton variante="secundaria" onClick={enfocar('fechaObjetivo')}>
                    {t.vencida.extender}
                  </Boton>
                ) : null}
                <Boton variante="secundaria" onClick={enfocar('monto')}>
                  {t.vencida.ajustar}
                </Boton>
              </span>
            }
          >
            {t.vencida.texto(meta.categoria, formatearFecha(meta.fechaObjetivo ?? ''))}
          </AvisoEnLinea>
        ) : null}
        <p className="text-cuerpo-pequeno text-texto-secundario">
          {t.tipo}: {t.tipos[meta.tipo]}
        </p>
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
            etiqueta={meta.tipo === 'anual' ? t.fechaObjetivoAnual : t.fechaObjetivo}
            valor={c.fechaObjetivo as FechaLocal}
            alCambiar={poner('fechaObjetivo')}
            error={errors.fechaObjetivo?.message}
            requerido={meta.tipo === 'para_fecha'}
          />
        )}
        {estado === 'error' && fallo !== undefined && !enSuCampo(fallo) ? (
          <AvisoEnLinea
            estado="problema"
            aparecioDespues
            {...(conflicto || REINTENTABLES.includes(fallo.categoria)
              ? {
                  accion: (
                    <Boton
                      variante="secundaria"
                      onClick={() => {
                        if (conflicto) p.alUsarActual(actuales, formulario.getValues());
                        else void operacion.reintentar();
                      }}
                    >
                      {conflicto ? formularios.usarValorActual : formularios.intentarDeNuevo}
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
          textoEnviando={t.guardando}
          deshabilitado={motivo !== undefined}
          {...(motivo === undefined ? {} : { motivoDeshabilitado: motivo })}
        >
          {t.guardar}
        </Boton>
      </form>
      <div className="mt-8 flex flex-col gap-3">
        {baja.estado === 'error' && baja.error !== undefined ? (
          <AvisoEnLinea estado="problema" aparecioDespues>
            {baja.error.mensaje}
          </AvisoEnLinea>
        ) : null}
        {confirmando ? (
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
                  setConfirmando(false);
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
              setConfirmando(true);
            }}
          >
            {t.eliminar}
          </Boton>
        )}
      </div>
    </PaginaFlujoDeRuta>
  );
}

export function FormularioMetaEditar({ meta }: { readonly meta: MetaParaEditar }) {
  // "Usar el valor actual" (05 §4.7): `esperado` pasa a lo que hay ahora, con el monto de Centavos a texto decimal, y se conserva
  // lo escrito. `useOperacion` copia `esperado` una sola vez, así que el cuerpo se vuelve a montar con la copia nueva.
  const [base, setBase] = useState<{ esperado: Esperado; inicial: Campos; version: number }>({
    esperado: {
      monto: centavosATextoDecimal(meta.monto),
      ...(meta.modoMeta === undefined ? {} : { modoMeta: meta.modoMeta }),
      fechaObjetivo: meta.fechaObjetivo,
    },
    inicial: {
      categoriaId: meta.id,
      tipo: meta.tipo,
      modoMeta: meta.modoMeta ?? 'acumular',
      monto: centavosATextoDecimal(meta.monto),
      fechaObjetivo: meta.fechaObjetivo ?? '',
    },
    version: 0,
  });
  return (
    <Cuerpo
      key={base.version}
      meta={meta}
      esperado={base.esperado}
      inicial={base.inicial}
      alUsarActual={(actuales, escrito) => {
        const { monto, ...resto } = actuales;
        setBase((b) => ({
          esperado: {
            ...b.esperado,
            ...(resto as Esperado),
            ...(typeof monto === 'number'
              ? { monto: centavosATextoDecimal(monto as Centavos) }
              : {}),
          },
          inicial: escrito,
          version: b.version + 1,
        }));
      }}
    />
  );
}
