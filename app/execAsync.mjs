// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: execAsync.mjs
// defines a function to exec a command asyncrhonously

import {promisify} from 'node:util';
import {exec} from 'node:child_process';

const execPromise = promisify(exec);

export default async function execAsync(cmd, cwd = false) {
  const opts = {};
  if (cwd) opts.cwd = cwd;
  try {
    const {stdout, stderr} = await execPromise(cmd, opts);
    return { stdout, stderr, exitcode: 0}
  } catch(err) {
    return {
      stdout: err.stdout,
      stderr: err.stderr,
      exitcode: err.code
    }
  }
}
