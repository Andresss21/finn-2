// `consultas.formulario(parametros)` (04 §6.14, BE-42): una sola consulta con parámetros discriminados por operación,
// catálogos comunes y un contexto propio. TA-173 despacha las cinco operaciones de registro y edición; las demás de
// 6.14.1 suman su caso en `parametrosFormulario` y en el `switch` de aquí. Todo sale de `formulario()` del dominio
// (inv. 27): la consulta solo lee lo [H] e [I] en la misma instantánea.
import { parametrosFormulario } from '../../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from '../comun.ts';
import { cuenta } from './cuenta.ts';
import { cuota } from './cuota.ts';
import { editar } from './editar.ts';
import { pagarTarjeta } from './pagar-tarjeta.ts';
import { registrar } from './registrar.ts';

/** El cuerpo de cada operación: lo que devuelve su módulo. */
interface Cuerpos {
  readonly registrar: Awaited<ReturnType<typeof registrar>>;
  readonly pagar_tarjeta: Awaited<ReturnType<typeof pagarTarjeta>>;
  readonly cuota_prestamo: Awaited<ReturnType<typeof cuota>>;
  readonly editar_transaccion: Awaited<ReturnType<typeof editar>>;
  readonly cuenta: Awaited<ReturnType<typeof cuenta>>;
}

export type FormularioDto = Encabezado & Cuerpos[keyof Cuerpos];
export type FormularioDe<O extends keyof Cuerpos> = Encabezado & Cuerpos[O];

/** Con la operación conocida en el tipo, el contexto es el de esa operación. */
export function formulario<P extends { readonly operacion: keyof Cuerpos }>(
  d: DepsConsulta,
  parametros: P,
): Promise<FormularioDe<P['operacion']>>;
export function formulario(d: DepsConsulta, parametros: unknown): Promise<FormularioDto>;
export function formulario(d: DepsConsulta, parametros: unknown): Promise<FormularioDto> {
  return consultar(
    d,
    { nombre: 'formulario', contrato: parametrosFormulario, parametros },
    async (c, p): Promise<FormularioDto> => {
      const cuerpo = await (() => {
        switch (p.operacion) {
          case 'registrar':
            return registrar(c, p);
          case 'pagar_tarjeta':
            return pagarTarjeta(c, p);
          case 'cuota_prestamo':
            return cuota(c, p);
          case 'editar_transaccion':
            return editar(c, p);
          case 'cuenta':
            return cuenta(c, p);
        }
      })();
      return { ...c.encabezado, ...cuerpo };
    },
  );
}
