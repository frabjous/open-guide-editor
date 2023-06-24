cd $HOME/http/typesetting/open-guide-editor
node_modules/.bin/rollup js/editor.mjs -f iife -o editor.bundle.js -p @rollup/plugin-node-resolve
