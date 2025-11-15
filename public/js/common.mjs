// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: common.mjs
// Defines functions common to editor page preview page

import {addelem} from './misc.mjs';

export function defaultcolorscheme() {
  let dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return ((dark) ? 'OneHalfDark' : 'OneHalfLight');
}

export function loadcolorscheme(name) {
  if (window.colorscheme) {
    const colorscheme = window.colorscheme;
    colorscheme.parentNode.removeChild(colorscheme);
  }
  window.colorschemename = name;
  if (window?.ogePreviewWindow) {
    window.ogePreviewWindow.loadcolorscheme(name);
  }
  window.colorscheme = loadCSS('colors/' + name + '.css');
}

export function loadeditorfont(name) {
  if (window.fontcss) {
    const fontcss = window.fontcss;
    fontcss.parentNode.removeChild(fontcss);
  }
  window.editorfontname = name;
  window.fontcss = loadCSS('fonts/' + name + '.css');
}

export function loadCSS(filename) {
  return addelem({
    parent: document.head,
    tag: 'link',
    rel: 'stylesheet',
    type: 'text/css',
    href: '/ogepublic/style/' + filename
  });
}
