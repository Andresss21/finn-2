const pats: Record<string, [string, (k: number) => string]> = {
  'F-1': [String.raw`(?:MASTERCARD|VISA)\s+(?<ultimos4>\d{4}):\s+has realizado una compra por USD\s*(?<monto>[\d,]+\.?\d*)\s+en el comercio:?\s+(?<comercio>.+?)\s+(?<fecha>\d{4}\/\d{2}\/\d{2}|\d{8})`,
          k => 'VISA\n0000: HAS REALIZADO UNA COMPRA POR USD0\tEN EL COMERCIO\t' + ' \t'.repeat(k) + 'T'],
  'F-2': [String.raw`\((?<ultimos4>\d{4})\).*?USD\s*(?<monto>[\d,]+\.?\d*)\s+en el comercio:?\s+(?<comercio>.+?)\s+(?<fecha>\d{4}\/\d{2}\/\d{2}|\d{8})`,
          k => '(0000)USD0\tEN EL COMERCIO ' + ' \t'.repeat(k)],
  'F-3': [String.raw`Titular\s+(?<ultimos4>\d{4})\s+por\s+USD(?<monto>[\d,]+\.?\d*)\s+en\s+(?<comercio>.+?)\s+el\s+(?<fecha>\d{4}-\d{2}-\d{2})`,
          k => 'Titular 0000 por USD0 en ' + ' '.repeat(k) + 'x'],
};
const [p, gen] = pats[process.argv[2]];
const re = new RegExp(p, 'i');
for (const k of [50, 100, 200, 400, 800, 990]) { const s = gen(k).slice(0, 2000); const t0 = performance.now(); re.exec(s); console.log(process.argv[2], s.length, 'caracteres:', (performance.now() - t0).toFixed(1), 'ms'); }
