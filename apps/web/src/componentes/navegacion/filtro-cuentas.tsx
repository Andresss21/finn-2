'use client';
// Filtro «Cuentas» de los reportes (05 §2.10, CP-12, CH-E5-2; entrega 4 E5-2): un botón con el valor («Todas», «Cuenta corriente», «2 cuentas»)
// que abre una hoja (panel de 440 en computadora) con una casilla de 48 px por cuenta, «Quitar el filtro» y «Ver N cuentas». Al ver, la URL
// lleva `?cuentas=`; sin cuentas marcadas, la URL no lleva el parámetro. La hoja se descarga al abrirla (no suma al JS de la ruta).
import { useState } from 'react';
import { reportes as t } from '../../textos/reportes';
import { Icono } from '../base/icono';
import { EnlaceFinn } from './enlace-finn';
import { SuperpuestoDiferido } from './hoja-diferida';

export interface CuentaDelFiltro {
  readonly id: string;
  readonly nombre: string;
}

export interface PropsFiltroCuentas {
  readonly cuentas: readonly CuentaDelFiltro[];
  /** Los ids marcados hoy en la URL. */
  readonly elegidas: readonly string[];
  /** La URL del reporte con todo lo demás y sin `cuentas`. */
  readonly hrefSin: string;
  /** Flujo de efectivo: la lista trae solo cuentas de efectivo y lo dice (06 §3.3). */
  readonly soloEfectivo?: boolean;
}

const CASILLA =
  'flex min-h-12 cursor-pointer items-center gap-3 rounded-control px-3 text-cuerpo text-texto hover:bg-superficie-hundida has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foco';
const TONAL =
  'inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accion-tonal px-5 font-semibold text-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const PRIMARIO =
  'inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

/** El valor que dice el botón: «Todas», el nombre de la única cuenta o «N cuentas». */
function valorDe(cuentas: readonly CuentaDelFiltro[], elegidas: readonly string[]): string {
  if (elegidas.length === 0) return t.filtroCuentas.todas;
  if (elegidas.length === 1)
    return cuentas.find((c) => c.id === elegidas[0])?.nombre ?? t.filtroCuentas.varias(1);
  return t.filtroCuentas.varias(elegidas.length);
}

export function FiltroCuentas({ cuentas, elegidas, hrefSin, soloEfectivo }: PropsFiltroCuentas) {
  const [abierto, setAbierto] = useState(false);
  const [marcadas, setMarcadas] = useState<readonly string[]>(elegidas);
  const valor = valorDe(cuentas, elegidas);
  // Los dos destinos son enlaces (la URL manda, 05 §2.2): no hace falta el enrutador.
  const hrefCon = (ids: readonly string[]): string =>
    ids.length === 0
      ? hrefSin
      : `${hrefSin}${hrefSin.includes('?') ? '&' : '?'}cuentas=${ids.join(',')}`;
  const cerrar = (): void => {
    setAbierto(false);
  };
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-etiqueta text-texto">{t.filtros.cuentas}</span>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-label={t.filtroCuentas.abrir(valor)}
        onClick={() => {
          setMarcadas(elegidas);
          setAbierto(true);
        }}
        className="flex min-h-12 w-full items-center justify-between gap-2 rounded-control bg-superficie-hundida px-3.5 text-left text-cuerpo text-texto focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco"
      >
        <span className="truncate font-semibold">{valor}</span>
        <Icono nombre="chevD" tamano={20} />
      </button>
      {abierto ? (
        <SuperpuestoDiferido
          titulo={t.filtroCuentas.titulo}
          alCerrar={() => {
            setAbierto(false);
          }}
        >
          <div className="flex flex-col gap-4 px-5 pb-6">
            {soloEfectivo === true ? (
              <p className="text-cuerpo-pequeno text-texto-secundario">
                {t.filtroCuentas.soloEfectivo}
              </p>
            ) : null}
            <ul className="flex flex-col">
              {cuentas.map((c) => (
                <li key={c.id}>
                  <label className={CASILLA}>
                    <input
                      type="checkbox"
                      className="size-5 accent-accion"
                      checked={marcadas.includes(c.id)}
                      onChange={() => {
                        setMarcadas((previas) =>
                          previas.includes(c.id)
                            ? previas.filter((x) => x !== c.id)
                            : [...previas, c.id],
                        );
                      }}
                    />
                    {c.nombre}
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2">
              <EnlaceFinn href={hrefCon([])} className={TONAL} onClick={cerrar}>
                {t.filtroCuentas.quitar}
              </EnlaceFinn>
              <EnlaceFinn href={hrefCon(marcadas)} className={PRIMARIO} onClick={cerrar}>
                {marcadas.length === 0
                  ? t.filtroCuentas.verTodas
                  : t.filtroCuentas.ver(marcadas.length)}
              </EnlaceFinn>
            </div>
          </div>
        </SuperpuestoDiferido>
      ) : null}
    </div>
  );
}
