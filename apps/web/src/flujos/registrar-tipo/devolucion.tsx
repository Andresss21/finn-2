'use client';
// `/registrar/devolucion` (FT-28, OP-33; 05 §2.4): buscar la compra original con la lectura interactiva de CP-3 y, al elegirla,
// seguir en `/actividad/[transaccionId]/devolver` (OP-33a); sin compra, la devolución a una cuenta y una categoría (OP-33b). Se
// guarda en un solo viaje (05 §4.4); con la fecha en un período cerrado el servidor pide confirmar (AV-01). No calcula montos
// (PF-3): lo que queda de cada compra viene del DTO.
import type { LimitesDeFecha } from '../../formularios/limites-de-fecha';
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { Resultado } from '../../componentes/base/resultado';
import { SeleccionNativa, type OpcionNativa } from '../../componentes/base/seleccion-nativa';
import { Monto } from '../../componentes/dominio/monto';
import type { VistaDeImpacto } from '../../componentes/formularios/lineas-impacto';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearFecha, formatearMontoTexto } from '../../formato';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useLecturaInteractiva } from '../../formularios/use-lectura-interactiva';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { formularios } from '../../textos/formularios';
import { registrarDevolucion as t } from '../../textos/registrar-devolucion';

const ConfirmacionImpacto = lazy(() =>
  import('../../componentes/formularios/confirmacion-impacto-de-vista').then((m) => ({
    default: m.ConfirmacionImpactoDeVista,
  })),
);

/** Una compra con algo por devolver (04 §6.14.4): `restante` es lo que todavía admite. */
export interface CompraCandidata {
  readonly transaccionId: string;
  readonly fecha: string;
  readonly comercio: string | null;
  readonly cuenta: { readonly nombre: string };
  readonly restante: Centavos;
}

/** La lectura de CP-3 (`buscarComprasDevolucion`, `formulario({ operacion: 'devolver', busqueda })`): la pone el lector. */
export type BuscarCompras = (entrada: {
  readonly busqueda: string;
}) => Promise<ResultadoAccion<{ readonly contexto: object }>>;

/** Las candidatas del contexto de `devolver` sin compra (04 §6.14.4); con otra forma, ninguna. */
const candidatasDe = (contexto: object): readonly CompraCandidata[] =>
  'candidatas' in contexto ? (contexto.candidatas as readonly CompraCandidata[]) : [];

export interface PropsFormularioDevolucion {
  /** `devolver` (OP-33): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly buscar: BuscarCompras;
  readonly hoy: FechaLocal;
  /** [CH-260] Los límites de la fecha que da el servidor; sin ellos, hasta hoy. */
  readonly limites?: LimitesDeFecha;
  /** Las compras más recientes con algo por devolver, sin búsqueda. */
  readonly recientes: readonly CompraCandidata[];
  readonly cuentas: readonly OpcionNativa[];
  readonly categorias: readonly OpcionNativa[];
}

interface Campos {
  total: string;
  fecha: string;
  cuentaId: string;
  categoriaId: string;
}

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const RUTA = '/registrar/devolucion';
const montoValido = (s: string): boolean => normalizarMontoEscrito(s).estado === 'valido';
const contrato = z.object({
  total: z.string().refine(montoValido, t.completar),
  fecha: z.string().min(1, t.completar),
  cuentaId: z.string().min(1, t.elegirCuenta),
  categoriaId: z.string().min(1, t.elegirCategoria),
});
const monto = (s: string): string => {
  const r = normalizarMontoEscrito(s);
  return r.estado === 'valido' ? r.texto : s;
};
const FILA =
  'flex min-h-14 items-center justify-between gap-3 px-4 py-2.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

function Compras({ compras }: { readonly compras: readonly CompraCandidata[] }) {
  return (
    <ul
      data-compras
      className="flex flex-col divide-y divide-borde-sutil rounded-contenedor bg-superficie shadow-elevacion-1"
    >
      {compras.map((x) => (
        <li key={x.transaccionId}>
          <EnlaceFinn
            href={`/actividad/${x.transaccionId}/devolver?volver=${encodeURIComponent(RUTA)}`}
            className={FILA}
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-semibold">{x.comercio ?? x.cuenta.nombre}</span>
              <span className="truncate text-cuerpo-pequeno text-texto-secundario">
                {formatearFecha(x.fecha)} · {x.cuenta.nombre}
              </span>
            </span>
            <span className="flex-none text-cuerpo-pequeno text-texto-secundario">
              {t.quedan} <Monto centavos={x.restante} />
            </span>
          </EnlaceFinn>
        </li>
      ))}
    </ul>
  );
}

export function FormularioDevolucion(p: PropsFormularioDevolucion) {
  const { accion, hoy, limites } = p;
  const [texto, setTexto] = useState('');
  const { buscar } = p;
  const leer = useCallback(
    async ({ texto: busqueda }: { readonly texto: string }) => {
      const r = await buscar({ busqueda });
      return r.ok ? { ...r, valor: candidatasDe(r.valor.contexto) } : r;
    },
    [buscar],
  );
  const { resultado, consultar } = useLecturaInteractiva(leer);
  useEffect(() => {
    consultar(texto);
  }, [texto, consultar]);
  const buscando = texto.trim().length >= 2 && resultado !== null;
  const compras = buscando ? resultado : p.recientes;

  const enviar: AccionEscritura = (payload) => {
    const { modo, id, revisionVista, huellaImpacto, ...escrito } = payload as Record<
      string,
      unknown
    >;
    const c = escrito as unknown as Campos;
    return accion({
      fecha: c.fecha,
      total: monto(c.total),
      cuentaId: c.cuentaId,
      categoriaId: c.categoriaId,
      modo,
      id,
      ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
    });
  };
  const operacion = useOperacion({ accion: enviar, creacion: true });
  const formulario = useFormularioFinn<Campos>({
    contrato,
    valoresIniciales: { total: '', fecha: limites?.inicial ?? hoy, cuentaId: '', categoriaId: '' },
    operacion,
  });
  const { setValue, formState } = formulario;
  const c = formulario.watch();
  const poner = (n: keyof Campos) => (valor: string) => {
    setValue(n, valor, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  const error = (n: keyof Campos): string | undefined => formState.errors[n]?.message;
  const { estado, error: fallo } = operacion;
  const vista = (operacion.previsualizacion ?? {}) as VistaDeImpacto & {
    readonly avisos?: readonly { readonly codigo: string }[];
  };

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre="/registrar">
        <div className="flex flex-col gap-4">
          <Resultado texto={t.guardada(formatearMontoTexto(c.total))} />
          <Boton
            onClick={() => {
              window.location.assign(RUTA);
            }}
          >
            {t.registrarOtra}
          </Boton>
        </div>
      </PaginaFlujoDeRuta>
    );

  if (estado === 'confirmando')
    return (
      <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre="/registrar">
        <Suspense fallback={null}>
          <ConfirmacionImpacto
            titulo={t.revisar}
            {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
            vista={vista}
            avisos={(vista.avisos ?? []).map((a) =>
              a.codigo === 'AV-01' ? t.avisoPeriodoCerrado : a.codigo,
            )}
            textoConfirmar={t.confirmar}
            textoVolver={t.volverAEditar}
            enviando={false}
            alConfirmar={() => void operacion.confirmar()}
            alVolver={operacion.volverAEditar}
          />
        </Suspense>
      </PaginaFlujoDeRuta>
    );

  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre="/registrar">
      <div className="flex flex-col gap-8">
        <section aria-labelledby="devolucion-compra" className="flex flex-col gap-3">
          <h2 id="devolucion-compra" className="text-titulo-seccion">
            {t.buscar}
          </h2>
          <EntradaTexto
            etiqueta={t.buscar}
            etiquetaOculta
            descripcion={t.buscarAyuda}
            type="search"
            autoComplete="off"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
            }}
          />
          <p className="text-rotulo text-texto-secundario">
            {buscando ? t.resultados : t.recientes}
          </p>
          {compras.length === 0 ? (
            <p className="text-cuerpo-pequeno text-texto-secundario">
              {buscando ? t.sinResultados : t.sinCompras}
            </p>
          ) : (
            <Compras compras={compras} />
          )}
        </section>

        <section aria-labelledby="devolucion-sin-compra" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="devolucion-sin-compra" className="text-titulo-seccion">
              {t.sinCompra}
            </h2>
            <p className="text-cuerpo-pequeno text-texto-secundario">{t.sinCompraAyuda}</p>
          </div>
          <form
            noValidate
            onSubmit={(e) => void formulario.enviar(e)}
            className="flex flex-col gap-5"
          >
            <EntradaMonto
              nombre="total"
              etiqueta={t.monto}
              valor={c.total}
              alCambiar={poner('total')}
              error={error('total')}
              requerido
            />
            <EntradaFecha
              nombre="fecha"
              etiqueta={t.fecha}
              valor={c.fecha as FechaLocal}
              alCambiar={poner('fecha')}
              minima={limites?.minima}
              maxima={limites?.maxima ?? hoy}
              hoy={hoy}
              error={error('fecha')}
              requerido
            />
            <SeleccionNativa
              etiqueta={t.cuenta}
              alta
              marcador={t.elegirCuenta}
              opciones={p.cuentas}
              valor={c.cuentaId}
              alCambiar={poner('cuentaId')}
              error={error('cuentaId')}
            />
            <SeleccionNativa
              etiqueta={t.categoria}
              marcador={t.elegirCategoria}
              opciones={p.categorias}
              valor={c.categoriaId}
              alCambiar={poner('categoriaId')}
              error={error('categoriaId')}
            />
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
            <Boton
              tipo="submit"
              enviando={estado === 'enviando'}
              textoEnviando={t.guardando}
              deshabilitado={!operacion.enLinea}
              {...(operacion.motivoSinEnvio === undefined
                ? {}
                : { motivoDeshabilitado: operacion.motivoSinEnvio })}
            >
              {t.guardar}
            </Boton>
          </form>
        </section>
      </div>
    </PaginaFlujoDeRuta>
  );
}
