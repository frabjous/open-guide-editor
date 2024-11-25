import fs from '../fs.mjs';
import path from 'node:path';

export default async function listfiles(reqdata, sessioninfo) {
  if (!("files" in reqdata) || !reqdata?.files?.length) {
    return { error: 'Invald files requested to be created.' }
  }
  for (const f of reqdata.files) {
    const ffn = path.join(sessioninfo.dir, f);
    if (!ffn.startsWith(sessioninfo.dir)) return {
      error: 'Cannot create file outside session directory.'
    }
    if (!fs.savefile(ffn, '')) {
      return {error: 'Could not save new file: ' + ffn}
    }
  }
  return {success: true};
}