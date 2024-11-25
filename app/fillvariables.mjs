// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: fillvariables.mjs
// Defines a function for filling in variables of the form %variablename%
// in a command

export default function fillvariables(cmd, swaps) {
  for (const variablename in swaps) {
    if (!variablename.startsWith('%') || !variablename.endsWith('%')) continue;
    cmd = cmd.replaceAll(variablename, `"${swaps[variablename]}"`)
  }
  return cmd;
}