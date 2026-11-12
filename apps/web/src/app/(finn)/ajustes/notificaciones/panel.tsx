'use client';
// `/ajustes/notificaciones` (FT-06, OPT-02 y OPT-03; 05 §8.6, CP-5): activar las notificaciones en este dispositivo y quitar
// cualquiera de los de la lista. «Este dispositivo» se reconoce comparando `endpointCorto` (CH-73). No calcula nada (PF-3).
import { useEffect, useState } from 'react';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Boton } from '../../../../componentes/base/boton';
import {
  activar,
  anularLocal,
  endpointCortoDeEsteDispositivo,
  usePermiso,
  type RegistrarSuscripcion,
} from '../../../../cliente/notificaciones';
import { formatearInstante } from '../../../../formato';
import { notificaciones as t } from '../../../../textos/notificaciones';

export interface DispositivoPush {
  readonly id: string;
  readonly endpointCorto: string;
  readonly agente?: string;
  readonly renovadaEn: string;
}

export interface PropsPanelNotificaciones {
  readonly dispositivos: readonly DispositivoPush[];
  /** Las Server Actions de OPT-02 y OPT-03: las pasa el lector, para que este módulo se pruebe sin el servidor. */
  readonly registrar: RegistrarSuscripcion;
  readonly quitar: (entrada: { readonly id: string }) => Promise<{ readonly ok: boolean }>;
}

function Permiso({
  registrar,
  alCambiar,
  ocupado,
  permiso,
}: Pick<PropsPanelNotificaciones, 'registrar'> & {
  readonly alCambiar: () => void;
  readonly ocupado: boolean;
  readonly permiso: ReturnType<typeof usePermiso>[0];
}) {
  const [activando, setActivando] = useState(false);
  const [falla, setFalla] = useState(false);
  if (permiso === 'ios_sin_instalar')
    return (
      <AvisoEnLinea estado="informacion" titulo={t.iosTitulo}>
        <span className="block">{t.iosAyuda}</span>
        <ol className="mt-2 list-decimal pl-5">
          {t.iosPasos.map((paso) => (
            <li key={paso}>{paso}</li>
          ))}
        </ol>
      </AvisoEnLinea>
    );
  if (permiso === 'denegado')
    return (
      <AvisoEnLinea estado="advertencia" titulo={t.denegadoTitulo}>
        <span className="block">{t.denegadoAyuda}</span>
        <ol className="mt-2 list-decimal pl-5">
          {t.denegadoPasos.map((paso) => (
            <li key={paso}>{paso}</li>
          ))}
        </ol>
      </AvisoEnLinea>
    );
  if (permiso === 'no_disponible') return <p className="text-texto">{t.noDisponible}</p>;
  if (permiso === 'cargando') return null;
  if (permiso === 'concedido' && ocupado) return <p className="text-texto">{t.activadasAqui}</p>;
  return (
    <section aria-labelledby="este-dispositivo" className="flex flex-col gap-3">
      <h2 id="este-dispositivo" className="text-titulo-seccion">
        {t.esteDispositivoTitulo}
      </h2>
      <p className="text-cuerpo-pequeno text-texto">{t.sinDecidirAyuda}</p>
      {falla ? (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {t.noSePudo}
        </AvisoEnLinea>
      ) : null}
      <Boton
        enviando={activando}
        textoEnviando={t.activando}
        onClick={() => {
          setActivando(true);
          setFalla(false);
          void activar(registrar).then((ok) => {
            setActivando(false);
            setFalla(!ok && Notification.permission === 'granted');
            alCambiar();
          });
        }}
      >
        {t.activar}
      </Boton>
    </section>
  );
}

export function PanelNotificaciones({ dispositivos, registrar, quitar }: PropsPanelNotificaciones) {
  const [permiso, releer] = usePermiso();
  const [este, setEste] = useState<string | null>(null);
  const [falla, setFalla] = useState(false);
  useEffect(() => {
    void endpointCortoDeEsteDispositivo().then(setEste, () => undefined);
  }, [dispositivos]);

  // E5-16: sin permiso concedido (sin pedir, denegado, iPhone sin instalar) este dispositivo no está en la lista.
  const esEste = (d: DispositivoPush): boolean =>
    permiso === 'concedido' && d.endpointCorto === este;

  const quitarDispositivo = async (d: DispositivoPush): Promise<void> => {
    setFalla(false);
    const r = await quitar({ id: d.id });
    if (!r.ok) {
      setFalla(true);
      return;
    }
    if (esEste(d)) {
      await anularLocal().catch(() => undefined);
      setEste(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Permiso
        registrar={registrar}
        alCambiar={releer}
        ocupado={dispositivos.some(esEste)}
        permiso={permiso}
      />
      <section aria-labelledby="dispositivos" className="flex flex-col gap-3">
        <h2 id="dispositivos" className="text-titulo-seccion">
          {t.dispositivos}
        </h2>
        {falla ? (
          <AvisoEnLinea estado="problema" aparecioDespues>
            {t.noSePudo}
          </AvisoEnLinea>
        ) : null}
        {dispositivos.length === 0 ? (
          <p className="text-cuerpo-pequeno text-texto-secundario">{t.sinDispositivos}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {dispositivos.map((d) => {
              const nombre = d.agente ?? t.agenteDesconocido;
              return (
                <li key={d.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-cuerpo-pequeno break-words text-texto">
                      {nombre}
                      {esEste(d) ? ` · ${t.esteDispositivo}` : ''}
                    </p>
                    <p className="text-sm text-texto-secundario">
                      {t.renovada(formatearInstante(d.renovadaEn))}
                    </p>
                  </div>
                  <Boton
                    variante="secundaria"
                    aria-label={t.quitarEtiqueta(nombre)}
                    onClick={() => {
                      void quitarDispositivo(d);
                    }}
                  >
                    {t.quitar}
                  </Boton>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <p className="text-sm text-texto-secundario">{t.notaPermiso}</p>
    </div>
  );
}
