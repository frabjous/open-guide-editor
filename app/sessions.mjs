// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// FIle: sessions.mjs
// Exports functions handy for creating and working with sessions

import fs from './fs.mjs';
import path from 'node:path'
import deepAssign from '../public/js/deepAssign.mjs';
import randomString from './randomString.mjs';

export function bestSessionDir(fullpath) {
  const dirname = path.dirname(fullpath);
  let tempdir = dirname;
  while (!['/','.','',process.env.HOME].includes(tempdir)) {
    const ogesettingsfile = path.join(tempdir, 'oge-settings.json');
    if (fs.isfile(ogesettingsfile)) return tempdir;
    const pkgfile = path.join(tempdir, 'package.json');
    if (fs.isfile(pkgfile)) return tempdir;
    const gitsubdir = path.join(tempdir, '.git');
    if (fs.isdir(gitsubdir)) return tempdir;
    tempdir = path.dirname(tempdir);
  }
  return dirname;
}

export function listSessions(user, clean) {
  const allsessions = fs.filesin(process.ogesessionsdir);
  const usersessions = {};
  const now = Date.now();
  for (const sessionfile of allsessions) {
    if (!sessionfile.endsWith('.json')) continue;
    const sessioninfo = fs.loadjson(sessionfile);
    if (!sessioninfo?.user || sessioninfo.user != user) continue;
    if (!sessioninfo?.dir) continue;
    // skip and delete expired sessions
    if (sessioninfo?.expires &&
       sessioninfo.expires != 0 &&
       sessioninfo.expires < now) {
      fs.rm(sessionfile);
      continue;
    }
    const sessionid = path.basename(sessionfile, '.json');
    if (!(sessioninfo.dir in usersessions)) {
      usersessions[sessioninfo.dir] = {};
    }
    usersessions[sessioninfo.dir][sessionid] = fs.mtime(sessionfile);
  }
  // with clean option, we delete older redundant sessions
  if (clean) {
    for (const dir in usersessions) {
      const mtimes = usersessions[dir];
      let sessionids = Object.keys(mtimes);
      if (sessionids.length < 2) continue;
      sessionids = sessionids.sort((a, b) => (mtimes[b] - mtimes[a]));
      // remove older sessions
      const goodsess = sessionids.shift();
      for (const sessionid of sessionids) {
        const sessfile = path.join(process.ogesessionsdir, sessionid + '.json');
        fs.rm(sessfile);
        delete mtimes[sessionid];
      }
    }
  }
  const tolist = {};
  for (const dir in usersessions) {
    const mtimes = usersessions[dir];
    for (const sessionid in mtimes) {
      tolist[`${sessionid} (${dir})`] = mtimes[sessionid];
    }
  }
  const listorder = Object.keys(tolist).sort((a, b) => (
    tolist[b] - tolist[a]
  ));
  return listorder;
}

export function makeSession(opts) {
  // create new object
  const sess = deepAssign(opts, {});
  // clear null values
  for (const k in sess) {
    if (sess[k] == null) delete sess[k];
  }
  if (!sess?.dir) return {
    error: 'Cannot create session. No directory specified.'
  }
  if (!sess?.files) sess.files = [];
  if (!sess?.sessionid) {
    const sessbn = path.basename(sess?.dir).replace(/[^0-9a-z_-]/gi,'');
    do {
      sess.sessionid = randomString(8) + '-' + sessbn;
    } while (fs.isfile(path.join(
      process.ogesessionsdir, sess.sessionid + '.json')));
  }
  if (!("expires" in sess)) sess.expires = 0;
  const sessfile = path.join(process.ogesessionsdir, sess.sessionid + '.json');
  if (fs.isfile(sessfile)) return {
    error: `Session with sessionid ${sess.sessionid} already exists.`
  }
  if (!fs.savejson(sessfile, sess)) return {
    error: `Could not save session with id ${sess.sessionid}.`
  }
  return sess;
}

export function sessionUrl(urlopts) {
  let https = urlopts?.https ?? process.ogesettings?.https ?? false;
  let domain = urlopts?.domain ?? process.ogesettings?.domain ??
    process.ogesettings?.host ?? 'localhost';
  if (domain.startsWith('https://')) {
    domain = domain.substring(8);
    https = true;
  }
  if (domain.startsWith('http://')) {
    domain = domain.substring(7);
    https = false;
  }
  domain = domain.replace(/\/$/,'');
  let port = urlopts?.port ?? process?.ogesettings?.port ??
    process?.env?.OGETESTSERVERPORT ??
    ((https) ? 443 : 80);
  let useport = true;
  if (port == 443) {
    https = true;
    useport = false;
  }
  if (port == 80) {
    https = false;
    useport = false;
  }
  if (!("sessionid" in urlopts)) return null;
  return 'http' + ((https) ? 's' : '') + '://' +
    domain + ((useport) ? ':' + port.toString() : '') +
    '/oge/' + urlopts.sessionid;
}
