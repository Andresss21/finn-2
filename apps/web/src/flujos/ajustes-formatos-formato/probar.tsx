'use client';
// Probar el formato en edición contra uno de los 20 SMS recientes sin reconocer o con error (OPT-06; 06 FT-73, CA-73.3): muestra los
// grupos que capturó y qué normalizador falló. Es una lectura: no guarda nada. El texto del SMS lo trae el servidor; no se interpreta acá.
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import type { SalidaProbar } from '@finn/aplicacion/operaciones/formatos';
import { useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Campo } from '../../componentes/base/campo';
import { formatearInstante } from '../../formato';
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
      <section aria-labelledby="probar-titulo" className="flex flex-col gap-2">
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
    <section aria-labelledby="probar-titulo" className="flex flex-col gap-3">
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
              <dl className="rounded-contenedor bg-superficie px-4 py-1 shadow-elevacion-1">
                {grupos.map(([nombre, valor]) => (
                  <div
                    key={nombre}
                    className="flex items-baseline justify-between gap-4 border-b border-borde-sutil py-2 last:border-b-0"
                  >
                    <dt className="text-cuerpo-pequeno text-texto-secundario">{nombre}</dt>
                    <dd className="break-all text-right font-medium">{valor}</dd>
                  </div>
                ))}
              </dl>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
