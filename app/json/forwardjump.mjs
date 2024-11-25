import path from 'node:path';
import fs from '../fs.mjs';
import execAsync from '../execAsync.mjs';
import fillvariables from '../fillvariables.mjs';
import jobsettings from '../jobsettings.mjs';

export default async function forwardjump(reqdata, sessioninfo) {
  const {inputext, outputext, outputfile, rootdocument, currentfile,
    line} = reqdata;
  const settings = jobsettings(sessioninfo);
  const routine = settings?.routines?.[inputext]?.[outputext];
  if (!routine?.forwardjump) return {page: false};
  const cmd = fillvariables(routine.forwardjump, {
    '%line%': line.toString(),
    '%outputfile%': outputfile,
    '%rootdocument%': rootdocument,
    '%savedfile%': currentfile,
    '%currentfile%': currentfile
  });
  const jcmdres = await execAsync(cmd, sessioninfo.dir);
  const pagenum = parseInt(jcmdres.stdout.trim());
  if (isNaN(pagenum)) return {page: false};
  return {page: pagenum};
}
