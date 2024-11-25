// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: template.mjs
// Sends back a template from the template directory

import jobsettings from '../jobsettings.mjs';
import fs from '../fs.mjs';
import path from 'node:path';

export default async function gettemplate(reqdata, sessioninfo) {
  const configdir = path.join(process.env.HOME, '.config', 'oge');
  const settings = jobsettings(sessioninfo);
  const tempdirpath = settings?.templates ?? 'templates';
  const tempdir = path.resolve(configdir, tempdirpath);
  const {templatenum, templateext} = reqdata;
  if (!templatenum || !templateext ) return {
    error: 'Template number or extension not provided.'
  }
  const templatefile = path.join(tempdir, templateext +
    templatenum.toString() + '.template');
  const template = fs.readfile(templatefile);
  if (!template) return {
    error: 'Unable to read template ' + templatefile
  }
  return {template};
}