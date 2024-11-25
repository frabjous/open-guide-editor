// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: panels.mjs
// Functions for creating panels/buttons used by both editor and preview

import {addelem, byid, iconOf} from './misc.mjs';

export function panelButton(subpanel, states) {
  const btn = addelem({
    tag: 'button',
    parent: subpanel,
    type: 'button',
    classes: ['oge-panel-button']
  });
  btn.states = states;
  btn.setstate = setstate;
  return btn;
}

function setstate(state) {
  if (!(state in this.states)) {
    console.error('Button assigned invalid state ' + state);
    return;
  }
  const cssclasses = [...this.classList].filter(
    (x) => (x != 'oge-panel-button')
  );
  this.classList.remove(...cssclasses);
  if ("classes" in this.states[state]) {
    this.classList.add(...this.states[state].classes);
  }
  if ("icon" in this.states[state]) {
    this.innerHTML = iconOf(this.states[state].icon)
  }
  if ("onclick" in this.states[state]) {
    this.onclick = this.states[state].onclick;
  }
  if ("title" in this.states[state]) {
    this.title = this.states[state].title;
  }
  if (this.states[state]?.disabled) {
    this.disabled = true;
  } else {
    this.disabled = false;
  }
  this.currentstate = state;
}
