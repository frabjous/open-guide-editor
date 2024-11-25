
import path from 'node:path';
import fs from './fs.mjs';

export function saveuserinfo(username, userinfo) {
  const userdir = process.userdir;
  const myfile = path.join(userdir, username, 'prefs.json');
  return fs.savejson(myfile, userinfo);
}

export function readuserinfo(username) {
  const userdir = process.userdir;
  const myfile = path.join(userdir, username, 'prefs.json');
  return fs.loadjson(myfile);
}