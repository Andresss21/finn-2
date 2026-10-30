// `consultas.formulario(parametros)` (04 §6.14, BE-42): una sola consulta con parámetros discriminados por operación,
// catálogos comunes y un contexto propio. TA-173 despacha las cinco operaciones de registro y edición, TA-174 las de presupuesto y bandeja; las demás de
// 6.14.1 suman su caso en `parametrosFormulario` y en el `switch` de aquí. Todo sale de `formulario()` del dominio
// (inv. 27): la consulta solo lee lo [H] e [I] en la misma instantánea.
import { parametrosFormulario } from '../../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from '../comun.ts';
import { archivar } from './archivar.ts';
import { asignar } from './asignar.ts';
import { cobrar } from './cobrar.ts';
import { condonar } from './condonar.ts';
import { cuenta } from './cuenta.ts';
import { cuota } from './cuota.ts';
import { devolver } from './devolver.ts';
import { editar } from './editar.ts';
import { fusionar } from './fusionar.ts';
import { meta } from './meta.ts';
import { movimiento } from './movimiento.ts';
import { pagarTarjeta } from './pagar-tarjeta.ts';
import { programada } from './programada.ts';
import { registrar } from './registrar.ts';

/** El cuerpo de cada operación: lo que devuelve su módulo. */
interface Cuerpos {
  readonly registrar: Awaited<ReturnType<typeof registrar>>;
  readonly pagar_tarjeta: Awaited<ReturnType<typeof pagarTarjeta>>;
  readonly cuota_prestamo: Awaited<ReturnType<typeof cuota>>;
  readonly editar_transaccion: Awaited<ReturnType<typeof editar>>;
  readonly cuenta: Awaited<ReturnType<typeof cuenta>>;
  readonly asignar: Awaited<ReturnType<typeof asignar>>;
  readonly archivar_categoria: Awaited<ReturnType<typeof archivar>>;
  readonly movimiento: Awaited<ReturnType<typeof movimiento>>;
  readonly meta: Awaited<ReturnType<typeof meta>>;
  readonly cobrar: Awaited<ReturnType<typeof cobrar>>;
  readonly condonar: Awaited<ReturnType<typeof condonar>>;
  readonly devolver: Awaited<ReturnType<typeof devolver>>;
  readonly fusionar: Awaited<ReturnType<typeof fusionar>>;
  readonly programada: Awaited<ReturnType<typeof programada>>;
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
          case 'asignar':
            return asignar(c, p);
          case 'archivar_categoria':
            return archivar(c, p);
          case 'movimiento':
            return movimiento(c, p);
          case 'meta':
            return meta(c, p);
          case 'cobrar':
            return cobrar(c, p);
          case 'condonar':
            return condonar(c, p);
          case 'devolver':
            return devolver(c, p);
          case 'fusionar':
            return fusionar(c, p);
          case 'programada':
            return programada(c, p);
        }
      })();
      return { ...c.encabezado, ...cuerpo };
    },
  );
}
