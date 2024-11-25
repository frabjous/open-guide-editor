// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: deepAssign.mjs
// Exports a function for recursively assigning properties from one
// object to another, without modifying initial object

export default function deepAssign(a, b) {
  return deepAssignStage(a, structuredClone(b))
}

function deepAssignStage(a, b) {
  // with a type mismatch just return clone of a
  if ((typeof a) != (typeof b) ||
    (Array.isArray(a) && !Array.isArray(b)) ||
    (!Array.isArray(a) && Array.isArray(b))) {
    return structuredClone(a);
  }
  // if it is an array, we clone each value recursively
  if (Array.isArray(a)) {
    // recursively clone values of the array up to the
    // length they both share
    const sharedlen = Math.min(a.length, b.length);
    for (let i=0; i < sharedlen; i++) {
      b[i] = deepAssignStage(a[i], b[i]);
    }
    // if there are more a values, just clone them
    if (a.length > b.length) {
      for (let i = b.length; i< a.length; i++) {
        b.push(strucutedClone(a[i]));
      }
    }
    // (if there are more b values, they should already be what we want)
    return b;
  }

  // for objects we recursively clone shared values
  if (typeof a == 'object') {
    for (const key in a) {
      // if b does not have key, we clone a's value
      if (!(key in b)) {
        b[key] = structuredClone(a[key]);
        continue;
      }
      // otherwise we recurse on it
      b[key] = deepAssignStage(a[key], b[key]);
    }
    return b;
  }
  // for non-object, non-arrays, it is safe to pass
  // back a, as those are copied not referred
  return a;
}
