'use client';
// [CH-276] «¿Quién paga?» de `/registrar/gasto` (C-45 §4.8, §9 y §10): «Solo yo · Con alguien», las personas en chips con «Otra
// persona», los modos y una fila de parte por Vos y por cada persona, con su resumen. Una persona nueva llega con la clave
// `nueva:{nombre}` y se crea con la transacción (`deudorNuevo`, OP-20). Los montos los propone `formularios/reparto` (CH-276).
import { useId } from 'react';
import { EstiloV3, GrupoCampos, MensajeError } from '../../componentes/base/campo';
import { ChipsPersonas, TarjetasEleccion, type PersonaChip } from '../../componentes/base/eleccion';
import { Icono } from '../../componentes/base/icono';
import { SelectorSegmentado } from '../../componentes/base/selector-segmentado';
import { formatearMonto, formatearPorcentaje } from '../../formato';
import { centesimasDe, type ModoReparto } from '../../formularios/reparto';
import { registrarGasto as t } from '../../textos/registrar-gasto';
import { MAXIMO_PARTES, type CamposDeRegistro as Campos, type PersonaDeGasto } from './campos';
import { CifraDeParte, ResumenReparto } from './entrada-parte';
import { NUEVA, propuesta, type EstadoDelGasto } from './estado';

export const MODOS = (): { valor: ModoReparto; etiqueta: string }[] => [
  { valor: 'iguales', etiqueta: t.iguales },
  { valor: 'porcentaje', etiqueta: t.porcentaje },
  { valor: 'montos', etiqueta: t.montos },
];

export interface PropsQuienPaga {
  readonly c: Campos;
  readonly e: EstadoDelGasto;
  /** Los deudores que ya existen: `clave` es su id. */
  readonly conocidas: readonly PersonaChip[];
  /** «Tu parte · {destino}»: la categoría elegida o «{n} categorías». */
  readonly destinoDeVos: string;
  readonly poner: (parcial: Partial<Campos>) => void;
  readonly alSalir: () => void;
}

export function QuienPaga({ c, e, conocidas, destinoDeVos, poner, alSalir }: PropsQuienPaga) {
  const id = useId();
  const personas: PersonaChip[] = [
    ...conocidas,
    ...c.nuevas.map((nombre) => ({ clave: `${NUEVA}${nombre}`, nombre, nueva: true })),
  ];
  const nombreDe = (clave: string) => personas.find((p) => p.clave === clave)?.nombre ?? '';
  // Con otra cantidad de personas o en otro modo, se vuelve a proponer (C-45 §10): cada monto queda a la vista.
  const repartirEntre = (elegidas: readonly PersonaDeGasto[], modo = c.modoPersonas) => {
    const [vos, ...resto] = propuesta(modo, e.total, [c.vos, ...elegidas]);
    poner({ modoPersonas: modo, vos: vos ?? c.vos, personas: resto });
  };
  const escribir = (k: number, campo: 'monto' | 'pct', valor: string) => {
    if (k === 0) poner({ vos: { ...c.vos, [campo]: valor } });
    else poner({ personas: c.personas.map((p, i) => (i === k - 1 ? { ...p, [campo]: valor } : p)) });
  };
  const filas = [c.vos, ...c.personas];
  return (
    <section aria-labelledby={`${id}-t`} className="flex flex-col gap-3">
      <h2 id={`${id}-t`} className="text-titulo-seccion">
        {t.quienPaga}
      </h2>
      <TarjetasEleccion
        etiqueta={t.quienPaga}
        opciones={[
          { valor: 'solo', titulo: t.soloYo, detalle: t.soloYoDetalle, icono: 'user' },
          // El ícono de dos personas no está en el registro (06 §2): `swap`, el de repartir, hasta que se dibuje
          { valor: 'alguien', titulo: t.conAlguien, detalle: t.conAlguienDetalle, icono: 'swap' },
        ]}
        valor={c.conAlguien ? 'alguien' : 'solo'}
        alCambiar={(v) => {
          poner({ conAlguien: v === 'alguien' });
        }}
      />
      {c.conAlguien ? (
        <>
          <span className="campo-rotulo-seccion">{t.conQuien}</span>
          <ChipsPersonas
            etiqueta={t.conQuien}
            personas={personas}
            elegidas={c.personas.map((p) => p.clave)}
            maximo={MAXIMO_PARTES - (c.varias ? c.filas.length : 1)}
            alCambiar={(claves) => {
              repartirEntre(
                claves.map(
                  (clave) =>
                    c.personas.find((p) => p.clave === clave) ?? { clave, monto: '', pct: '' },
                ),
              );
            }}
            alCrear={(p) => {
              poner({ nuevas: [...c.nuevas, p.nombre] });
            }}
          />
          {e.errorConQuien === undefined ? null : <MensajeError>{e.errorConQuien}</MensajeError>}
        </>
      ) : null}
      {c.conAlguien && c.personas.length > 0 ? (
        <>
          <EstiloV3>
            <SelectorSegmentado
              etiqueta={t.comoRepartirPersonas}
              opciones={MODOS()}
              valor={c.modoPersonas}
              alCambiar={(v) => {
                repartirEntre(c.personas, v as ModoReparto);
              }}
              llena
            />
          </EstiloV3>
          <GrupoCampos>
            {filas.map((p, k) => {
              const esVos = k === 0;
              const nombre = esVos ? t.vos : nombreDe(p.clave);
              const monto = e.personas.montos[k] ?? e.total;
              const pct = formatearPorcentaje(centesimasDe(monto, e.total));
              return (
                <div key={p.clave} className="campo-fila parte-fila">
                  <span aria-hidden="true" className="parte-avatar" data-vos={esVos ? '' : undefined}>
                    {nombre.charAt(0)}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="parte-nombre">{nombre}</span>
                    <span className="parte-destino">
                      {esVos
                        ? t.tuParteEn(destinoDeVos)
                        : p.clave.startsWith(NUEVA)
                          ? t.nuevaDestino
                          : t.teDebeDestino}
                    </span>
                  </span>
                  <CifraDeParte
                    modo={c.modoPersonas}
                    etiqueta={
                      c.modoPersonas === 'porcentaje'
                        ? esVos
                          ? t.tuPorcentaje
                          : t.porcentajeDe(nombre)
                        : esVos
                          ? t.tuParte
                          : t.montoDe(nombre)
                    }
                    valor={c.modoPersonas === 'porcentaje' ? p.pct : p.monto}
                    monto={formatearMonto(monto)}
                    nota={c.modoPersonas === 'porcentaje' ? formatearMonto(monto) : pct}
                    deuda={!esVos}
                    error={e.resumenPersonas?.error === true && c.modoPersonas !== 'iguales'}
                    alCambiar={(v) => {
                      escribir(k, c.modoPersonas === 'porcentaje' ? 'pct' : 'monto', v);
                    }}
                    alSalir={alSalir}
                  />
                  {esVos ? (
                    <span aria-hidden="true" />
                  ) : (
                    <button
                      type="button"
                      className="parte-quitar"
                      aria-label={t.quitarA(nombre)}
                      onClick={() => {
                        repartirEntre(c.personas.filter((x) => x.clave !== p.clave));
                      }}
                    >
                      <Icono nombre="x" tamano={18} />
                    </button>
                  )}
                </div>
              );
            })}
          </GrupoCampos>
          {e.resumenPersonas === undefined ? null : <ResumenReparto {...e.resumenPersonas} />}
        </>
      ) : null}
    </section>
  );
}
