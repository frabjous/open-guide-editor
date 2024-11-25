
import path from 'node:path';
import fs from '../fs.mjs';
import savesession from '../savesession.mjs';

export default async function getfiles(reqdata, sessioninfo) {
  const respdata = { files: [], dir: sessioninfo.dir };
  let files = reqdata?.files ?? [];
  let fullfilenames = files.map((fn) =>
    (path.resolve(sessioninfo.dir, fn)));
  // ensure no tricks with '..' etc;
  if (fullfilenames.some(ffn => (!ffn.startsWith(sessioninfo.dir)))) {
    return { error: 'Some files requested not in proper directory' }
  }
  // get rid of nonexistent files
  fullfilenames = fullfilenames.filter(ffn => fs.isfile(ffn));
  files = files.filter((fn) =>
    (fullfilenames.includes(path.resolve(sessioninfo.dir, fn))));
  let oldfiles = sessioninfo?.files ?? [];
  oldfiles = oldfiles.filter(fn => (
    fs.isfile(path.resolve(sessioninfo.dir, fn))
  ));
  // add new files to session list
  const newfiles = [...(new Set([...files, ...oldfiles]))];
  sessioninfo.files = newfiles;
  // save new session in background
  savesession(sessioninfo);
  for (const ffn of fullfilenames) {
    respdata.files.push({
      content: fs.readfile(ffn),
      name: ffn.substring(sessioninfo.dir.length + 1)
    });
  }
  return respdata;
}
