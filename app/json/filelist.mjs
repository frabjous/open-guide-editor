// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: filelist.json
// Sends a list of files in a directory for creating the file tree
// for opening files

import path from 'node:path';
import fs from '../fs.mjs';

function getDirList(dir) {
  const dirlist = {dirname:dir};
  const subdirs = fs.subdirs(dir).filter(
    (d) => (
      path.basename(d) != '.git' && path.basename(d) != 'node_modules'
    )
  );
  if (subdirs.length > 0) {
    dirlist.subdirs = subdirs.map((d) => getDirList(d));
  }
  const allfiles = fs.filesin(dir, true)
    .map((f) => (path.basename(f)));
  dirlist.hiddenfiles = allfiles.filter((f) => (f.startsWith('.')))
  dirlist.regularfiles = allfiles.filter((f) => (!f.startsWith('.')));
  return dirlist;
}

export default async function listfiles(reqdata, sessioninfo) {
  return getDirList(sessioninfo.dir);
}

