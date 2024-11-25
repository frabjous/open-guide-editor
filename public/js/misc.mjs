// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: misc.mjs
// Some widely used generic functions for page manipulation, etc., used
// by many other scripts.

export function addelem(opts) {
  if (!("tag" in opts)) { return null; }
  const elem = document.createElement(opts.tag);
  if ("classes" in opts) {
    elem.classList.add(...opts.classes);
  }
  if ("tooltip" in opts) {
    elem.setAttribute("data-tooltip", opts.tooltip);
  }
  for (const opt in opts) {
    if (opt == "tag" || opt == "classes" || opts == "parent" ||
        opt == "children" || opts == "tooltip") continue;
    elem[opt] = opts[opt];
  }
  let parent;
  if (opts?.parent) {
    if (typeof opts.parent == 'string') {
      parent = by(id);
    } else {
      parent = opts.parent;
    }
  }
  if (parent) { parent.appendChild(elem); }
  if (("children" in opts) && (opts.children.length > 0)) {
    for (const child of opts.children) {
      if (!("parent" in child)) {
        child.parent = elem;
      }
      addelem(child);
    }
  }
  return elem;
}

export function basename(path) {
  return path.replace(/.*\//,'');
}

export function byid(id) {
  return document.getElementById(id);
}

export function extensionOf(path) {
  if (!path) return null;
  const bn = basename(path);
  if (!bn.substring(1).includes('.')) return;
  return bn.replace(/.*\./,'').toLowerCase();
}

export function htmlesc(s) {
  return s.replaceAll('&','&amp;')
    .replaceAll('<','&lt')
    .replaceAll('>','&gt');
}

export function iconOf(icon) {
  return '<span class="material-symbols-outlined">' + icon + '</span>';
}
