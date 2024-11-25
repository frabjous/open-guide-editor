// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: removefilefromsessions.json
// Processes the changes to a session that takes place when a user closes
// a tab

import savesession from '../savesession.mjs';

export default async function removefilefromsession(reqdata, sessioninfo) {
  const filename = reqdata?.filename;
  if (!filename) return { error: 'No filename specified.' }
  sessioninfo.files = sessioninfo.files.filter((x) => (x != filename));
  return { success: savesession(sessioninfo) };
}
