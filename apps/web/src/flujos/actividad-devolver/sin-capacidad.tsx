// `/actividad/[transaccionId]/devolver` sin capacidad restante (FT-28; 05 §7): lo dice con el total, lo devuelto y lo que queda, y no deja
// continuar. Las cifras llegan formateadas del DTO (PF-3).
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { transaccion as t } from '../../textos/transaccion';

export interface ResumenDeCompra {
  readonly total: string;
  readonly devuelto: string;
  readonly restante: string;
}

export function SinCapacidad({
  resumen: r,
  detalle,
}: {
  resumen: ResumenDeCompra;
  detalle: string;
}) {
  const filas = [
    [t.totalDeLaCompra, r.total],
    [t.devuelto, r.devuelto],
    [t.quedaPorDevolver, r.restante],
  ] as const;
  return (
    <div className="flex flex-col gap-5" data-sin-capacidad>
      <h2 className="text-titulo-seccion">{t.sinNadaTitulo}</h2>
      <p>{t.sinNadaTexto}</p>
      <dl className="divide-y divide-borde-sutil rounded-contenedor bg-superficie px-4 py-1 shadow-elevacion-1">
        {filas.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex justify-between gap-4 py-2">
            <dt className="text-cuerpo-pequeno text-texto-secundario">{rotulo}</dt>
            <dd className="font-medium tabular-nums">{valor}</dd>
          </div>
        ))}
      </dl>
      <EnlaceFinn
        href={detalle}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accion-tonal px-4 font-bold text-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco"
      >
        {t.volverATransaccion}
      </EnlaceFinn>
    </div>
  );
}
