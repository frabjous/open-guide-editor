// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: reportpreferences.mjs
// Processes a change to user preferences regarding colorschemes, fonts, etc.

import savesession from '../savesession.mjs';
import {saveuserinfo} from '../userinfo.mjs';

export default async function reportpreferences(reqdata, sessioninfo) {
  const {colorscheme, delay, font} = reqdata;
  const userinfo = {};
  if (colorscheme &&
      colorscheme != 'defaultdark'
      && colorscheme != 'defaultlight') {
      sessioninfo.colorscheme = colorscheme;
      userinfo.colorscheme = colorscheme;
  }
  if (font) {
      sessioninfo.font = font;
      userinfo.font = font;
  }
  if (delay >= 10 && delay <= 3600000) {
    if (!sessioninfo?.ogeoverride) {
      sessioninfo.ogeoverride = {};
    }
    if (!sessioninfo.ogeoverride?.autoprocess) {
      sessioninfo.ogeoverride.autoprocess = {};
    }
    sessioninfo.ogeoverride.autoprocess.delay = delay;
  }
  if (sessioninfo?.user) {
    saveuserinfo(sessioninfo.user, userinfo);
  }
  savesession(sessioninfo);
  return {success: true};
}
