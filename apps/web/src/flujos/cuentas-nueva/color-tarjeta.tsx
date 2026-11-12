'use client';
// Selector de los 8 colores de la tarjeta con la cara de vista previa en vivo (CH-225 e). Radios nativos: el valor es el hex
// canónico que guarda `tarjetas.color`. La cara es decorativa; el nombre del color va en texto para lectores de pantalla.
import type { Centavos } from '@finn/dominio/valores';
import { Cara, type DatosCara } from '../../componentes/dominio/cara-tarjeta';
import { COLORES_TARJETA, nombreDeColor } from '../../componentes/dominio/colores-tarjeta';
import { caraTarjeta } from '../../textos/cara-tarjeta';
import { cuentasNueva as t } from '../../textos/cuentas-nueva';

export interface PropsColorTarjeta {
  /** El hex guardado en el formulario; fuera de la tabla, la vista previa y la marca son oro. */
  readonly valor: string;
  readonly alCambiar: (hex: string) => void;
  /** Lo escrito en el formulario, para que la vista previa sea la tarjeta que se va a crear. */
  readonly vista: Pick<DatosCara, 'institucion' | 'ultimos4' | 'red'> & { readonly nombre: string };
}

const CERO = 0 as Centavos;

export function ColorTarjeta({ valor, alCambiar, vista }: PropsColorTarjeta) {
  const elegido = nombreDeColor(valor);
  const { nombre, ...resto } = vista;
  return (
    <fieldset data-color-tarjeta className="flex flex-col gap-3">
      <legend className="mb-2 text-cuerpo-pequeno font-semibold">{t.color}</legend>
      <div data-vista-previa aria-hidden="true">
        <Cara
          tarjeta={{
            cuenta: { id: 'vista-previa', nombre: nombre.trim() === '' ? t.vistaPrevia : nombre },
            color: valor,
            deuda: CERO,
            saldoAFavor: CERO,
            ...resto,
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {COLORES_TARJETA.map((c) => (
          <label key={c.hex} className="relative cursor-pointer">
            <input
              type="radio"
              name="color-tarjeta"
              value={c.hex}
              checked={elegido === c.nombre}
              onChange={() => {
                alCambiar(c.hex);
              }}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              style={{ backgroundImage: `var(--tarjeta-${c.nombre})` }}
              className="block size-11 rounded-control shadow-elevacion-1 peer-checked:outline-3 peer-checked:outline-offset-2 peer-checked:outline-texto peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foco"
            />
            <span className="sr-only">{caraTarjeta.colores[c.nombre] ?? c.nombre}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
