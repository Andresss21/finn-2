'use client';
// `/bandeja/[movimientoId]` (FT-35, OP-36 y OP-37; 05 §2.5): revisar un movimiento con el texto del SMS siempre a la vista,
// elegir su categoría y aprobarlo: «Aprobar» guarda primero la categoría (OP-36) y después aprueba (OP-37); con la fecha en un
// período cerrado el servidor pide confirmar con AV-01. Flujo largo: página completa (05 §1.4). No calcula montos (PF-3).
import { lazy, Suspense, useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Resultado } from '../../componentes/base/resultado';
import { Seleccion } from '../../componentes/base/seleccion';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto } from '../../formato';
import { useOperacion } from '../../formularios/use-operacion';
import { aprobarMovimiento, editarMovimiento } from '../../servidor/acciones/bandeja';
import { bandeja as t } from '../../textos/bandeja';
import { formularios } from '../../textos/formularios';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import { textoAprobado, type ValorAprobado } from './aprobado';

export interface PropsFormularioMovimiento {
  readonly movimiento: {
    readonly id: string;
    readonly sms: string;
    readonly comercio: string | null;
    /** El monto en texto decimal, para la línea de OP-36. */
    readonly montoTexto: string | null;
    readonly tipo: string | null;
    readonly partes: number;
    readonly categoriaId: string | null;
    readonly origenId?: string;
    readonly esperado: Readonly<Record<string, unknown>>;
  };
  readonly categorias: readonly { readonly id: string; readonly nombre: string }[];
  /** Viene de la fila de la lista (05 §4.15): se vuelve a aprobar para mostrar el mensaje o la confirmación. */
  readonly traspaso: boolean;
}

interface Previsualizacion {
  readonly impacto?: { readonly deltaLpa: number } | null;
  readonly avisos?: readonly { readonly codigo: string }[];
}

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];

const ConfirmacionImpacto = lazy(() =>
  import('../../componentes/formularios/confirmacion-impacto').then((m) => ({
    default: m.ConfirmacionImpacto,
  })),
);

function TextoDelSms({ texto }: { readonly texto: string }) {
  return (
    <section aria-label={t.revisar.sms} className="flex flex-col gap-1">
      <h2 className="text-cuerpo-pequeno font-bold text-texto-secundario">{t.revisar.sms}</h2>
      <blockquote className="rounded-xl bg-superficie-hundida p-3 text-cuerpo-pequeno text-texto">
        {texto}
      </blockquote>
    </section>
  );
}

export function FormularioMovimiento({
  movimiento: m,
  categorias,
  traspaso,
}: PropsFormularioMovimiento) {
  const editar = useOperacion({ accion: editarMovimiento });
  const aprobar = useOperacion({ accion: aprobarMovimiento, creacion: true });
  const [categoriaId, setCategoriaId] = useState(m.categoriaId ?? '');
  const [recordar, setRecordar] = useState(false);
  const pendiente = useRef<Record<string, unknown> | null>(null); // la aprobación que sigue a guardar
  const { enviar: aprobarAhora } = aprobar;
  const conCategoria = m.tipo === 'gasto' && m.partes <= 1 && m.montoTexto !== null;

  const { id, origenId } = m;
  useEffect(() => {
    if (traspaso)
      void aprobarAhora({ movimientoId: id, ...(origenId === undefined ? {} : { origenId }) });
  }, [traspaso, id, origenId, aprobarAhora]);

  // Terminó de guardar la categoría: se aprueba
  useEffect(() => {
    if (editar.estado !== 'listo' || pendiente.current === null) return;
    const entrada = pendiente.current;
    pendiente.current = null;
    void aprobarAhora(entrada);
  }, [editar.estado, aprobarAhora]);

  const alAprobar = (evento: SyntheticEvent): void => {
    evento.preventDefault();
    const entrada = {
      movimientoId: id,
      ...(origenId === undefined ? {} : { origenId }),
      ...(recordar && conCategoria && categoriaId !== '' ? { recordarRegla: true } : {}),
    };
    if (!conCategoria || categoriaId === '' || categoriaId === m.categoriaId) {
      void aprobarAhora(entrada);
      return;
    }
    pendiente.current = entrada;
    void editar.enviar({
      movimientoId: id,
      lineas: [{ monto: m.montoTexto, destino: { categoriaId } }],
      esperado: m.esperado,
    });
  };

  const fallo = editar.estado === 'error' ? editar.error : aprobar.error;
  const vista = (aprobar.previsualizacion ?? {}) as Previsualizacion;

  if (aprobar.estado === 'listo' && aprobar.exito !== undefined) {
    const valor = aprobar.exito.valor as ValorAprobado;
    return (
      <PaginaFlujoDeRuta titulo={t.revisar.titulo} rutaPadre="/bandeja">
        <div className="flex flex-col gap-4">
          <Resultado
            texto={textoAprobado(valor)}
            enlace={
              <EnlaceFinn href={`/actividad/${valor.transaccionId}`}>{t.verTransaccion}</EnlaceFinn>
            }
          />
        </div>
      </PaginaFlujoDeRuta>
    );
  }

  if (aprobar.estado === 'confirmando')
    return (
      <PaginaFlujoDeRuta titulo={t.revisar.titulo} rutaPadre="/bandeja">
        <Suspense fallback={null}>
          <ConfirmacionImpacto
            titulo={t.revisar.revisarImpacto}
            {...(aprobar.impactoCambio ? { nota: formularios.impactoCambio } : {})}
            impacto={
              vista.impacto
                ? [
                    g.impactoLpa(
                      `${vista.impacto.deltaLpa > 0 ? '+' : ''}${formatearMonto(vista.impacto.deltaLpa as never)}`,
                    ),
                  ]
                : []
            }
            avisos={(vista.avisos ?? []).map((a) =>
              a.codigo === 'AV-01' ? g.avisoPeriodoCerrado : a.codigo,
            )}
            textoConfirmar={g.confirmar}
            textoVolver={g.volverAEditar}
            enviando={false}
            alConfirmar={() => void aprobar.confirmar()}
            alVolver={aprobar.volverAEditar}
          />
        </Suspense>
      </PaginaFlujoDeRuta>
    );

  return (
    <PaginaFlujoDeRuta titulo={t.revisar.titulo} rutaPadre="/bandeja">
      <form onSubmit={alAprobar} className="flex flex-col gap-5">
        <TextoDelSms texto={m.sms} />
        {conCategoria ? (
          <Seleccion
            etiqueta={t.revisar.categoria}
            opciones={categorias.map((x) => ({ valor: x.id, etiqueta: x.nombre }))}
            valor={categoriaId}
            alCambiar={setCategoriaId}
          />
        ) : null}
        {conCategoria && categoriaId !== '' && m.comercio !== null ? (
          <label className="flex min-h-11 items-center gap-3 rounded-contenedor bg-superficie px-3.5">
            <input
              type="checkbox"
              className="size-5 shrink-0"
              checked={recordar}
              onChange={(e) => {
                setRecordar(e.target.checked);
              }}
            />
            <span>{t.revisar.recordar}</span>
          </label>
        ) : null}
        {fallo === undefined ? null : (
          <AvisoEnLinea
            estado="problema"
            aparecioDespues
            {...(REINTENTABLES.includes(fallo.categoria)
              ? {
                  accion: (
                    <Boton
                      variante="secundaria"
                      onClick={() =>
                        void (editar.estado === 'error' ? editar : aprobar).reintentar()
                      }
                    >
                      {formularios.intentarDeNuevo}
                    </Boton>
                  ),
                }
              : {})}
          >
            {fallo.mensaje}
          </AvisoEnLinea>
        )}
        <Boton
          tipo="submit"
          enviando={editar.estado === 'enviando' || aprobar.estado === 'enviando'}
          textoEnviando={t.revisar.aprobando}
          deshabilitado={!aprobar.enLinea}
          {...(aprobar.motivoSinEnvio === undefined
            ? {}
            : { motivoDeshabilitado: aprobar.motivoSinEnvio })}
        >
          {t.revisar.aprobar}
        </Boton>
      </form>
    </PaginaFlujoDeRuta>
  );
}
