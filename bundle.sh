#!/usr/bin/env bash
# LICENSE: GNU GPL v3 You should have received a copy of the GNU General
# Public License along with this program. If not, see
# https://www.gnu.org/licenses/.

####################### bundle.sh ##################################
# A quick shell script that bundles the dependencies for editor.mjs
# using the rollup bundler
# ##################################################################

cd $HOME/http/typesetting/open-guide-editor
node_modules/.bin/rollup js/editor.mjs -f iife -o editor.bundle.js -p @rollup/plugin-node-resolve
