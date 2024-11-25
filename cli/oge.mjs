#!/usr/bin/env node

// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File oge.mjs
// Tool for creating and launching oge instances from command line
// Stdout is list of appropriate URLs

import fs from '../app/fs.mjs';
import path from 'node:path';
import {
  bestSessionDir,
  listSessions,
  makeSession,
  sessionUrl
} from '../app/sessions.mjs';
import gettemplate from '../app/json/template.mjs';
import determinedirs from '../app/determinedirs.mjs';
import {fileURLToPath} from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __ogedirname = path.dirname(__filename);
process.__ogedirname = __ogedirname;

const {ogesettings, ogedatadir, ogesessionsdir} = determinedirs();

const executor = process.argv.shift();
const scriptname = process.argv.shift();

function rageQuit(msg) {
  console.error('Error: ' + msg);
  process.exit(1);
}

function nextArg(optname, numeric = false) {
  if (process.argv.length == 0) {
    rageQuit(`Option ${optname} requires an argument.`)
  }
  const next = process.argv.shift();
  if (next.startsWith('-')) {
    rageQuit(`Option ${optname} requires an argument.`)
  }
  if (numeric) {
    const number = parseInt(next);
    if (isNaN(number)) {
      rageQuit(`Option ${optname} requires a numeric argument.`)
    }
    return number;
  }
  return next;
}

function showHelp() {
  console.log(`
USAGE: ${scriptname} [options] [file1] [file2] ...

OPTIONS:
--                  Stop reading options (allows opening files named --*, etc.)
--clean             Deletes old or redundant sessions for user if using --sessionlist
--color [name]      Set colorscheme for editor
--domain [name]     Set domain for url (same as --host)
--expires [time]    Set expiration time; provide something readable by js Date()
--font [name]       Set font name for editor
--help              Show this help
--host [name]       Set host for url (same as --domain)
--https             Use https rather than http in url
--port [n]          Set port for url
--root              Makes first file named the root document for session
--sessiondir [dir]  Explicitly set session base directory
--sessionid [id]    Explicitly give sessionid rather than create random one
--sessionlist       Lists available sessions for user instead of urls, then quits
--template          Fill new files with template 1 for extension
--templates [dir]   Explicitly set directory to look for templates
--user [name]       Set user for session

Creates OGE session or sessions to edit files listed. If --sessiondir not
used, it will try to determine the session directory by looking for deepest
parent directory with a '.git' subdirectory, or 'package.json' or
'oge-settings.json' files. If none are found, it will use the file’s own
directory.

Stdout should be a list of URLs, one per line.`);
}

const files = [];
const sessions = {};
let clean = false;
let colorscheme = null;
let domain = null;
let expires = 0;
let firstisroot = false;
let font = null;
let https = false;
let port = null;
let readops = true;
let sessiondir = null;
let sessionid = null;
let sessionlist = false;
let templatesdir = null;
let user = null;
let usetemplate = false;


while (process.argv.length > 0) {
  let arg = process.argv.shift();
  if (readops && arg == '--') {
    readops = false;
    continue;
  }
  if (readops && arg.startsWith('-')) {
    arg = arg.replace(/^-*/,'').toLowerCase();
    if (arg == 'clean') {
      clean = true;
      continue;
    }
    if (arg == 'color' || arg == 'colors' ||
      arg == 'c' || arg == 'colorscheme') {
      colorscheme = nextArg(arg);
      continue;
    }
    if (arg == 'domain' || arg == 'host') {
      domain = nextArg(arg);
      continue;
    }
    if (arg == 'expires') {
      let exptime = nextArg('expires');
      if (/^[0-9]+$/.test(exptime)) exptime = parseInt(exptime);
      let expDO = new Date(exptime);
      if (isNaN(expDO)) {
        rageQuit(`Expiration time ${exptime} invalid.`);
      }
      expires = expDO.getTime();
      continue;
    }
    if (arg == 'font' || arg == 'fontfamily' ||
        arg == 'f' || arg == 'font-family') {
      font = nextArg(font);
      continue;
    }
    if (arg == '?' || arg == 'h' || arg == 'help') {
      showHelp();
      process.exit(0);
    }
    if (arg == 'http') {
      https = false;
      continue;
    }
    if (arg == 'https') {
      https = true;
      continue;
    }
    if (arg == 'port' || arg == 'portnum' || arg == 'p') {
      port = nextArg(arg, true);
      continue;
    }
    if (arg == 'root' || arg == 'rootdoc' || arg == 'r' ||
      arg == 'rootfile' || arg == 'rootdocument') {
      firstisroot = true;
      continue;
    }
    if (arg == 'sessiondir') {
      sessiondir = nextArg('sessiondir');
      continue;
    }
    if (arg == 'sessionid' || arg == 'session') {
      sessionid = nextArg('sessionid');
      continue;
    }
    if (arg == 'sessionlist') {
      sessionlist = true;
      continue;
    }
    if (arg == 'template' || arg == 'usetemplate' ||
       arg == 't') {
      usetemplate = true;
      continue;
    }
    if (arg == 'templates' || arg == 'templatesdir') {
      templatesdir = nextArg(arg);
      continue;
    }
    if (arg == 'user' || arg == 'username' || arg == 'u') {
      user = nextArg(arg);
      continue;
    }
    rageQuit(`Option --${arg} unrecognized.`)
    continue;
  }
  files.push(arg);
}

if (sessionlist) {
  if (!user) {
    rageQuit('A user must be listed when listing sessions.');
  }
  console.log(listSessions(user, clean).join('\n'));
  process.exit(0);
}

if (files.length == 0) {
  showHelp();
  rageQuit('No files specified.');
}

// ensure colorscheme and font are legit, and fix spaces to underscores

if (colorscheme) {
  colorscheme = colorscheme.replace(/\.css$/i,'').replaceAll(' ','_');
  const colorschemedir = path.resolve(
    __ogedirname, '..', 'public', 'style', 'colors'
  );
  const colorfile = path.join(colorschemedir, colorscheme + '.css');
  if (!fs.isfile(colorfile)) {
    rageQuit(`Colorscheme ${colorscheme} not found.`);
  }
}

if (font) {
  font = font.replace(/\.css$/i,'').replaceAll(' ','_');
  const fontsdir = path.resolve(
    __ogedirname, '..', 'public', 'style', 'fonts'
  );
  const fontfile = path.join(fontsdir, font + '.css');
  if (!fs.isfile(fontfile)) {
    rageQuit(`Font ${font} not found.`);
  }
}

// ensure specified directories exist

if (templatesdir && !fs.isdir(templatesdir)) {
  rageQuit(`Template directory ${templatesdir} not found.`);
  templatesdir = path.resolve(templatesdir);
}

if (sessiondir && !fs.isdir(sessiondir)) {
  rageQuit(`Session directory ${sessiondir} not found.`);
}
if (sessiondir) sessiondir = path.resolve(sessiondir);
if (templatesdir) templatesdir = path.resolve(templatesdir);

for (const file of files) {
  const ffn = path.resolve(file);
  const sdir = sessiondir ?? bestSessionDir(ffn);
  if (!ffn.startsWith(sdir)) {
    rageQuit(`File ${file} not within session directory ${sdir}`);
  }
  const relpath = ffn.substring(sdir.length + 1);
  if (!(sdir in sessions)) {
    sessions[sdir] = {
      dir: sdir,
      expires,
      files: [],
      user,
      colorscheme,
      font,
      sessionid
    };
    if (templatesdir) {
      sessions[sdir].ogeoverride = {
        templates: templatesdir
      }
    }
    if (firstisroot) {
      if (!sessions[sdir]?.ogeoverride) {
        sessions[sdir].ogeoverride = {};
      }
      sessions[sdir].ogeoverride.rootdocument = relpath;
    }
  }
  sessions[sdir].files.push(relpath);
}

const sessids = [];
for (const sessdir in sessions) {
  const sess = makeSession(sessions[sessdir]);
  if (sess?.error) {
    rageQuit(sess.error);
  }
  sessids.push(sess.sessionid);
}

// use templates if requested
if (usetemplate) {
  for (const sessdir in sessions) {
    const sess = sessions[sessdir];
    for (const file of sess.files) {
      const fullpath = path.join(sess.dir, file);
      if (fs.isfile(fullpath)) continue;
      const ext = path.extname(fullpath).substring(1);
      if (!ext || ext == '') continue;
      const tmpres = await gettemplate({
        templateext: ext,
        templatenum: 1
      }, sess);
      if (!tmpres || !tmpres.template) continue;
      fs.savefile(fullpath, tmpres.template);
    }
  }
}

// report URLs
for (const sessionid of sessids) {
  const url = sessionUrl({
    sessionid,
    https,
    port,
    domain
  });
  if (url) console.log(url);
}
