// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: settings.mjs
// Functions related to oge settings

import deepAssign from './deepAssign.mjs';

export function mergeSettings() {
  let settings = deepAssign(window.localogesettings, window.globalogesettings);
  if (window?.session?.ogeoverride) {
    settings = deepAssign(window.session.ogeoverride, settings);
  }
  window.ogesettings = settings;
}