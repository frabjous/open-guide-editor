// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: bibcompletions.mjs
// Reads the files listed as bibliographies and creates codemirror-style
// completions for their keys for markdown autocomplete

import path from 'node:path';
import fs from '../fs.mjs';
import jobsettings from '../jobsettings.mjs'

export default async function getfiles(reqdata, sessioninfo) {
  const settings = jobsettings(sessioninfo);
  if (!settings?.bibliographies || settings.bibliographies.length == 0) {
    return { completions: [] }
  }
  const completions = [];
  for (const file of settings.bibliographies) {
    const ffn = path.resolve(sessioninfo.dir, file);
    if (!fs.isfile(ffn)) continue;
    const bibentries = fs.loadjson(ffn);
    if (!bibentries || bibentries.length == 0) continue;
    for (const bibentry of bibentries) {
      if (!bibentry?.id) continue;
      const completion = {};
      completion.label = '@' + bibentry.id;
      completion.type = 'text';
      let detail = '';
      if (bibentry?.author) {
        detail += bibentry.author.map(
          (auth) => (auth?.family ?? '')
        ).join('; ');
      }
      if (detail == '' && bibentry?.editor) {
        detail += bibentry.editor.map(
          (ed) => (ed?.family ?? '')
        ).join('; ') + ', eds.'
      }
      if (bibentry?.title) {
        detail += ' – ' + bibentry.title;
      }
      completion.detail = detail;
      completions.push(completion);
    }
  }
  return {completions};
}
