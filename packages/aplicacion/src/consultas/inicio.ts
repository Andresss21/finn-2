// `consultas.inicio()` (04 §6.1): los números salen de `seleccionar.inicio` (los mismos de Presupuesto, error 11); la
// consulta agrega lo que vive fuera del motor: los contadores de `movimientos` [H] y, de [T], `notificaciones`
// (AV-01, BE-38) y `token_webhook` (primeros pasos, CF-18). Todo en la misma instantánea de `leer()`.
import { actividad, inicio as inicioDelDominio } from '@finn/dominio/selectores';
import type { InicioSel, TransaccionFila } from '@finn/dominio/selectores';
import { leerHashToken, noLeidasDeAviso, type ContadoresDeBandeja } from '@finn/db';
import { sinParametros } from '../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

/** Las recientes de Inicio: las 5 últimas por (fecha, clave_orden, secuencia) (04 §6.1). */
const RECIENTES = 5;

/** Una notificación de AV-01 (04 §6.12.5, sin `destino`: BE-38 no lo registra). */
export interface NotificacionDto {
  readonly id: string;
  readonly creadaEn: string;
  readonly aviso: string | null;
  readonly motivo: string;
  readonly titulo: string;
  readonly cuerpo: string;
  readonly leida: false;
}

/**
 * Las `accion: Propuesta` de AV-08 y AV-14 y el texto y la acción de `hallazgosRitmo` no están: ningún selector
 * las entrega (3.0.3, 7.10) y armarlas aquí sería calcular montos (inv. 27). Ver el informe de TA-169.
 */
export type InicioDto = Encabezado &
  Omit<InicioSel, 'atencion'> & {
    readonly atencion: InicioSel['atencion'] & {
      readonly bandeja: ContadoresDeBandeja;
      readonly cambiosRetroactivos: NotificacionDto[];
    };
    readonly recientes: TransaccionFila[];
  };

export function inicio(d: DepsConsulta): Promise<InicioDto> {
  return consultar(
    d,
    { nombre: 'inicio', contrato: sinParametros, parametros: undefined },
    async ({ tx, i, encabezado, bandeja }) => {
      const sel = inicioDelDominio(i, (await leerHashToken(tx)) !== null);
      const retroactivos = await noLeidasDeAviso(tx, 'AV-01');
      return {
        ...encabezado,
        ...sel,
        atencion: {
          ...sel.atencion,
          bandeja,
          cambiosRetroactivos: retroactivos.map((n) => ({
            id: n.id,
            creadaEn: n.creadaEn.toISOString(),
            aviso: n.aviso,
            motivo: n.motivo,
            titulo: n.titulo,
            cuerpo: n.cuerpo,
            leida: false as const,
          })),
        },
        recientes: actividad(i, { limite: RECIENTES }).dias.flatMap((dia) => [
          ...dia.transacciones,
        ]),
      };
    },
  );
}
