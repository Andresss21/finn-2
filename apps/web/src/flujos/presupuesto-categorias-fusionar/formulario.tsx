'use client';
// `/presupuesto/categorias/[categoriaId]/fusionar` (FT-20, OP-12; 05 §2.3, §4.4): el flujo largo de fusionar una categoría en
// otra. Muestra el resumen de lo que se mueve, deja elegir el destino, previsualiza y confirma siempre (AV-13, AV-01). El
// impacto (Δ Listo para asignar, Δ Disponible del destino y lo que suma cada período) lo dice el servidor: no se calcula acá (PF-3).
import type { Centavos } from '@finn/dominio/valores';
import { useCallback } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { SeleccionNativa, type OpcionNativa } from '../../componentes/base/seleccion-nativa';
import { ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearFechaTexto, formatearMonto } from '../../formato';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { categoriasFusionar as t } from '../../textos/categorias-fusionar';
import { formularios } from '../../textos/formularios';

export interface PropsFormularioFusionar {
  /** `fusionarCategorias` (OP-12): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly origen: { readonly id: string; readonly nombre: string };
  readonly destinos: readonly { readonly id: string; readonly nombre: string }[];
  readonly resumen: {
    readonly periodosConAsignacion: number;
    readonly transacciones: number;
    readonly condonaciones: number;
    readonly programadas: number;
    readonly reglas: number;
    readonly meta?: unknown;
  };
}

interface Campos {
  destino: string;
}
interface Cruda extends Campos {
  modo: string;
  revisionVista?: string;
  huellaImpacto?: string;
}
interface Vista {
  readonly impacto?: {
    readonly deltaLpa: Centavos;
    readonly deltaDisponible?: readonly {
      readonly categoriaId: string;
      readonly delta: Centavos;
    }[];
  } | null;
  readonly avisos?: readonly {
    readonly codigo: string;
    readonly datos?: Readonly<Record<string, string | number | boolean>>;
  }[];
  readonly rechazos?: readonly { readonly codigo: string }[];
}

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const PREFIJO = 'asignado:';
const ID_FORMULARIO = 'formulario-fusionar';
const CONTRATO = z.object({ destino: z.string().min(1, { error: t.destino }) });
const conSigno = (c: Centavos): string => `${c > 0 ? '+' : ''}${formatearMonto(c)}`;

export function FormularioFusionar(p: PropsFormularioFusionar) {
  const { accion, origen, destinos, resumen } = p;
  const enviar = useCallback<AccionEscritura>(
    (payload) => {
      const { modo, revisionVista, huellaImpacto, destino } = payload as Cruda;
      return accion({
        origenId: origen.id,
        destinoId: destino,
        modo,
        ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
      });
    },
    [accion, origen.id],
  );
  const operacion = useOperacion({ accion: enviar, previsualizarPrimero: true });
  const formulario = useFormularioFinn<Campos>({
    contrato: CONTRATO,
    valoresIniciales: { destino: '' },
    operacion,
  });
  const { estado, error: fallo } = operacion;
  const c = formulario.watch();
  const destino = destinos.find((d) => d.id === c.destino);
  const vista = (operacion.previsualizacion ?? {}) as Vista;
  const rutaPadre = `/presupuesto/categorias/${c.destino === '' ? origen.id : c.destino}`;

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={rutaPadre}>
        <p role="status">{t.listo}</p>
        <CerrarFlujoAlMontar rutaPadre={rutaPadre} />
      </PaginaFlujoDeRuta>
    );

  if (estado === 'confirmando') {
    const rechazo = vista.rechazos?.[0];
    const nombre = destino?.nombre ?? '';
    const av13 = vista.avisos?.find((a) => a.codigo === 'AV-13');
    const periodos = Object.entries(av13?.datos ?? {})
      .filter(([k]) => k.startsWith(PREFIJO))
      .sort(([a], [b]) => (a < b ? -1 : 1));
    const disponible = vista.impacto?.deltaDisponible?.find((x) => x.categoriaId === c.destino);
    const lineas = [
      ...(vista.impacto && vista.impacto.deltaLpa !== 0
        ? [t.deltaLpa(conSigno(vista.impacto.deltaLpa))]
        : []),
      ...(disponible === undefined ? [] : [t.deltaDisponible(nombre, conSigno(disponible.delta))]),
      ...periodos.map(([k, v]) =>
        t.deltaPeriodo(
          formatearFechaTexto(k.slice(PREFIJO.length)),
          nombre,
          conSigno(v as Centavos),
        ),
      ),
      ...(typeof av13?.datos?.['metaDescartada'] === 'string'
        ? [t.metaDescartada(origen.nombre)]
        : []),
    ];
    return (
      <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={rutaPadre}>
        {rechazo === undefined ? (
          <ConfirmacionImpacto
            titulo={t.revisar}
            impacto={lineas.length === 0 ? [t.sinCambios] : lineas}
            avisos={vista.avisos?.some((a) => a.codigo === 'AV-01') ? [t.periodoCerrado] : []}
            textoConfirmar={t.confirmar}
            textoVolver={t.volverAEditar}
            enviando={false}
            alConfirmar={() => void operacion.confirmar()}
            alVolver={operacion.volverAEditar}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <AvisoEnLinea estado="problema" aparecioDespues>
              {t.rechazos.otro}
            </AvisoEnLinea>
            <Boton variante="secundaria" onClick={operacion.volverAEditar}>
              {t.volverAEditar}
            </Boton>
          </div>
        )}
      </PaginaFlujoDeRuta>
    );
  }

  const opciones: readonly OpcionNativa[] = destinos.map((d) => ({
    valor: d.id,
    etiqueta: d.nombre,
  }));
  const filas = [
    t.periodos(resumen.periodosConAsignacion),
    t.transacciones(resumen.transacciones),
    t.condonaciones(resumen.condonaciones),
    t.programadas(resumen.programadas),
    t.reglas(resumen.reglas),
  ];
  return (
    <PaginaFlujoDeRuta
      titulo={t.titulo}
      rutaPadre={`/presupuesto/categorias/${origen.id}`}
      {...(destinos.length === 0
        ? {}
        : {
            acciones: (
              <div className="w-full md:ml-auto md:w-[calc(50%-1.125rem)]">
                <Boton
                  tipo="submit"
                  form={ID_FORMULARIO}
                  variante="peligro"
                  className="w-full"
                  enviando={estado === 'enviando'}
                  textoEnviando={t.fusionando}
                  deshabilitado={!operacion.enLinea}
                  {...(operacion.motivoSinEnvio === undefined
                    ? {}
                    : { motivoDeshabilitado: operacion.motivoSinEnvio })}
                >
                  {t.fusionar}
                </Boton>
              </div>
            ),
          })}
    >
      {destinos.length === 0 ? (
        <AvisoEnLinea estado="informacion">{t.sinDestinos}</AvisoEnLinea>
      ) : (
        <form
          id={ID_FORMULARIO}
          onSubmit={(e) => void formulario.enviar(e)}
          noValidate
          className="flex flex-col gap-5"
        >
          <SeleccionNativa
            alta
            marcador={t.destino}
            etiqueta={t.destino}
            opciones={opciones}
            valor={c.destino}
            alCambiar={(v) => {
              formulario.setValue('destino', v, { shouldDirty: true });
            }}
            {...(formulario.formState.errors.destino?.message === undefined
              ? {}
              : { error: formulario.formState.errors.destino.message })}
          />
          <section aria-labelledby="fusion-resumen" className="flex flex-col gap-2.5">
            <h2 id="fusion-resumen" className="text-titulo-seccion">
              {t.resumenTitulo}
            </h2>
            <ul className="divide-y divide-borde-sutil rounded-contenedor bg-superficie px-4 py-1 shadow-elevacion-1">
              {filas.map((f) => (
                <li key={f} className="py-2.5 text-texto-secundario">
                  {f}
                </li>
              ))}
            </ul>
          </section>
          {resumen.meta === undefined ? null : (
            <AvisoEnLinea estado="advertencia">{t.metaDescartada(origen.nombre)}</AvisoEnLinea>
          )}
          <AvisoEnLinea estado="informacion">{t.intro(origen.nombre)}</AvisoEnLinea>
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
      )}
    </PaginaFlujoDeRuta>
  );
}
