// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: ogeRouter.mjs
// exports the router that can be mounted on an ExpressJS server

import express from 'express';
import randomString from './app/randomString.mjs';
import fs from './app/fs.mjs';
import jsonresponse from './app/jsonresponse.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import pdfpageRequest from './app/pdfpageRequest.mjs';
import makeAudioFile from './app/makeAudioFile.mjs';
import {readuserinfo} from './app/userinfo.mjs';
import determinedirs from './app/determinedirs.mjs';

// get script directory
const __filename = fileURLToPath(import.meta.url);
const __ogedirname = path.dirname(__filename);
const viewsdir = path.join(__ogedirname, 'views');
process.__ogedirname = __ogedirname;

const {ogesettings, ogedatadir, ogesessionsdir} = determinedirs();

async function fileRequest(req, res) {
  const sessionid = req?.params?.sessionid;
  if (!sessionid) {
    res.status(404).type('txt').send('Error 404 Not Found');
    return;
  }
  const sessioninfo = await getSessionInfo(sessionid);
  if (!sessioninfo || !sessioninfo?.dir) {
    res.status(401).type('txt').send('Error 401 Invalid Session');
    return;
  }
  const pathparts = req.originalUrl.split('/');
  pathparts.shift();
  const download = (pathparts.shift() == 'ogedownload');
  pathparts.shift();
  const realpath = path.join(sessioninfo.dir, ...pathparts);
  if (!realpath.startsWith(sessioninfo.dir)) {
    res.status(401).type('txt').send('Error 401 Invalid Session');
    return;
  }
  const exists = await fs.async.isfile(realpath);
  if (!exists) {
    res.status(404).type('txt').send('Error 404 Not Found');
    return;
  }
  if (download) {
    res.download(realpath);
    return;
  }
  res.sendFile(realpath);
}

// session data reading and validation function
async function getSessionInfo(sessionid) {
  const sessionfile = path.join(ogesessionsdir, sessionid + '.json');
  const sessioninfo = await fs.async.loadjson(sessionfile);
  if (!sessioninfo) return null;
  if (
    ("expires" in sessioninfo) &&
    sessioninfo.expires != 0 &&
    Date.now() > sessioninfo.expires
  ) {
    // delete expired session in background
    fs.async.rm(sessionfile);
    return null;
  }
  // sessions pointing to
  if (!sessioninfo?.dir) {
    fs.async.rm(sessionfile);
    return false;
  }
  const direxists = await fs.async.isdir(sessioninfo.dir);
  if (!direxists) {
    fs.async.rm(sessionfile);
    return null;
  }
  if (!("sessionid" in sessioninfo)) {
    sessioninfo.sessionid = sessionid;
  }
  // fill in colorscheme, delay
  if (sessioninfo?.user && (
    !sessioninfo?.font || !sessioninfo?.colorscheme
  )) {
    const userinfo = readuserinfo(sessioninfo.user);
    if (!sessioninfo?.font && userinfo?.font) {
      sessioninfo.font = userinfo.font;
    }
    if (!sessioninfo?.colorscheme && userinfo?.colorscheme) {
      sessioninfo.colorscheme = userinfo.colorscheme;
    }
  }
  return sessioninfo;
}

// function for filling pages with appropriate info
async function getHtmlPage(page, req, res) {
  let ogepage = await fs.async.readfile(path.join(viewsdir, page + '.html'));
  const sessionid = req?.params?.sessionid;
  if (!ogepage || !sessionid) {
    res.status(404).type('txt').send('Error 404 Not Found');
    return null;
  }
  const sessioninfo = await getSessionInfo(sessionid);
  if (sessioninfo === null || !sessioninfo?.dir) {
    res.status(401).type('txt').send('Error 401 Invalid Session');
    return null;
  }
  const localsettingsfile = path.join(sessioninfo.dir, 'oge-settings.json');
  const localsettings = fs.loadjson(localsettingsfile) ?? {};
  ogepage = ogepage.replace('window.sessioninfo = {}',
    'window.sessioninfo = ' + JSON.stringify(sessioninfo))
    .replace('window.globalogesettings = {}',
    'window.globalogesettings = ' + JSON.stringify(ogesettings))
    .replace('window.localogesettings = {}',
    'window.localogesettings = ' + JSON.stringify(localsettings));
  return ogepage;
}

const router = express.Router();

router.use('/ogepublic', express.static(
  path.join(__ogedirname, 'public')
));

router.use('/ogereverse', async function(req, res) {
  const s = req?.query?.s;
  if (!s) {
    res.status(401).type('txt').send('Error 401 Invalid Request');
    return;
  }
  const r = s.split('').reverse().join('');
  res.type('txt').send(r);
});

router.get('/oge/:sessionid', async function(req, res) {
  let ogepage = await getHtmlPage('index', req, res);
  if (!ogepage) return;
  res.send(ogepage);
});

router.get('/ogepreview/:sessionid', async function(req, res) {
  let ogepage = await getHtmlPage('preview', req, res);
  if (!ogepage) return;
  res.send(ogepage);
});

router.get('/ogepreviewfile/:sessionid/*', async function(req, res) {
  return await fileRequest(req, res);
});

router.get('/ogedownload/:sessionid/*', async function(req, res) {
  return await fileRequest(req, res);
});

router.get('/ogepdfpage/:pagenum/:ts/:sessionid/*', async function(req, res) {
  const sessionid = req?.params?.sessionid;
  const sessioninfo = await getSessionInfo(sessionid);
  if (!sessioninfo) {
    res.status(401).type('txt').send('Error 401 Invalid Session');
    return;
  }
  return await pdfpageRequest(req, res, sessioninfo);
});

router.get('/ogeaudio/:sessionid/:inputext/oge-audio.mp3',
  async function(req, res) {
    const sessionid = req?.params?.sessionid;
    const sessioninfo = await getSessionInfo(sessionid);
    if (!sessioninfo) {
      res.status(401).type('txt').send('Error 401 Invalid Session');
      return;
    }
    const text = req?.query?.text;
    if (!text) {
      res.status(404).type('txt').send('Error 404 Not Found');
      return;
    }
    const fileloc = makeAudioFile(sessioninfo, req.params.inputext, text);
    if (!fileloc) {
      res.status(500).type('txt').send('Error 500 Cannot create audio file');
      return;
    }
    res.sendFile(fileloc);
});

// process json requests
router.use('/ogejson/*', express.json({limit: '10mb'}));

router.post('/ogejson/:sessionid', async function(req, res) {
  if (!req?.body) {
    res.json({error: 'Invalid request.'});
    return;
  }
  if (!("sessionid" in req.params)) {
    res.json({error: 'No session id provided.'});
    return;
  }
  const sessioninfo = await getSessionInfo(req.params.sessionid);
  if (!sessioninfo) {
    res.json({error: 'Invalid session.'});
    return;
  }
  if (!req?.body?.dir || req.body.dir != sessioninfo?.dir) {
    res.json({error: 'Requested dir does not match session info.'});
    return;
  }

  const returninfo = await jsonresponse(req.body, sessioninfo);
  res.json(returninfo);
});

export default router;
