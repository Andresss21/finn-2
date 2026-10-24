#!/bin/bash
# V5-26: Lighthouse 12 indicativo (perfil móvil por defecto: Moto G Power emulado, CPU ×4, 4G lenta simulada) contra next start.
set -e
APP=/home/claude/v5/app2; LH=/tmp/claude-0/-home-claude/af86530b-be69-56d5-a0ae-0e2c79c5b29a/scratchpad/node_modules/.bin/lighthouse
export PATH=/home/claude/v5/n24/node_modules/.bin:$PATH NEXT_TELEMETRY_DISABLED=1 CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
(cd $APP && setsid npx next start -p 3201 >/dev/null 2>&1 & echo $! > /tmp/claude-0/-home-claude/af86530b-be69-56d5-a0ae-0e2c79c5b29a/scratchpad/lh.pid)
for i in $(seq 50); do curl -s -o /dev/null http://localhost:3201/base && break; sleep 0.3; done
for r in base formulario grafico-servidor tokens; do
  $LH http://localhost:3201/$r --quiet --chrome-flags="--headless=new --no-sandbox" --only-categories=performance,accessibility --output=json --output-path=/tmp/claude-0/-home-claude/af86530b-be69-56d5-a0ae-0e2c79c5b29a/scratchpad/lh-$r.json >/dev/null 2>&1 || echo "falló $r"
  python3 -c "
import json;r=json.load(open('/tmp/claude-0/-home-claude/af86530b-be69-56d5-a0ae-0e2c79c5b29a/scratchpad/lh-$r.json'));a=r['audits']
print(f\"  /$r: rendimiento {r['categories']['performance']['score']*100:.0f} · accesibilidad {r['categories']['accessibility']['score']*100:.0f} · LCP {a['largest-contentful-paint']['numericValue']/1000:.2f} s · TBT {a['total-blocking-time']['numericValue']:.0f} ms · CLS {a['cumulative-layout-shift']['numericValue']:.3f}\")"
done
kill -- -$(cat /tmp/claude-0/-home-claude/af86530b-be69-56d5-a0ae-0e2c79c5b29a/scratchpad/lh.pid) 2>/dev/null || pkill -f "next start -p 3201" || true
