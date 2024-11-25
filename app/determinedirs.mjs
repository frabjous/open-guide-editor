// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: determinedirs.mjs
// Resolves the proper locations for configuration, data, etc., files
// and loads settings, etc. into process

import path from 'node:path';
import fs from './fs.mjs';

export default function determinedirs() {
  const ogeconfigdir = path.join(process.env.HOME, '.config', 'oge');
  const settingsbase = process?.env?.OGESETTINGS ?? 'settings.json';
  const ogesettingsfile = path.resolve(ogeconfigdir, settingsbase);

  if (!fs.ensuredir(ogeconfigdir)) {
    console.error('Could not find or create OGE configuration directory.');
    process.exit(1);
  }

  // if instance does not have settings, copy defaults
  if (!fs.isfile(ogesettingsfile)) {
    fs.copyFileSync(
      path.join(process.__dirname, 'default-settings.json'),
      ogesettingsfile
    );
  }

  const ogesettings = fs.loadjson(ogesettingsfile);
  if (!ogesettings) {
    console.error('Could not load OGE settings.')
    process.exit(1);
  }
  process.ogesettings = ogesettings;

  const ogedir = path.join(process.env.HOME, '.local', 'share', 'oge');
  const ogedatadir = path.resolve(ogedir, (ogesettings?.datalocation ?? '.'));
  process.ogeautosavedir = (ogesettings?.autosave?.directory)
    ? path.resolve(ogedatadir, ogesettings.autosave.directory)
    : null;
  process.ogeaudiodir = path.join(ogedatadir, 'audio');
  process.userdir = path.join(ogedatadir, 'users');
  const ogesessionsdir = path.join(ogedatadir, 'sessions');
  if (!fs.ensuredir(ogesessionsdir)) {
    console.error('Could not find or create OGE data directory.');
    process.exit(1);
  }
  process.ogesessionsdir = ogesessionsdir;
  return {ogesettings, ogedatadir, ogesessionsdir}
}
