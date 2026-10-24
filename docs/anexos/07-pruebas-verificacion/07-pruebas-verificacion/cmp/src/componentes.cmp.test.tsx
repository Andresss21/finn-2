// PRU-CMP-VAL-001..004 (prototipo de V7-15)
import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from '@vitest/browser/context';
import axe from 'axe-core';
import { IndicadorSobregiro, CampoMonto } from './componentes';
const violaciones = async (el: Element) => (await axe.run(el, { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map(v => v.id);
describe('PRU-CMP-VAL', () => {
  it('PRU-CMP-VAL-001 el indicador de sobregiro tiene nombre accesible por tipo, no solo color (PF-2)', async () => {
    const s = render(<><IndicadorSobregiro tipo="debito" monto="$26.30" /><IndicadorSobregiro tipo="tarjeta" monto="$18.75" /></>);
    await expect.element(page.getByRole('img', { name: 'sobregiro con débito o efectivo' })).toBeInTheDocument();
    await expect.element(page.getByRole('img', { name: 'deuda sin reservar' })).toBeInTheDocument();
    expect(await violaciones(s.container)).toEqual([]);
  });
  it('PRU-CMP-VAL-002 control negativo: sin nombre y con poco contraste, axe lo detecta', async () => {
    const s = render(<IndicadorSobregiro tipo="debito" monto="$26.30" malo />);
    expect(await violaciones(s.container)).toEqual(expect.arrayContaining(['svg-img-alt', 'color-contrast']));
  });
  it('PRU-CMP-VAL-003 monto mal escrito: el error queda asociado al campo y se anuncia', async () => {
    const s = render(<CampoMonto etiqueta="Total" />);
    const campo = page.getByLabelText('Total');
    await userEvent.fill(campo, '1.486,0'); await userEvent.tab();
    await expect.element(campo).toHaveAttribute('aria-invalid', 'true');
    await expect.element(campo).toHaveAccessibleDescription('Usá el punto o la coma solo para los centavos, sin separador de miles.');
    expect(await violaciones(s.container)).toEqual([]);
  });
  it('PRU-CMP-VAL-004 el foco y el teclado son reales: Tab mueve el foco al campo', async () => {
    render(<CampoMonto etiqueta="Total" />);
    await userEvent.tab();
    expect(document.activeElement?.tagName).toBe('INPUT');
  });
});
