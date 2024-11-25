import path from 'node:path';
import fs from '../fs.mjs';

export default async function settingsoptions(reqdata, sessioninfo) {
  const colorsdir = path.join(process.__dirname, 'public', 'style', 'colors');
  const fontsdir = path.join(process.__dirname, 'public', 'style', 'fonts');
  const colorschemes = fs.filesin(colorsdir)
    .filter((s) => (s.endsWith('.css')))
    .map((s) => (path.basename(s, '.css')))
    .sort((a, b) => (a.localeCompare(b)));
  const fonts = fs.filesin(fontsdir)
    .filter((s) => (s.endsWith('css')))
    .map((s) => (path.basename(s, '.css')));
  return {colorschemes, fonts};
}