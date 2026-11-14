'use client';
// `/ajustes/formatos/nuevo` y `/ajustes/formatos/[formatoId]` (FT-73, OPT-05 y OPT-06; 05 §2.11, §4.11): crear, editar, activar o
// desactivar un formato y probarlo. Flujo largo con borrador; desde 1280 px, en dos columnas con «Probar con un SMS» fija (E5-10, E5-11).
// La política del patrón la aplica el servidor: sus rechazos llegan en `campos` con el texto de 04 §7.10 y se muestran en el campo que
// corrige la persona. No se eliminan: «Activo» es un interruptor de toda la fila. Al guardar, la lista muestra el resultado (E5-13).
// [C-45] Grupos de filas v3 (CAMPOS-V3 §2): los datos del formato, los separadores en segmentado, los formatos de fecha como
// casillas y «Activo» como interruptor (§8). «Guardar formato» se ve apagado mientras falte la institución, el nombre o el patrón y
// dice debajo cuántos campos corregir (§5 y §11); la política del patrón sigue siendo del servidor.
import type { ErrorFinn, ResultadoAccion } from '@finn/aplicacion/errores';
import type { SalidaProbar } from '@finn/aplicacion/operaciones/formatos';
import { useCallback, useState, type SyntheticEvent } from 'react';
import * as z from 'zod';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Campo, EntradaTexto, GrupoCampos, MensajeError } from '../../componentes/base/campo';
import { Casilla, Interruptor } from '../../componentes/base/controles-fila';
import { SeleccionNativa } from '../../componentes/base/seleccion-nativa';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { useGuardarV3 } from '../../formularios/guardar-v3';
import { useBorrador } from '../../formularios/use-borrador';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { ajustesFormatos as t } from '../../textos/ajustes-formatos';
import { formularios } from '../../textos/formularios';
import { ProbarFormato, type SmsDePrueba } from './probar';

const RUTA_PADRE = '/ajustes/formatos';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const FORMATOS_FECHA = ['AAAA/MM/DD', 'AAAAMMDD', 'AAAA-MM-DD', 'DD/MM/AAAA'] as const;
const opciones = (o: Readonly<Record<string, string>>) =>
  Object.entries(o).map(([valor, etiqueta]) => ({ valor, etiqueta }));
/** Lo obligatorio escrito; la política del patrón (grupos, banderas, lentitud) la aplica el servidor. */
const CONTRATO = z.object({
  institucionId: z.string().min(1, t.completar),
  nombre: z.string().trim().min(1, t.completar),
  patron: z.string().trim().min(1, t.completar),
});

export interface FormatoGuardado {
  readonly id: string;
  readonly institucion: { readonly id: string; readonly nombre: string };
  readonly nombre: string;
  readonly tipoMovimiento: string;
  readonly patron: string;
  readonly banderas: string;
  readonly montoSeparadorMiles: string;
  readonly montoSeparadorDecimal: string;
  readonly formatosFecha: readonly string[];
  readonly activo: boolean;
}

export interface PropsFormularioFormato {
  /** `guardarFormato` (OPT-05) y `probarFormatoContraSms` (OPT-06): las pone el lector, así el formulario se prueba sin servidor. */
  readonly guardar: AccionEscritura;
  readonly probar: (entrada: unknown) => Promise<ResultadoAccion<SalidaProbar>>;
  readonly instituciones: readonly { readonly id: string; readonly nombre: string }[];
  readonly smsParaProbar: readonly SmsDePrueba[];
  /** Con él se edita; sin él se crea (el `id` lo genera `useOperacion`). */
  readonly formato?: FormatoGuardado;
}

interface Campos {
  institucionId: string;
  nombre: string;
  tipoMovimiento: string;
  patron: string;
  banderas: string;
  montoSeparadorMiles: string;
  montoSeparadorDecimal: string;
  formatosFecha: string[];
  activo: boolean;
}

const inicial = (f: FormatoGuardado | undefined): Campos => ({
  institucionId: f?.institucion.id ?? '',
  nombre: f?.nombre ?? '',
  tipoMovimiento: f?.tipoMovimiento ?? 'compra',
  patron: f?.patron ?? '',
  banderas: f?.banderas ?? 'i',
  montoSeparadorMiles: f?.montoSeparadorMiles ?? ',',
  montoSeparadorDecimal: f?.montoSeparadorDecimal ?? '.',
  formatosFecha: [...(f?.formatosFecha ?? [])],
  activo: f?.activo ?? true,
});

/** Un rechazo cuyo mensaje ya se muestra en su campo no se repite como aviso del formulario. */
const enSuCampo = (e: ErrorFinn): boolean => Object.values(e.campos ?? {}).includes(e.mensaje);

export function FormularioFormato({
  guardar,
  probar,
  instituciones,
  smsParaProbar,
  formato,
}: PropsFormularioFormato) {
  const operacion = useOperacion({ accion: guardar, creacion: formato === undefined });
  const [valores, setValores] = useState<Campos>(() => inicial(formato));
  const borrador = useBorrador<Campos>({
    campos: valores,
    operacion,
    ...(formato === undefined ? {} : { entidad: formato.id }),
    restaurar: setValores,
    alDescartar: useCallback(() => {
      setValores(inicial(formato));
    }, [formato]),
  });
  const { estado, error: fallo } = operacion;
  const [intentos, setIntentos] = useState(0);
  const guardarV3 = useGuardarV3({
    contrato: CONTRATO,
    campos: valores,
    intentos,
    motivoSinEnvio: operacion.motivoSinEnvio,
  });
  const poner = <K extends keyof Campos>(n: K, v: Campos[K]) => {
    setValores((c) => ({ ...c, [n]: v }));
  };
  // Lo que falta se marca desde el primer intento de guardar (CAMPOS-V3 §5); el rechazo del servidor manda en su campo.
  const revision = intentos > 0 ? CONTRATO.safeParse(valores) : undefined;
  const campos: Readonly<Record<string, string>> = {
    ...Object.fromEntries(
      (revision?.error?.issues ?? []).map((i) => [String(i.path[0]), i.message]),
    ),
    ...fallo?.campos,
  };
  const err = (n: string): string | undefined => campos[n];
  const conError = (n: string): { error?: string } => {
    const m = err(n);
    return m === undefined ? {} : { error: m };
  };
  const alta = formato === undefined;
  const titulo = alta ? t.tituloNuevo : t.tituloEditar;

  if (estado === 'listo') {
    // E5-13: la lista muestra el resultado del formato guardado (`?guardado=`)
    const guardado = (operacion.exito?.valor as { formatoId?: string } | undefined)?.formatoId;
    const destino = guardado === undefined ? RUTA_PADRE : `${RUTA_PADRE}?guardado=${guardado}`;
    return (
      <PaginaFlujoDeRuta titulo={t.listo} rutaPadre={destino}>
        <CerrarFlujoAlMontar rutaPadre={destino} />
      </PaginaFlujoDeRuta>
    );
  }

  const enviar = (e: SyntheticEvent) => {
    e.preventDefault();
    setIntentos((n) => n + 1);
    if (!CONTRATO.safeParse(valores).success) return;
    void operacion.enviar({ ...valores, ...(alta ? {} : { id: formato.id }) });
  };
  const alternarFecha = (f: string) => {
    poner(
      'formatosFecha',
      valores.formatosFecha.includes(f)
        ? valores.formatosFecha.filter((x) => x !== f)
        : [...valores.formatosFecha, f],
    );
  };
  // OPT-06 prueba el formato en edición: sin `activo`, y con la primera institución si todavía no se eligió
  const paraProbar = {
    institucionId: valores.institucionId || (instituciones[0]?.id ?? ''),
    nombre: valores.nombre,
    tipoMovimiento: valores.tipoMovimiento,
    patron: valores.patron,
    banderas: valores.banderas,
    montoSeparadorMiles: valores.montoSeparadorMiles,
    montoSeparadorDecimal: valores.montoSeparadorDecimal,
    formatosFecha: valores.formatosFecha,
  };
  return (
    <PaginaFlujoDeRuta titulo={titulo} rutaPadre={RUTA_PADRE} ancha>
      <div className="flex flex-col gap-8 xl:grid xl:grid-cols-2 xl:items-start">
        <form ref={guardarV3.forma} onSubmit={enviar} noValidate className="flex flex-col gap-5">
          {borrador.recuperado ? (
            <AvisoEnLinea
              estado="informacion"
              aparecioDespues
              accion={
                <Boton variante="secundaria" onClick={borrador.descartar}>
                  {formularios.descartarBorrador}
                </Boton>
              }
            >
              {formularios.borradorRecuperado}
            </AvisoEnLinea>
          ) : null}
          <GrupoCampos>
            <SeleccionNativa
              etiqueta={t.campos.institucion}
              marcador={t.campos.elegirInstitucion}
              opciones={instituciones.map((i) => ({ valor: i.id, etiqueta: i.nombre }))}
              valor={valores.institucionId}
              alCambiar={(v) => {
                poner('institucionId', v);
              }}
              error={err('institucionId')}
            />
            <EntradaTexto
              etiqueta={t.campos.nombre}
              requerido
              autoComplete="off"
              value={valores.nombre}
              onChange={(e) => {
                poner('nombre', e.target.value);
              }}
              {...conError('nombre')}
            />
            <SeleccionNativa
              etiqueta={t.campos.tipo}
              marcador={t.campos.tipo}
              opciones={opciones(t.tipos)}
              valor={valores.tipoMovimiento}
              alCambiar={(v) => {
                poner('tipoMovimiento', v);
              }}
              error={err('tipoMovimiento')}
            />
            <Campo
              etiqueta={t.campos.patron}
              descripcion={t.campos.patronAyuda}
              requerido
              {...conError('patron')}
            >
              {(control) => (
                <textarea
                  {...control}
                  rows={4}
                  autoComplete="off"
                  spellCheck={false}
                  className="campo-entrada"
                  value={valores.patron}
                  onChange={(e) => {
                    poner('patron', e.target.value);
                  }}
                />
              )}
            </Campo>
            <EntradaTexto
              etiqueta={t.campos.banderas}
              descripcion={t.campos.banderasAyuda}
              autoComplete="off"
              spellCheck={false}
              value={valores.banderas}
              onChange={(e) => {
                poner('banderas', e.target.value);
              }}
              {...conError('banderas')}
            />
          </GrupoCampos>
          <GrupoCampos>
            {(['montoSeparadorMiles', 'montoSeparadorDecimal'] as const).map((n) => (
              <SeleccionNativa
                key={n}
                etiqueta={n === 'montoSeparadorMiles' ? t.campos.miles : t.campos.decimal}
                marcador={n === 'montoSeparadorMiles' ? t.campos.miles : t.campos.decimal}
                opciones={opciones(
                  n === 'montoSeparadorMiles' ? t.separadoresMiles : t.separadoresDecimal,
                )}
                valor={valores[n]}
                alCambiar={(v) => {
                  poner(n, v);
                }}
                error={err(n)}
              />
            ))}
          </GrupoCampos>
          <section aria-labelledby="formato-fechas" className="flex flex-col gap-2">
            <h2 id="formato-fechas" className="text-etiqueta text-texto-secundario">
              {t.campos.fechas}
            </h2>
            <p className="text-cuerpo-pequeno text-texto-secundario">{t.campos.fechasAyuda}</p>
            <GrupoCampos etiqueta={t.campos.fechas}>
              {FORMATOS_FECHA.map((f) => (
                <Casilla
                  key={f}
                  etiqueta={f}
                  marcada={valores.formatosFecha.includes(f)}
                  alCambiar={() => {
                    alternarFecha(f);
                  }}
                />
              ))}
            </GrupoCampos>
            {err('formatosFecha') === undefined ? null : (
              <MensajeError>{err('formatosFecha') ?? ''}</MensajeError>
            )}
          </section>
          <GrupoCampos>
            <Interruptor
              etiqueta={t.campos.activo}
              descripcion={t.campos.activoAyuda}
              encendido={valores.activo}
              alCambiar={(v) => {
                poner('activo', v);
              }}
            />
          </GrupoCampos>
          {estado === 'error' && fallo !== undefined && !enSuCampo(fallo) ? (
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
            className="w-full"
            {...guardarV3.boton}
          >
            {t.guardar}
          </Boton>
        </form>
        <ProbarFormato probar={probar} sms={smsParaProbar} formato={paraProbar} />
      </div>
    </PaginaFlujoDeRuta>
  );
}
