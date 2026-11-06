'use client';
// `/cuentas/[cuentaId]/conciliar` (FT-43, OP-45 y OP-47; 06 FT-43; 05 §2.7, §4.11): subir el CSV, ver la clasificación que dice el
// servidor, marcar las coincidencias y terminar. La carga firmada vive solo en el estado del componente; el borrador guarda la
// huella SHA-256 del archivo y las marcas, y las restaura si se vuelve a subir el mismo archivo (CA-43.7). No calcula montos (PF-3).
// «Agregar» desde el estado (OP-46) no está en esta parte de la ficha.
import type { SalidaOp45 } from '@finn/aplicacion/operaciones/conciliacion';
import type { Centavos } from '@finn/dominio/valores';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Resultado } from '../../componentes/base/resultado';
import { Monto } from '../../componentes/dominio/monto';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { almacen } from '../../cliente/almacen';
import { formatearFecha, formatearMonto } from '../../formato';
import { claveDeBorrador } from '../../formularios/use-borrador';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { conciliar as t } from '../../textos/conciliar';
import { dominio } from '../../textos/dominio';
import { formularios } from '../../textos/formularios';

export interface PropsFormularioConciliar {
  /** `iniciarConciliacion` (OP-45) y `terminarConciliacion` (OP-47): las pone el lector, así el formulario se prueba sin servidor. */
  readonly iniciar: AccionEscritura;
  readonly terminar: AccionEscritura;
  readonly cuentaId: string;
  readonly cuenta: string;
}

interface Ajuste {
  readonly operacion: string;
  readonly monto: Centavos;
}
interface Borrador {
  readonly version: 1;
  readonly huella: string;
  readonly marcadas: readonly string[];
}

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
/** La ruta del flujo que crea el ajuste de AV-21 (FD-06) según la operación que propone el servidor. */
const RUTA_AJUSTE: Readonly<Record<string, string | undefined>> = {
  'OP-20': 'gasto',
  'OP-21': 'ingreso',
  'OP-27': 'entrada-tarjeta',
};
const conSigno = (monto: Centavos): string => `${monto > 0 ? '+' : ''}${formatearMonto(monto)}`;

async function huellaDe(bytes: Uint8Array): Promise<string> {
  try {
    const h = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
    return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return '';
  }
}

function leerBorrador(clave: string): Borrador | null {
  const texto = almacen.leer(clave);
  if (texto === null) return null;
  try {
    const b = JSON.parse(texto) as Partial<Borrador> | null;
    return b?.version === 1 && typeof b.huella === 'string' && Array.isArray(b.marcadas)
      ? (b as Borrador)
      : null;
  } catch {
    return null;
  }
}

const CAJA = 'flex min-h-11 items-center gap-3 rounded-contenedor bg-superficie px-3.5';

function Fila({
  comercio,
  fecha,
  monto,
  nota,
  children,
}: {
  readonly comercio: string;
  readonly fecha: string;
  readonly monto: Centavos;
  readonly nota?: string;
  readonly children?: React.ReactNode;
}) {
  return (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{comercio}</span>
        <span className="text-cuerpo-pequeno text-texto-secundario">
          {formatearFecha(fecha)}
          {nota === undefined ? '' : ` · ${nota}`}
        </span>
      </span>
      <Monto centavos={monto} rol="cifra" />
      {children}
    </>
  );
}

export function FormularioConciliar({
  iniciar,
  terminar,
  cuentaId,
  cuenta,
}: PropsFormularioConciliar) {
  const rutaPadre = `/cuentas/${cuentaId}`;
  const claveBorrador = claveDeBorrador(`${rutaPadre}/conciliar`);
  const subida = useOperacion({ accion: iniciar });
  const fin = useOperacion({ accion: terminar });
  const [archivo, setArchivo] = useState<File | null>(null);
  const [falta, setFalta] = useState(false);
  const [marcadas, setMarcadas] = useState<ReadonlySet<string>>(new Set());
  const [ajuste, setAjuste] = useState<Ajuste>();
  const huella = useRef('');
  const idConciliacion = useRef(crypto.randomUUID());
  const leida =
    subida.estado === 'listo' ? (subida.exito?.valor as SalidaOp45 | undefined) : undefined;

  // Al llegar la clasificación: las marcas del borrador si es el mismo archivo; si no, todas las coincidencias (CA-43.7).
  const nuevaLectura = useRef<SalidaOp45 | undefined>(undefined);
  useEffect(() => {
    if (leida === undefined || nuevaLectura.current === leida) return;
    nuevaLectura.current = leida;
    const ids = leida.clasificacion.coincidencias.map((c) => c.transaccionId);
    const b = leerBorrador(claveBorrador);
    const mismo = b !== null && huella.current !== '' && b.huella === huella.current;
    if (!mismo) almacen.borrar(claveBorrador);
    setMarcadas(new Set(mismo ? ids.filter((id) => b.marcadas.includes(id)) : ids));
  }, [leida, claveBorrador]);

  // Cada cambio de marcas queda en el borrador con la huella del archivo (nunca la carga firmada).
  const guardarMarcas = useCallback(
    (m: ReadonlySet<string>) => {
      setMarcadas(m);
      if (huella.current === '') return;
      const b: Borrador = { version: 1, huella: huella.current, marcadas: [...m] };
      almacen.escribir(claveBorrador, JSON.stringify(b));
    },
    [claveBorrador],
  );
  const alternar = (id: string) => {
    const m = new Set(marcadas);
    if (!m.delete(id)) m.add(id);
    guardarMarcas(m);
  };

  const revisar = async () => {
    if (archivo === null) {
      setFalta(true);
      return;
    }
    setFalta(false);
    const bytes = new Uint8Array(await archivo.arrayBuffer());
    huella.current = await huellaDe(bytes);
    await subida.enviar({ cuentaId, archivo: bytes });
  };

  const elegirOtro = () => {
    setArchivo(null);
    subida.volverAEditar();
    fin.volverAEditar();
  };

  const terminarConciliacion = async () => {
    if (leida === undefined) return;
    const entrada = {
      id: idConciliacion.current,
      cuentaId,
      carga: leida.carga,
      coincidencias: leida.clasificacion.coincidencias
        .filter((c) => marcadas.has(c.transaccionId))
        .map((c) => ({ transaccionId: c.transaccionId, movimientoIndice: c.movimientoIndice })),
    };
    // El ajuste de AV-21 lo propone el servidor: se pide en la previsualización y no cambia nada (OP-47 no confirma antes).
    try {
      const previa = await terminar({ ...entrada, modo: 'previsualizar' });
      const avisos = previa.ok
        ? ((
            previa.valor as {
              avisos?: readonly { codigo: string; datos?: Record<string, unknown> }[];
            }
          ).avisos ?? [])
        : [];
      const datos = avisos.find((a) => a.codigo === 'AV-21')?.datos;
      setAjuste(
        datos === undefined
          ? undefined
          : { operacion: String(datos['operacion']), monto: datos['monto'] as Centavos },
      );
    } catch {
      setAjuste(undefined);
    }
    await fin.enviar(entrada);
  };

  useEffect(() => {
    if (fin.estado === 'listo') almacen.borrar(claveBorrador);
  }, [fin.estado, claveBorrador]);

  const soloEnFinn = leida?.clasificacion.soloEnFinn ?? [];
  const listaSoloEnFinn = (
    <ul className="flex flex-col gap-1">
      {soloEnFinn.map((x) => (
        <li key={x.transaccionId} data-solo-en-finn={x.transaccionId} className={CAJA}>
          <Fila
            comercio={x.comercio ?? dominio.sinComercio}
            fecha={x.fecha}
            monto={x.monto}
            nota={`${t.soloEnFinnEtiqueta} · ${t.estadoBancario[x.estadoBancario]}`}
          >
            <EnlaceFinn
              href={`/actividad/${x.transaccionId}/editar`}
              className="inline-flex min-h-11 items-center font-bold text-enlace underline"
            >
              {t.editar}
            </EnlaceFinn>
          </Fila>
        </li>
      ))}
    </ul>
  );

  if (fin.estado === 'listo' && leida !== undefined) {
    const ruta = ajuste === undefined ? undefined : RUTA_AJUSTE[ajuste.operacion];
    const monto = ajuste === undefined ? '' : formatearMonto(ajuste.monto);
    const texto =
      ajuste?.operacion === 'OP-21'
        ? t.ajusteIngreso(monto)
        : ajuste?.operacion === 'OP-27'
          ? t.ajusteEntrada(monto)
          : t.ajusteGasto(monto);
    return (
      <PaginaFlujoDeRuta titulo={t.tituloListo} rutaPadre={rutaPadre}>
        <div className="flex flex-col gap-4">
          <Resultado
            texto={t.guardado(cuenta, formatearFecha(leida.fechaEstado), marcadas.size)}
            enlace={
              <EnlaceFinn
                href={rutaPadre}
                className="inline-flex min-h-11 items-center font-bold text-enlace underline"
              >
                {t.verCuenta}
              </EnlaceFinn>
            }
          />
          {ruta === undefined ? (
            <AvisoEnLinea estado="positivo">{t.sinDiferencia}</AvisoEnLinea>
          ) : (
            <AvisoEnLinea
              estado="advertencia"
              aparecioDespues
              accion={
                <EnlaceFinn
                  href={`/registrar/${ruta}?cuenta=${cuentaId}`}
                  className="inline-flex min-h-11 items-center font-bold text-enlace underline"
                >
                  {t.crearAjuste}
                </EnlaceFinn>
              }
            >
              {texto}
            </AvisoEnLinea>
          )}
          {soloEnFinn.length === 0 ? null : (
            <section className="flex flex-col gap-2">
              <h2 className="text-titulo-seccion">{t.pendientesTitulo}</h2>
              {listaSoloEnFinn}
            </section>
          )}
        </div>
      </PaginaFlujoDeRuta>
    );
  }

  if (leida !== undefined) {
    const c = leida.clasificacion;
    const fecha = formatearFecha(leida.fechaEstado);
    const fallo = fin.estado === 'error' ? fin.error : undefined;
    return (
      <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={rutaPadre}>
        <div className="flex flex-col gap-5">
          <p>{t.cuenta(cuenta)}</p>
          <div className="flex flex-col gap-1">
            <p data-saldo-estado>{t.saldoEstado(fecha, formatearMonto(leida.saldoFinal))}</p>
            <p data-saldo-finn>{t.saldoFinn(fecha, formatearMonto(c.saldoFinn))}</p>
            <p data-diferencia className="font-bold">
              {t.diferencia(conSigno(c.diferencia))}
            </p>
          </div>
          <section className="flex flex-col gap-2">
            <h2 className="text-titulo-seccion">{t.coinciden(c.coincidencias.length)}</h2>
            <fieldset className="flex flex-col gap-1">
              <legend className="mb-1 text-cuerpo-pequeno text-texto-secundario">
                {t.coincidenAyuda}
              </legend>
              {c.coincidencias.map((x) => (
                <label key={x.transaccionId} data-coincidencia={x.transaccionId} className={CAJA}>
                  <input
                    type="checkbox"
                    className="size-5 shrink-0"
                    checked={marcadas.has(x.transaccionId)}
                    onChange={() => {
                      alternar(x.transaccionId);
                    }}
                  />
                  <Fila
                    comercio={x.comercio ?? dominio.sinComercio}
                    fecha={x.fecha}
                    monto={x.monto}
                  />
                </label>
              ))}
            </fieldset>
          </section>
          {c.soloEnEstado.length === 0 ? null : (
            <section className="flex flex-col gap-2">
              <h2 className="text-titulo-seccion">{t.soloEnEstado(c.soloEnEstado.length)}</h2>
              <p className="text-cuerpo-pequeno text-texto-secundario">{t.soloEnEstadoNota}</p>
              <ul className="flex flex-col gap-1">
                {c.soloEnEstado.map((i) => {
                  const m = leida.movimientos.find((x) => x.indice === i);
                  return m === undefined ? null : (
                    <li key={i} data-solo-en-estado={i} className={CAJA}>
                      <Fila comercio={m.descripcion} fecha={m.fecha} monto={m.monto} />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {soloEnFinn.length === 0 ? null : (
            <section className="flex flex-col gap-2">
              <h2 className="text-titulo-seccion">{t.soloEnFinn(soloEnFinn.length)}</h2>
              {listaSoloEnFinn}
            </section>
          )}
          <p className="text-cuerpo-pequeno text-texto-secundario">{t.nota}</p>
          {fallo === undefined ? null : (
            <AvisoEnLinea
              estado="problema"
              aparecioDespues
              {...(REINTENTABLES.includes(fallo.categoria)
                ? {
                    accion: (
                      <Boton variante="secundaria" onClick={() => void fin.reintentar()}>
                        {formularios.intentarDeNuevo}
                      </Boton>
                    ),
                  }
                : {})}
            >
              {fallo.mensaje}
              {fallo.codigo === 'firma_vencida' || fallo.codigo === 'firma_no_valida'
                ? ` ${t.vencida}`
                : ''}
            </AvisoEnLinea>
          )}
          <div className="flex gap-3">
            <Boton
              enviando={fin.estado === 'enviando'}
              textoEnviando={t.terminando}
              deshabilitado={!fin.enLinea}
              onClick={() => void terminarConciliacion()}
            >
              {t.terminar}
            </Boton>
            <Boton variante="secundaria" onClick={elegirOtro}>
              {t.elegirOtro}
            </Boton>
          </div>
        </div>
      </PaginaFlujoDeRuta>
    );
  }

  const fallo = subida.estado === 'error' ? subida.error : undefined;
  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={rutaPadre}>
      <div className="flex flex-col gap-5">
        <p>{t.cuenta(cuenta)}</p>
        <div className="flex flex-col gap-2">
          <h2 className="text-titulo-seccion">{t.subirTitulo}</h2>
          <p className="text-cuerpo-pequeno text-texto-secundario">{t.subirAyuda}</p>
          <label htmlFor="archivo-estado" className="font-semibold">
            {t.archivo}
          </label>
          <input
            id="archivo-estado"
            type="file"
            accept=".csv,text/csv"
            className="min-h-11"
            onChange={(e) => {
              setArchivo(e.target.files?.[0] ?? null);
              setFalta(false);
            }}
          />
          {falta ? (
            <p role="alert" className="text-problema-texto">
              {t.falta}
            </p>
          ) : null}
        </div>
        {fallo === undefined ? null : (
          <AvisoEnLinea
            estado="problema"
            aparecioDespues
            {...(REINTENTABLES.includes(fallo.categoria)
              ? {
                  accion: (
                    <Boton variante="secundaria" onClick={() => void subida.reintentar()}>
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
          enviando={subida.estado === 'enviando'}
          textoEnviando={t.leyendo}
          deshabilitado={!subida.enLinea}
          onClick={() => void revisar()}
        >
          {t.revisar}
        </Boton>
      </div>
    </PaginaFlujoDeRuta>
  );
}
