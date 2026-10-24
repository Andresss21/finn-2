"""V5-23: tokens de color provisionales (05 §10) y su contraste WCAG 2.2.
Genera tokens.css para la app de prueba y verifica cada par que la interfaz usa. Uso: python3 tokens.py <salida.css>"""
import sys, json
T = {
 'claro': {
  'fondo':'#FAFAFA','superficie':'#FFFFFF','superficie-elevada':'#FFFFFF','superficie-hundida':'#F4F4F5',
  'borde-sutil':'#E4E4E7','borde-control':'#8A8A93','foco':'#18181B','velo':'rgba(9,9,11,0.5)',
  'texto':'#18181B','texto-secundario':'#52525B','texto-terciario':'#63636B','texto-deshabilitado':'#A1A1AA',
  'enlace':'#1D4ED8','texto-sobre-accion':'#FFFFFF','accion':'#18181B','accion-hover':'#3F3F46','accion-presionada':'#27272A',
  'accion-secundaria':'#F4F4F5','peligro':'#B91C1C','texto-sobre-peligro':'#FFFFFF',
  'positivo-texto':'#166534','positivo-fondo':'#F0FDF4','positivo-borde':'#15803D',
  'cero-texto':'#3F3F46','cero-fondo':'#F4F4F5','cero-borde':'#71717A',
  'advertencia-texto':'#854D0E','advertencia-fondo':'#FEFCE8','advertencia-borde':'#A16207',
  'problema-texto':'#991B1B','problema-fondo':'#FEF2F2','problema-borde':'#DC2626',
  'deuda-texto':'#1E3A8A','deuda-fondo':'#EFF6FF','deuda-borde':'#2563EB',
  'deuda-sin-respaldo-texto':'#6B21A8','deuda-sin-respaldo-fondo':'#FAF5FF','deuda-sin-respaldo-borde':'#9333EA',
  'informacion-texto':'#155E75','informacion-fondo':'#ECFEFF','informacion-borde':'#0E7490',
 },
 'oscuro': {
  'fondo':'#09090B','superficie':'#18181B','superficie-elevada':'#27272A','superficie-hundida':'#111113',
  'borde-sutil':'#27272A','borde-control':'#7C7C85','foco':'#FAFAFA','velo':'rgba(0,0,0,0.6)',
  'texto':'#FAFAFA','texto-secundario':'#A1A1AA','texto-terciario':'#9A9AA3','texto-deshabilitado':'#52525B',
  'enlace':'#93C5FD','texto-sobre-accion':'#18181B','accion':'#FAFAFA','accion-hover':'#E4E4E7','accion-presionada':'#D4D4D8',
  'accion-secundaria':'#27272A','peligro':'#F87171','texto-sobre-peligro':'#18181B',
  'positivo-texto':'#86EFAC','positivo-fondo':'#052E16','positivo-borde':'#22C55E',
  'cero-texto':'#D4D4D8','cero-fondo':'#27272A','cero-borde':'#A1A1AA',
  'advertencia-texto':'#FDE68A','advertencia-fondo':'#422006','advertencia-borde':'#EAB308',
  'problema-texto':'#FCA5A5','problema-fondo':'#450A0A','problema-borde':'#EF4444',
  'deuda-texto':'#BFDBFE','deuda-fondo':'#172554','deuda-borde':'#3B82F6',
  'deuda-sin-respaldo-texto':'#E9D5FF','deuda-sin-respaldo-fondo':'#3B0764','deuda-sin-respaldo-borde':'#A855F7',
  'informacion-texto':'#A5F3FC','informacion-fondo':'#083344','informacion-borde':'#06B6D4',
 }}
ESTADOS = ['positivo','cero','advertencia','problema','deuda','deuda-sin-respaldo','informacion']
def lum(h):
    h=h.lstrip('#'); r,g,b=(int(h[i:i+2],16)/255 for i in (0,2,4))
    f=lambda c: c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def contraste(a,b):
    la,lb=sorted([lum(a),lum(b)],reverse=True); return (la+0.05)/(lb+0.05)
SUPERFICIES=['fondo','superficie','superficie-elevada','superficie-hundida']
reglas=[]  # (descripción, frente, fondo, mínimo)
for t in ['texto','texto-secundario','texto-terciario','enlace']:
    for s in SUPERFICIES: reglas.append((t,s,4.5))
for s in ['accion','accion-hover','accion-presionada']: reglas.append(('texto-sobre-accion',s,4.5))
reglas.append(('texto','accion-secundaria',4.5)); reglas.append(('texto-sobre-peligro','peligro',4.5))
for s in ['fondo','superficie','superficie-hundida']: reglas.append(('borde-control',s,3.0))
for s in ['fondo','superficie','superficie-elevada']: reglas.append(('foco',s,3.0)); reglas.append(('accion',s,3.0)); reglas.append(('peligro',s,3.0))
for e in ESTADOS:
    for s in [f'{e}-fondo','fondo','superficie','superficie-elevada']: reglas.append((f'{e}-texto',s,4.5))
    for s in [f'{e}-fondo','superficie','fondo']: reglas.append((f'{e}-borde',s,3.0))
fallos=0; peor={}
for tema,v in T.items():
    for fr,fo,m in reglas:
        c=contraste(v[fr],v[fo]); clave=(tema,fr)
        if c<m: fallos+=1; print(f'FALLA {tema}: {fr} sobre {fo} = {c:.2f} < {m}')
        if clave not in peor or c<peor[clave][0]: peor[clave]=(c,fo,m)
print(f'V5-23: {len(reglas)*2} pares verificados ({len(reglas)} por tema), {fallos} fallos')
for tema in T:
    filas=[f'{fr} {c:.2f} (mín. {m}, peor caso sobre {fo})' for (t,fr),(c,fo,m) in sorted(peor.items()) if t==tema]
    print(f'  {tema}: peores casos —', '; '.join(filas[:6]), '…')
print(f"  texto-deshabilitado (exento, 1.4.3): claro {contraste(T['claro']['texto-deshabilitado'],T['claro']['superficie']):.2f}, oscuro {contraste(T['oscuro']['texto-deshabilitado'],T['oscuro']['superficie']):.2f}")
# Distinguibilidad entre estados (no reemplaza al indicador no cromático; solo informa)
css=['/* Tokens PROVISIONALES de 05 §10 (valores neutros hasta la identidad de Claude Design). */',':root {']
css+= [f'  --finn-{k}: {x};' for k,x in T['claro'].items()]+['}','.dark {']+[f'  --finn-{k}: {x};' for k,x in T['oscuro'].items()]+['}']
open(sys.argv[1],'w').write('\n'.join(css)+'\n'); json.dump(T,open(sys.argv[1].replace('.css','.json'),'w'),indent=1)
sys.exit(1 if fallos else 0)
