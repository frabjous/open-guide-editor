// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: jsonresponse.mjs
// Exports a relatively generic function for making json requests

const handlers = {};

export default async function jsonresponse(reqdata, sessioninfo) {
  if (!("reqtype" in reqdata)) return {
    error: 'No request type specified.'
  }
  const reqtype = reqdata.reqtype;
  if (!(reqtype in handlers)) {
    try {
      const imported = await import('./json/' + reqtype + '.mjs');
      handlers[reqtype] = imported.default;
    } catch(err) {
      return {
        error: `Could not import ${reqtype}.mjs; ${err.toString()}`
      }
    }
  }
  if (!handlers?.[reqtype]) return {
    error: `Unable to import ${reqtype}.mjs`
  }
  const respdata = await handlers[reqtype](reqdata, sessioninfo);
  return respdata;
}
