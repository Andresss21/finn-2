'use client';
// Probar el formato en edición contra uno de los 20 SMS recientes sin reconocer o con error (OPT-06; 06 FT-73, CA-73.3): muestra los
// grupos que capturó y qué normalizador falló, en la tabla Grupo · Capturó · Se lee como (E5-10, CA-E5-13). Es una lectura: no guarda
// nada. El texto del SMS y lo que se lee de cada grupo (`campos`) los trae el servidor; acá solo se formatean.
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import type { SalidaProbar } from '@finn/aplicacion/operaciones/formatos';
import { useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Campo } from '../../componentes/base/campo';
import { formatearFecha, formatearInstante, formatearMonto } from '../../formato';
import { ajustesFormatos } from '../../textos/ajustes-formatos';
import { formularios } from '../../textos/formularios';

const t = ajustesFormatos.probar;
const LARGO_VISTA = 60;
export const CAJA_SELECT =
  'min-h-12 w-full rounded-t-control rounded-b-sm border-b-2 border-borde-control bg-superficie px-3 text-base text-texto focus-visible:border-b-4 focus-visible:border-foco focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco aria-invalid:border-2 aria-invalid:border-problema-borde';

export interface SmsDePrueba {
  readonly smsId: string;
  readonly texto: string;
  readonly recibidoEn: string;
  readonly estado: 'no_reconocido' | 'error';
}
export interface PropsProbar {
  /** `probarFormatoContraSms` (OPT-06): la pone el lector, así el panel se prueba sin servidor. */
  readonly probar: (entrada: unknown) => Promise<ResultadoAccion<SalidaProbar>>;
  readonly sms: readonly SmsDePrueba[];
  /** El formato tal como está escrito ahora (sin `id` ni `activo`). */
  readonly formato: Readonly<Record<string, unknown>>;
}

type Estado =
  | { readonly tipo: 'quieto' }
  | { readonly tipo: 'probando' }
  | { readonly tipo: 'resultado'; readonly valor: SalidaProbar }
  | { readonly tipo: 'error'; readonly mensaje: string };

/** «Se lee como»: lo que el servidor normalizó de cada grupo (`campos`), formateado; sin `campos` (falló), nada. */
function seLee(grupo: string, r: SalidaProbar): string {
  const c = r.campos;
  if (c === undefined) return '';
  if (grupo === 'ultimos4') return `***${c.ultimos4}`;
  if (grupo === 'monto') return formatearMonto(c.monto);
  if (grupo === 'fecha') return c.fecha === null ? '' : formatearFecha(c.fecha);
  return grupo === 'comercio' ? (c.comercio ?? '') : '';
}

function explicacion(r: SalidaProbar): string {
  if (r.coincide) return t.coincide;
  if (r.demasiadoLargo) return t.demasiadoLargo;
  return r.fallo === undefined || r.fallo === 'patron' ? t.patron : t.fallo[r.fallo];
}

export function ProbarFormato({ probar, sms, formato }: PropsProbar) {
  const [smsId, setSmsId] = useState(sms[0]?.smsId ?? '');
  const [estado, setEstado] = useState<Estado>({ tipo: 'quieto' });

  if (sms.length === 0)
    return (
      <section aria-labelledby="probar-titulo" className="flex flex-col gap-2 xl:sticky xl:top-4">
        <h2 id="probar-titulo" className="text-titulo-seccion">
          {t.titulo}
        </h2>
        <p className="text-cuerpo-pequeno text-texto-secundario">{t.sinSms}</p>
      </section>
    );

  const lanzar = async (): Promise<void> => {
    setEstado({ tipo: 'probando' });
    try {
      const r = await probar({ smsId, formato });
      setEstado(
        r.ok ? { tipo: 'resultado', valor: r.valor } : { tipo: 'error', mensaje: r.error.mensaje },
      );
    } catch {
      setEstado({ tipo: 'error', mensaje: formularios.incierto });
    }
  };
  const grupos = estado.tipo === 'resultado' ? Object.entries(estado.valor.grupos ?? {}) : [];

  return (
    <section aria-labelledby="probar-titulo" className="flex flex-col gap-3 xl:sticky xl:top-4">
      <h2 id="probar-titulo" className="text-titulo-seccion">
        {t.titulo}
      </h2>
      <Campo etiqueta={t.elegir} requerido descripcion={t.nada}>
        {(control) => (
          <select
            {...control}
            className={CAJA_SELECT}
            value={smsId}
            onChange={(e) => {
              setSmsId(e.target.value);
              setEstado({ tipo: 'quieto' });
            }}
          >
            {sms.map((s) => (
              <option key={s.smsId} value={s.smsId}>
                {`${formatearInstante(s.recibidoEn)} · ${s.estado === 'error' ? t.conError : t.noReconocido} · ${s.texto.slice(0, LARGO_VISTA)}`}
              </option>
            ))}
          </select>
        )}
      </Campo>
      <Boton
        variante="secundaria"
        enviando={estado.tipo === 'probando'}
        textoEnviando={t.probando}
        onClick={() => void lanzar()}
      >
        {t.boton}
      </Boton>
      <div aria-live="polite" className="flex flex-col gap-2" data-resultado-prueba>
        {estado.tipo === 'error' ? (
          <AvisoEnLinea estado="problema" aparecioDespues>
            {estado.mensaje}
          </AvisoEnLinea>
        ) : null}
        {estado.tipo === 'resultado' ? (
          <>
            <AvisoEnLinea
              estado={estado.valor.coincide ? 'positivo' : 'advertencia'}
              aparecioDespues
            >
              {explicacion(estado.valor)}
            </AvisoEnLinea>
            <h3 className="text-cuerpo font-semibold">{t.grupos}</h3>
            {grupos.length === 0 ? (
              <p className="text-cuerpo-pequeno text-texto-secundario">{t.sinGrupos}</p>
            ) : (
              <table className="w-full rounded-contenedor bg-superficie text-left shadow-elevacion-1">
                <thead className="text-cuerpo-pequeno text-texto-secundario">
                  <tr className="border-b border-borde-sutil">
                    <th scope="col" className="px-4 py-2 font-medium">
                      {t.grupo}
                    </th>
                    <th scope="col" className="px-2 py-2 font-medium">
                      {t.capturo}
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium">
                      {t.seLee}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {grupos.map(([nombre, valor]) => (
                    <tr
                      key={nombre}
                      data-fallo={estado.valor.fallo === nombre ? '' : undefined}
                      className="border-b border-borde-sutil last:border-b-0 data-fallo:text-problema-texto"
                    >
                      <th
                        scope="row"
                        className="px-4 py-2 font-mono text-cuerpo-pequeno font-normal"
                      >
                        {nombre}
                      </th>
                      <td className="px-2 py-2 break-all">{valor}</td>
                      <td className="px-4 py-2 break-all font-medium">
                        {seLee(nombre, estado.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
