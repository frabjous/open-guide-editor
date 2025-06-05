// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: pdfpageRequest.mjs
// extracts a page from a PDF and makes it available to preview window as image

import execAsync from './execAsync.mjs';
import fillvariables from './fillvariables.mjs';
import jobsettings from './jobsettings.mjs';
import path from 'node:path';
import fs from './fs.mjs';

export default async function pdfpageRequest(req, res, sessioninfo) {

  const pathparts = req.originalUrl.split('/');
  pathparts.shift(); //blank before first '/'
  pathparts.shift(); // "ogepdfpage"
  const pagenum = parseInt(pathparts.shift()); // page num
  if (isNaN(pagenum)) {
    res.status(404).type('txt').send('Error 401 Not Found');
    return null;
  }
  pathparts.shift(); // timestamp
  pathparts.shift(); // sessionid
  const outputfile = pathparts.join('/')
    .replace(/\.[^\.]*$/,'');
  const realpath = path.join(sessioninfo.dir, outputfile);
  if (!realpath.startsWith(sessioninfo.dir)) {
    res.status(401).type('txt').send('Error 401 Invalid Session');
    return null;
  }
  const exists = await fs.async.isfile(realpath);
  if (!exists) {
    res.status(404).type('txt').send('Error 404 Not Found');
    return;
  }
  const settings = jobsettings(sessioninfo);
  const pdfprevsettings = settings?.viewer?.pdf;
  const mimetype = pdfprevsettings?.convertmimetype ??
    pdfprevsettings?.convertextension ?? 'image/svg+xml';
  if (!pdfprevsettings?.convertcommand) {
    res.status(404).type('txt').send('Error 404 Not Found/No conversion settings');
    return;
  }
  const cmd = fillvariables(pdfprevsettings.convertcommand, {
    '%page%': pagenum.toString(),
    '%outputfile%': outputfile
  });
  const results = await execAsync(cmd, sessioninfo.dir);
  if (results.exitcode !== 0) {
    res.status(500).type('txt').send(
      'Server Error 500. Error converting pdf page\n\n' +
      results.stderr);
    return null;
  }
  res.type(mimetype).send(results.stdout);
  return true;
}
