#!/bin/sh
# V6-07: peso de @dnd-kit/core 6.3.1 con sus sensores (sin React), minificado y gzip -9.
npm i @dnd-kit/core@6.3.1 react@19 react-dom@19 esbuild@0.25
npx esbuild entrada.jsx --bundle --minify --format=esm --external:react --external:react-dom --outfile=salida.js
gzip -9 -c salida.js | wc -c   # 12617 bytes
