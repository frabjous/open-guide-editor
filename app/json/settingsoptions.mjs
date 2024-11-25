// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: settingsoptions.mjs
// Returns a list of available font and colorscheme options

import path from 'node:path';
import fs from '../fs.mjs';

export default async function settingsoptions(reqdata, sessioninfo) {
  const colorsdir = path.join(process.__ogedirname, 'public', 'style', 'colors');
  const fontsdir = path.join(process.__ogedirname, 'public', 'style', 'fonts');
  const colorschemes = fs.filesin(colorsdir)
    .filter((s) => (s.endsWith('.css')))
    .map((s) => (path.basename(s, '.css')))
    .sort((a, b) => (a.localeCompare(b)));
  const fonts = fs.filesin(fontsdir)
    .filter((s) => (s.endsWith('css')))
    .map((s) => (path.basename(s, '.css')));
  return {colorschemes, fonts};
}
