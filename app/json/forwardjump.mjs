// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// FIle: forwardjump.mjs
// processes requests to determine what page to jump to in a pdf preview

import path from 'node:path';
import fs from '../fs.mjs';
import execAsync from '../execAsync.mjs';
import fillvariables from '../fillvariables.mjs';
import jobsettings from '../jobsettings.mjs';

export default async function forwardjump(reqdata, sessioninfo) {
  const {inputext, outputext, outputfile, rootdocument, currentfile,
    line} = reqdata;
  const settings = jobsettings(sessioninfo);
  const routine = settings?.routines?.[inputext]?.[outputext];
  if (!routine?.forwardjump) return {page: false};
  const cmd = fillvariables(routine.forwardjump, {
    '%line%': line.toString(),
    '%outputfile%': outputfile,
    '%rootdocument%': rootdocument,
    '%savedfile%': currentfile,
    '%currentfile%': currentfile
  });
  const jcmdres = await execAsync(cmd, sessioninfo.dir);
  const pagenum = parseInt(jcmdres.stdout.trim());
  if (isNaN(pagenum)) return {page: false};
  return {page: pagenum};
}
