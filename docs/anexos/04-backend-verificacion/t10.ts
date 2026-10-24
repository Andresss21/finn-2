// V-22: referencia semanal con redondeo acumulado (6.9.3) suma exactamente lo asignado.
const redondear = (m: number, d: number, n: number) => Math.floor((2 * m * d + n) / (2 * n)); // mitad hacia arriba, m·d ≥ 0
let casos = 0, fallas = 0, ejemplo: any;
for (const dur of [11, 28, 29, 30, 31]) for (let i = 0; i < 20000; i++) {
  const asig = Math.floor(Math.random() * 5_000_000);
  const semanas = Math.ceil(dur / 7); let acumAnt = 0, suma = 0, diasAcum = 0; const refs: number[] = [];
  for (let k = 1; k <= semanas; k++) { const dias = Math.min(7, dur - 7 * (k - 1)); diasAcum += dias;
    const acum = redondear(asig, diasAcum, dur); refs.push(acum - acumAnt); suma += acum - acumAnt; acumAnt = acum; }
  casos++; if (suma !== asig || refs.some(r => r < 0)) fallas++;
  if (asig === 0 || dur === 31 && !ejemplo) ejemplo = { dur, asig, refs };
}
console.log(`V-22 casos: ${casos}, fallas: ${fallas}`, JSON.stringify(ejemplo));
