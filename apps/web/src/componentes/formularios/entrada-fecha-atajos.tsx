'use client';
// `EntradaFecha` con atajos debajo («Hoy», «Ayer»; A12, CH-226). Va aparte de `entrada-fecha.tsx` para que los formularios que no
// los usan no los carguen (05 §13.1): hoy solo Revisar movimiento.
import { FechaLocal } from '@finn/dominio/valores';
import { EntradaFecha, type PropsEntradaFecha } from './entrada-fecha';

export interface PropsEntradaFechaConAtajos extends PropsEntradaFecha {
  /**
   * Atajos debajo del campo, en días desde `hoy`: son fechas de negocio del servidor, nunca del reloj del dispositivo. Sin
   * `hoy` no se muestran.
   */
  readonly atajos: readonly { readonly etiqueta: string; readonly dias: number }[];
}

/** El campo con sus atajos debajo: pastillas tonales con su área de 44. */
export function EntradaFechaConAtajos({ atajos, ...props }: PropsEntradaFechaConAtajos) {
  const { hoy } = props;
  if (atajos.length === 0 || hoy === undefined) return <EntradaFecha {...props} />;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <EntradaFecha {...props} />
      <div className="flex flex-wrap gap-1.5">
        {atajos.map((a) => {
          const fecha = FechaLocal.sumarDias(hoy, a.dias);
          return (
            <button
              key={a.etiqueta}
              type="button"
              aria-pressed={props.valor === fecha}
              disabled={props.deshabilitado}
              className="flex min-h-11 cursor-pointer items-center rounded-pastilla px-1 text-etiqueta text-accion focus-visible:outline-3 focus-visible:outline-foco disabled:cursor-default disabled:text-texto-deshabilitado [&>span]:rounded-pastilla [&>span]:bg-accion-tonal [&>span]:px-3 [&>span]:py-1.5 aria-pressed:[&>span]:font-bold"
              onClick={() => {
                props.alCambiar(fecha);
              }}
            >
              <span>{a.etiqueta}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
