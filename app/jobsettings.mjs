// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: jobsettings.mjs
// reads and merges the settings that should be applied to a specific
// processing (or other) job

import deepAssign from '../public/js/deepAssign.mjs';
import path from 'node:path';
import fs from './fs.mjs';

export default function jobsettings(sessioninfo) {
  const localfile = path.join(sessioninfo.dir, 'oge-settings.json');
  const localsettings = fs.loadjson(localfile) ?? {};
  let settings = deepAssign(localsettings, process.ogesettings);
  if (sessioninfo?.ogeoverride) {
    settings = deepAssign(sessioninfo.ogeoverride, settings);
  }
  return settings;
}
