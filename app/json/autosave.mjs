// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: autosave.mjs
// Processes Autosave JSON requests

import path from 'node:path';
import fs from '../fs.mjs';

export default async function autosave(reqdata, sessioninfo) {
  let autosavedir = process?.ogeautosavedir;
  if (!autosavedir) return {
    autosaveerror: 'No autosave directory set on server.'
  }
  if (!fs.ensuredir(autosavedir)) return {
    autosaverror: 'Could not find or create autosave directory.'
  }
  let files = reqdata?.files ?? [];
  for (const file of files) {
    if (!file?.filename) return {
      autosaveerror: 'Not all autosave files given filenames.'
    }
    file.ffn = path.resolve(sessioninfo.dir, file.filename);
    if (!file.ffn.startsWith(sessioninfo.dir)) return {
      autosaveerror: 'Some files to be autosaved not in proper directory.'
    }
  }
  for (const file of files) {
    if (!file?.contents) continue;
    const autosavefn = path.join(autosavedir, file.ffn.replaceAll('/','⁒'));
    if (!fs.savefile(autosavefn, file.contents)) return {
      autosaveerror: `Unable to autosave file ${file.filename}.`
    }
  }
  return {success: true};
}
