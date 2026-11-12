'use client';
// La lista desplegable de `Seleccion` (05 §10.7) para más de 7 opciones. Se carga diferida desde `seleccion.tsx`.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Campo } from './campo';
import type { PropsSeleccion } from './seleccion';

export default function SeleccionLista({
  etiqueta,
  opciones,
  valor,
  alCambiar,
  descripcion,
  error,
  deshabilitada = false,
}: PropsSeleccion) {
  return (
    <Campo
      etiqueta={etiqueta}
      requerido
      {...(descripcion === undefined ? {} : { descripcion })}
      {...(error === undefined ? {} : { error })}
    >
      {(control) => (
        <Select value={valor} disabled={deshabilitada} onValueChange={alCambiar}>
          <SelectTrigger {...control}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {opciones.map((o) => (
              <SelectItem key={o.valor} value={o.valor}>
                {o.etiqueta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </Campo>
  );
}
