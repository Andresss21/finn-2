'use client';
// `/presupuesto/categorias/[categoriaId]/archivar` (FT-19, OP-09; 05 §2.3, §4.4): el flujo largo de archivar una categoría. Muestra
// lo que decide la persona (a dónde va el Disponible, con qué se cubre un sobregiro y qué pasa con cada programada), previsualiza
// y confirma. Lo que no hay que decidir no se pregunta; las asignaciones futuras siempre se devuelven (OP-09 las pide así). No
// calcula montos (PF-3): el impacto lo dice el servidor.
import type { Centavos } from '@finn/dominio/valores';
import { useCallback, useMemo } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { SeleccionNativa, type OpcionNativa } from '../../componentes/base/seleccion-nativa';
import { ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto } from '../../formato';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { categoriasArchivar as t } from '../../textos/categorias-archivar';
import { formularios } from '../../textos/formularios';

export interface PropsFormularioArchivar {
  /** `archivarCategoria` (OP-09): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly categoriaId: string;
  readonly categoria: string;
  readonly disponible: Centavos;
  readonly futuras: number;
  readonly programadas: readonly {
    readonly id: string;
    readonly comercio: string;
    readonly monto: Centavos;
  }[];
  /** Las categorías activas a las que puede ir el dinero o una programada (sin la que se archiva). */
  readonly destinos: readonly {
    readonly id: string;
    readonly nombre: string;
    readonly disponible: Centavos;
  }[];
}

interface Campos {
  destino: string;
  programadas: Record<string, string>;
}
interface Cruda extends Campos {
  modo: string;
  revisionVista?: string;
  huellaImpacto?: string;
}
interface Vista {
  readonly impacto?: { readonly deltaLpa: Centavos } | null;
  readonly rechazos?: readonly { readonly codigo: string }[];
}

const ID_FORMULARIO = 'formulario-archivar';
const LPA = 'lpa';
const DESACTIVAR = 'desactivar';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const MENSAJES: Readonly<Record<string, string | undefined>> = t.rechazos;

const aDestino = (v: string) => (v === LPA ? LPA : { categoriaId: v });

export function FormularioArchivar(p: PropsFormularioArchivar) {
  const { accion, categoriaId, disponible, futuras, programadas } = p;
  const rutaPadre = `/presupuesto/categorias/${categoriaId}`;
  // Cada programada activa pide su decisión (OP-09: `programada_sin_decision`); el servidor sigue siendo quien la exige.
  const contrato = useMemo(
    () =>
      z
        .object({ destino: z.string(), programadas: z.record(z.string(), z.string()) })
        .superRefine((c, ctx) => {
          for (const x of programadas)
            if ((c.programadas[x.id] ?? '') === '')
              ctx.addIssue({ code: 'custom', path: ['programadas', x.id], message: t.elegir });
        }),
    [programadas],
  );
  const enviar = useCallback<AccionEscritura>(
    (payload) => {
      const {
        modo,
        revisionVista,
        huellaImpacto,
        destino,
        programadas: decisiones,
      } = payload as Cruda;
      return accion({
        categoriaId,
        ...(disponible > 0 ? { destinoDisponible: aDestino(destino) } : {}),
        ...(disponible < 0 ? { cubrirSobregiroCon: aDestino(destino) } : {}),
        ...(futuras > 0 ? { devolverAsignacionesFuturas: true } : {}),
        ...(programadas.length === 0
          ? {}
          : {
              programadas: programadas.map((x) => {
                const d = decisiones[x.id] ?? DESACTIVAR;
                return d === DESACTIVAR
                  ? { programadaId: x.id, accion: 'desactivar' }
                  : { programadaId: x.id, accion: 'reasignar', categoriaId: d };
              }),
            }),
        modo,
        ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
      });
    },
    [accion, categoriaId, disponible, futuras, programadas],
  );
  const operacion = useOperacion({ accion: enviar, previsualizarPrimero: true });
  const formulario = useFormularioFinn<Campos>({
    contrato,
    valoresIniciales: { destino: LPA, programadas: {} },
    operacion,
  });
  const { estado, error: fallo } = operacion;
  const c = formulario.watch();
  const vista = (operacion.previsualizacion ?? {}) as Vista;
  const errores = formulario.formState.errors;

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={rutaPadre}>
        <p role="status">{t.listo}</p>
        <CerrarFlujoAlMontar rutaPadre={rutaPadre} />
      </PaginaFlujoDeRuta>
    );

  if (estado === 'confirmando') {
    const rechazo = vista.rechazos?.[0];
    return (
      <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={rutaPadre}>
        {rechazo === undefined ? (
          <ConfirmacionImpacto
            titulo={t.revisar}
            impacto={
              vista.impacto
                ? [
                    t.impactoLpa(
                      `${vista.impacto.deltaLpa > 0 ? '+' : ''}${formatearMonto(vista.impacto.deltaLpa)}`,
                    ),
                  ]
                : []
            }
            avisos={[]}
            textoConfirmar={t.confirmar}
            textoVolver={t.volverAEditar}
            enviando={false}
            alConfirmar={() => void operacion.confirmar()}
            alVolver={operacion.volverAEditar}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <AvisoEnLinea estado="problema" aparecioDespues>
              {MENSAJES[rechazo.codigo] ?? t.rechazos.otro}
            </AvisoEnLinea>
            <Boton variante="secundaria" onClick={operacion.volverAEditar}>
              {t.volverAEditar}
            </Boton>
          </div>
        )}
      </PaginaFlujoDeRuta>
    );
  }

  const opcionesDestino: readonly OpcionNativa[] = [
    { valor: LPA, etiqueta: t.lpa },
    ...p.destinos.map((d) => ({
      valor: d.id,
      etiqueta: d.nombre,
      detalle: t.disponibleDe(formatearMonto(d.disponible)),
    })),
  ];
  const opcionesProgramada: readonly OpcionNativa[] = [
    { valor: DESACTIVAR, etiqueta: t.desactivar },
    ...p.destinos.map((d) => ({ valor: d.id, etiqueta: t.reasignarA(d.nombre) })),
  ];
  const nada = disponible === 0 && futuras === 0 && programadas.length === 0;
  const montoTexto = formatearMonto(disponible);
  return (
    <PaginaFlujoDeRuta
      titulo={t.titulo}
      rutaPadre={rutaPadre}
      acciones={
        <div className="w-full md:ml-auto md:w-[calc(50%-1.125rem)]">
          <Boton
            tipo="submit"
            form={ID_FORMULARIO}
            className="w-full"
            enviando={estado === 'enviando'}
            textoEnviando={t.archivando}
            deshabilitado={!operacion.enLinea}
            {...(operacion.motivoSinEnvio === undefined
              ? {}
              : { motivoDeshabilitado: operacion.motivoSinEnvio })}
          >
            {t.archivar}
          </Boton>
        </div>
      }
    >
      <form
        id={ID_FORMULARIO}
        onSubmit={(e) => void formulario.enviar(e)}
        noValidate
        className="flex flex-col gap-5"
      >
        <p className="font-semibold">{p.categoria}</p>
        {nada ? <p>{t.nadaQueDecidir(p.categoria)}</p> : null}
        {disponible === 0 ? null : (
          <SeleccionNativa
            alta
            marcador={t.elegir}
            etiqueta={
              disponible > 0 ? t.destinoDisponible(montoTexto) : t.cubrirSobregiro(montoTexto)
            }
            opciones={opcionesDestino}
            valor={c.destino}
            alCambiar={(v) => {
              formulario.setValue('destino', v, { shouldDirty: true });
            }}
          />
        )}
        {futuras === 0 ? null : (
          <p data-futuras className="rounded-contenedor bg-superficie p-3.5 shadow-elevacion-1">
            {t.futuras(futuras)}
          </p>
        )}
        {programadas.map((x) => (
          <SeleccionNativa
            alta
            marcador={t.elegir}
            key={x.id}
            etiqueta={t.programada(x.comercio, formatearMonto(x.monto))}
            opciones={opcionesProgramada}
            valor={c.programadas[x.id] ?? ''}
            alCambiar={(v) => {
              formulario.setValue(`programadas.${x.id}`, v, {
                shouldDirty: true,
                shouldValidate: formulario.formState.isSubmitted,
              });
            }}
            {...(errores.programadas?.[x.id]?.message === undefined
              ? {}
              : { error: errores.programadas[x.id]?.message as string })}
          />
        ))}
        {estado === 'error' && fallo !== undefined ? (
          <AvisoEnLinea
            estado="problema"
            aparecioDespues
            {...(REINTENTABLES.includes(fallo.categoria)
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
      </form>
    </PaginaFlujoDeRuta>
  );
}
