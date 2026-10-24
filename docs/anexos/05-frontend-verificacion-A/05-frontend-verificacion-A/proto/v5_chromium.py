# Ejecuta V5-01/V5-02 en Chromium (Playwright) con la configuración regional del teléfono.
import sys
from playwright.sync_api import sync_playwright
js = open(sys.argv[1]).read()
with sync_playwright() as p:
    b = p.chromium.launch()
    for loc in ['es-SV', 'en-US']:
        pg = b.new_page(locale=loc, timezone_id='America/El_Salvador')
        out = []
        pg.on('console', lambda m: out.append(m.text))
        pg.set_content('<html></html>')
        pg.add_script_tag(content=js)
        print(f'--- locale del navegador: {loc}')
        print('\n'.join(out[-4:]))
    b.close()
