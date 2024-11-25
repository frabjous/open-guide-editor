// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: unixfilter
// Processes a request to pipe part of a document through a unix command

import {execSync} from 'node:child_process';

export default async function unixfilter(reqdata, sessioninfo) {
  const {tofilter, unixcmd} = reqdata;
  if (!tofilter || !unixcmd) return {
    error: 'Inadequate information provided to run filter;'
  }
  if (unixcmd.includes('sudo')) return {
    error: 'Unix command contains “sudo”'
  }
  const filterresults = [];
  for (const range of tofilter) {
    let stdin = range?.text ?? '';
    let addedeol = false;
    let stdout = '';
    try {
      stdout = execSync( unixcmd, {
          encoding: 'utf-8',
          input: range?.text ?? '',
          cwd: sessioninfo.dir
      });
    } catch(err) {
      return { error: err.stderr }
    }
    filterresults.push({
      to: range.to,
      from: range.from,
      text: stdout
    })
  }
  return {filterresults};
}
