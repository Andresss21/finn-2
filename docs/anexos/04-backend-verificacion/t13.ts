import { checkSync } from 'recheck';
const cands: Record<string, string> = {
  'F-1 reescrito (ilustrativo)': String.raw`(?:MASTERCARD|VISA) (?<ultimos4>\d{4}): has realizado una compra por USD ?(?<monto>\d[\d,]*(?:\.\d{1,2})?) en el comercio:? (?<comercio>[^\n]+?) (?<fecha>\d{4}\/\d{2}\/\d{2}|\d{8})$`,
};
for (const [n, p] of Object.entries(cands)) { const t0 = performance.now(); const r: any = checkSync(p, 'i', { timeout: 30000 }); console.log(n, r.status, r.complexity?.type, r.complexity?.degree ?? '', Math.round(performance.now() - t0), 'ms'); }
