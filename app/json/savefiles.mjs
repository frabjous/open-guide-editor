// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: savefiles.mjs
// Processes JSON requests to save and process files

import {htmlesc} from '../../public/js/misc.mjs';
import path from 'node:path';
import fs from '../fs.mjs';
import savesession from '../savesession.mjs';
import execAsync from '../execAsync.mjs';
import fillvariables from '../fillvariables.mjs';
import jobsettings from '../jobsettings.mjs';

export default async function savefiles(reqdata, sessioninfo) {
  const settings = jobsettings(sessioninfo);
  let files = reqdata?.files ?? [];
  const respdata = {success: true};
  for (const file of files) {
    if (!file?.filename) return { error: 'Not all files given filenames.'}
    file.ffn = path.resolve(sessioninfo.dir, file.filename);
    if (!file.ffn.startsWith(sessioninfo.dir)) {
      return { error: 'Some files to be saved not in proper directory.' }
    }
  }
  for (const file of files) {
    if (!file?.contents) return {
      saveerror: `No content provided for ${file.filename}.`
    }
    if (!fs.savefile(file.ffn, file.contents)) return {
      saveerror: `Unable to save file ${file.filename}.`
    }
  }
  if (settings?.checkonsave) {
    for (const file of files) {
      const bn = path.basename(file.ffn);
      const glob = '*' + path.extname(bn);
      let checkcmd =
        settings.checkonsave?.[bn] ??
        settings.checkonsave?.[glob];
      if (!checkcmd) continue;
      checkcmd = checkcmd.replaceAll('%savedfile%', '"' + file.ffn + '"');
      const checkres = await execAsync(checkcmd, sessioninfo.dir);
      if (checkres.exitcode != 0) {
        if (!respdata.checkonsaveerrors) respdata.checkonsaveerrors = {};
        respdata.checkonsaveerrors[file.filename] = checkres.stderr;
      }
    }
  }
  // do not process if there are checkonsave errors
  if (respdata?.checkonsaveerrors) return respdata;

  if ((typeof reqdata.gitcommit) == 'string') {
    const commitRes = await execAsync(
      `git add "$(git rev-parse --show-toplevel)" && ` +
      `git commit -m "${reqdata.gitcommit}"`,
      sessioninfo.dir
    );
    if (commitRes.exitcode != 0) {
      return {
        giterror: 'Git error: ' +
          (commitRes.stderr || commitRes.stdout)
      }
    }
    // push in background
    execAsync(
      `git push --all --follow-tags`,
      sessioninfo.dir
    );
  }

  if (reqdata.process) {
    let rootfile = settings?.rootdocument;
    if (!rootfile) {
      rootfile = reqdata?.actingroot;
    }
    if (!rootfile) return {
      processerror: 'Could not determine which document to process.'
    }
    const inputext = path.extname(rootfile).substring(1).toLowerCase();
    if (!inputext || inputext === '') return {
      processerror: 'Could not determine input file extension.'
    }
    const inroutines = settings?.routines?.[inputext];
    if (!inroutines) return {
      processerror: `Could not find any processing routines for ${inputext} files.`
    }
    const outputext = (reqdata?.outputext) ?? (inroutes?.defaultext);
    if (!outputext) return {
      processerror: `Could not determine file type/extension of output.`
    }
    if (!inroutines?.[outputext]) return {
      processerror: `Could not find routine for processing ${inputext} to ${outputext}.`
    }
    const routine = inroutines[outputext];
    if (!routine?.command) return {
      processerror: `No command set for routine (${inputext} to ${outputext}.`
    }
    const outputfile = (routine?.outputfile) ?? path.join(
      path.dirname(rootfile),
      path.basename(rootfile, path.extname(rootfile)) + '.' + outputext
    );
    const savedfile = (reqdata?.currentfile) ||
      ((files.length == 1) ? files[0].filename : null) ||
      rootfile;
    const jobvariables = {
      '%outputfile%': outputfile,
      '%rootdocument%': rootfile,
      '%savedfile%': savedfile
    };
    const command = fillvariables(routine.command, jobvariables);
    // outputfile, rootdocument, savedfile
    const processResults = await execAsync(command, sessioninfo.dir);
    if (processResults.exitcode !== 0) return {
      processerror: `Processing command failed (exit code ` +
        `${processResults.exitcode}).<pre>` +
        `${htmlesc(processResults.stderr)}</pre>`
    }
    respdata.processout = processResults.stdout;
    if (routine?.postprocess) {
      const postprocesscommand =
        fillvariables(routine.postprocess, jobvariables);
      const postProcessResults =
        await execAsync(postprocesscommand, sessioninfo.dir);
      if (postProcessResults.exitcode !== 0) return {
        processerror: `Post-processing failed (exit code ` +
        `${postProcessResults.exitcode}).<pre>` +
        `${htmlesc(postProcessResults.stderr)}</pre>`
      }
      respdata.postprocessout = postProcessResults.stdout;
    }
  }
  return respdata;
}
