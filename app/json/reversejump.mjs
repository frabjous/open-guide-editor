// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: reversejump.mjs
// Processes JSON requests to determine which editor line to go to based
// on click in preview window

import path from 'node:path';
import fs from '../fs.mjs';
import execAsync from '../execAsync.mjs';
import fillvariables from '../fillvariables.mjs';
import jobsettings from '../jobsettings.mjs';

export default async function reversejump(reqdata, sessioninfo) {
  const {inputext, outputext, outputfile, rootdocument, page,
    xperc, yperc} = reqdata;
  const settings = jobsettings(sessioninfo);
  const routine = settings?.routines?.[inputext]?.[outputext];
  if (!routine?.reversejump) return { filename: false };
  if (!routine?.getpagedimensions) return { filename: false };
  const pagedimencmd = fillvariables(routine.getpagedimensions, {
    '%outputfile%': outputfile,
    '%page%': page.toString()
  });
  const pagedimresult = await execAsync(pagedimencmd, sessioninfo.dir);
  const dimens = pagedimresult.stdout.trim().split('\n');
  const width = parseFloat(dimens?.[0]);
  const height = parseFloat(dimens?.[1]);
  const x = width*xperc;
  const y = height*yperc;
  if (isNaN(width) || isNaN(height)) return { filename: false };
  const cmd = fillvariables(routine.reversejump, {
    '%x%': x.toFixed(2),
    '%y%': y.toFixed(2),
    '%outputfile%': outputfile,
    '%rootdocument%': rootdocument,
    '%page%': page.toString()
  });
  const jcmdres = await execAsync(cmd, sessioninfo.dir);
  const linesout = jcmdres.stdout.trim().split('\n');
  let dest = null;
  let line = null;
  for (const oline of linesout) {
    if (oline.startsWith('Line:')) {
      const pline = parseInt(oline.substring(5));
      if (!isNaN(pline)) line = pline;
    }
    if (oline.startsWith('Input:')) {
      dest = oline.substring(6);
    }
    if (dest && line) break;
  }
  if (line) line = line--;
  if (!line) line = 0;
  if (!dest) return {filename: false};
  const fulldest = path.resolve(sessioninfo.dir, dest);
  let reldest = false;
  if (fulldest.startsWith(sessioninfo.dir)) {
    reldest = fulldest.substring(sessioninfo.dir.length + 1);
  }
  return {filename: reldest, line};
}
