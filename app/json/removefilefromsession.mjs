
import savesession from '../savesession.mjs';

export default async function removefilefromsession(reqdata, sessioninfo) {
  const filename = reqdata?.filename;
  if (!filename) return { error: 'No filename specified.' }
  sessioninfo.files = sessioninfo.files.filter((x) => (x != filename));
  return { success: savesession(sessioninfo) };
}
