
import path from 'node:path';
import fs from './fs.mjs';

const sessionsdir = path.join(
  process.env.HOME,
  '.local', 'share', 'oge', 'sessions'
);

export default async function savesession(sessioninfo) {
  if (!("sessionid" in sessioninfo)) return null;
  const sessionid = sessioninfo.sessionid;
  const res = await fs.async.savejson(
    path.join(sessionsdir, sessionid +'.json'),
    sessioninfo
  );
  return res;
}
