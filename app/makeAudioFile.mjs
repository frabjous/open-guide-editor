// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: makeAudioFile.mjs
// processes request to create an mp3 from text for TTS

import {execSync} from 'node:child_process';
import path from 'node:path';
import fs from './fs.mjs';
import fillvariables from './fillvariables.mjs';
import jobsettings from './jobsettings.mjs';

export default function makeAudioFile(sessioninfo, inputext, text) {
  const audiodir = process.ogeaudiodir;
  const sessionaudiodir = path.join(audiodir, sessioninfo.sessionid);
  if (!fs.ensuredir(sessionaudiodir)) return null;
  const settings = jobsettings(sessioninfo);
  if (!settings?.readaloud?.[inputext]?.command) return null;
  if (settings.readaloud?.substitutions) {
    const substitutions = settings.readaloud?.substitutions;
    for (const subst in substitutions) {
      text = text.replaceAll(subst, substitutions[subst]);
    }
  }
  const audiofile = path.join(sessionaudiodir, 'oge-audio.mp3');
  const cmd = fillvariables(settings.readaloud[inputext].command, {
    '%audiofile%': audiofile
  })
  try {
    execSync(cmd, {
      encoding: 'utf-8',
      input: text,
      cwd: sessioninfo.dir
    });
  } catch(err) {
    return null;
  }
  if (!fs.isfile(audiofile)) return null;
  return audiofile;
}