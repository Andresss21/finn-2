'use client';
// `/reglas/[reglaId]` (FT-39, OP-41 editar y eliminar; 05 §2): corregir el patrón o la categoría de una regla, o borrarla. Es
// una pantalla hija: el título y «Volver» los pone el marco (CH-109). `esperado` es lo que vio la persona al abrir (FE-09).
import { useCallback, useState } from 'react';
import { Boton } from '../../componentes/base/boton';
import { CerrarFlujoAlMontar } from '../../componentes/navegacion/flujo-de-ruta';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { gestionarRegla } from '../../servidor/acciones/bandeja';
import { reglas as t } from '../../textos/reglas';
import {
  AvisoDeFallo,
  CamposRegla,
  CONTRATO_REGLA,
  RUTA_PADRE,
  type CamposDeRegla,
  type GrupoCategorias,
} from '../reglas-nueva/formulario';

export interface PropsFormularioReglaRegla {
  readonly regla: {
    readonly id: string;
    readonly patron: string;
    readonly categoriaId: string;
    readonly categoriaNombre: string;
    readonly categoriaArchivada: boolean;
  };
  readonly grupos: readonly GrupoCategorias[];
}

export function FormularioReglaRegla({ regla, grupos }: PropsFormularioReglaRegla) {
  const [pregunta, setPregunta] = useState(false);
  const editar = useCallback<AccionEscritura>(
    (payload) => {
      const c = payload as CamposDeRegla & { modo: string; esperado: unknown };
      return gestionarRegla({
        accion: 'editar',
        reglaId: regla.id,
        modo: c.modo,
        esperado: c.esperado,
        ...(c.patron.trim() === regla.patron ? {} : { patron: c.patron.trim() }),
        ...(c.categoriaId === regla.categoriaId ? {} : { categoriaId: c.categoriaId }),
      });
    },
    [regla],
  );
  const quitar = useCallback<AccionEscritura>(
    (payload) =>
      gestionarRegla({ accion: 'eliminar', reglaId: regla.id, ...(payload as { modo: string }) }),
    [regla.id],
  );
  const guardar = useOperacion({
    accion: editar,
    esperado: { patron: regla.patron, categoriaId: regla.categoriaId },
  });
  const eliminar = useOperacion({ accion: quitar });
  const formulario = useFormularioFinn<CamposDeRegla>({
    contrato: CONTRATO_REGLA,
    valoresIniciales: { patron: regla.patron, categoriaId: regla.categoriaId },
    operacion: guardar,
  });
  const valores = formulario.watch();

  if (guardar.estado === 'listo' || eliminar.estado === 'listo')
    return (
      <main className="mx-auto flex max-w-xl flex-col gap-3 px-5 py-4">
        <h1 className="text-titulo-pantalla">{t.tituloEditar}</h1>
        <p role="status">{eliminar.estado === 'listo' ? t.eliminada : t.guardada}</p>
        <CerrarFlujoAlMontar rutaPadre={RUTA_PADRE} />
      </main>
    );

  const repetido = guardar.error?.codigo === 'patron_repetido';
  const fallida = guardar.estado === 'error' ? guardar : eliminar;
  const fallo = repetido ? undefined : fallida.error;
  const sinCambios =
    valores.patron.trim() === regla.patron && valores.categoriaId === regla.categoriaId;
  const ocupado = guardar.estado === 'enviando' || eliminar.estado === 'enviando';
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 px-5 py-4">
      <h1 className="text-titulo-pantalla">{t.tituloEditar}</h1>
      <form onSubmit={(e) => void formulario.enviar(e)} noValidate className="flex flex-col gap-5">
        <CamposRegla
          formulario={formulario}
          grupos={grupos}
          {...(regla.categoriaArchivada
            ? { extra: { id: regla.categoriaId, nombre: regla.categoriaNombre } }
            : {})}
          errorDelServidor={repetido ? guardar.error?.mensaje : undefined}
        />
        {fallo === undefined ? null : (
          <AvisoDeFallo fallo={fallo} reintentar={() => void fallida.reintentar()} />
        )}
        <Boton
          tipo="submit"
          enviando={guardar.estado === 'enviando'}
          textoEnviando={t.guardando}
          deshabilitado={!guardar.enLinea || sinCambios || ocupado}
          {...(guardar.motivoSinEnvio === undefined
            ? {}
            : { motivoDeshabilitado: guardar.motivoSinEnvio })}
        >
          {t.guardar}
        </Boton>
      </form>
      {pregunta ? (
        <section className="flex flex-col gap-3 rounded-contenedor bg-superficie p-4">
          <p>{t.confirmarEliminar(regla.patron)}</p>
          <div className="flex flex-wrap gap-3">
            <Boton
              variante="peligro"
              enviando={eliminar.estado === 'enviando'}
              textoEnviando={t.eliminando}
              deshabilitado={!eliminar.enLinea || ocupado}
              onClick={() => void eliminar.enviar({})}
            >
              {t.confirmarSi}
            </Boton>
            <Boton
              variante="discreta"
              deshabilitado={ocupado}
              onClick={() => {
                setPregunta(false);
              }}
            >
              {t.noEliminar}
            </Boton>
          </div>
        </section>
      ) : (
        <Boton
          variante="discreta"
          deshabilitado={ocupado}
          onClick={() => {
            setPregunta(true);
          }}
        >
          {t.eliminar}
        </Boton>
      )}
    </main>
  );
}
