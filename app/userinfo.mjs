// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: userinfo.mjs
// Functions for fetching or writing user preferences, like fonts
// or colorschemes

import path from 'node:path';
import fs from './fs.mjs';

export function saveuserinfo(username, userinfo) {
  const userdir = process.userdir;
  const myfile = path.join(userdir, username, 'prefs.json');
  return fs.savejson(myfile, userinfo);
}

export function readuserinfo(username) {
  const userdir = process.userdir;
  const myfile = path.join(userdir, username, 'prefs.json');
  return fs.loadjson(myfile);
}
