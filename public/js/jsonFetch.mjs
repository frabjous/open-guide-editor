// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: jsonFetch.mjs
// A relatively generic function for making json requests to server

export default async function jsonFetch(url = "", data = {}) {
  let response = null;
  let rv = null;
  try {
    response = await fetch(url, {
      method: "POST",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify(data)
    });
    rv = await response.json();
  } catch(err) {
    console.error(err);
    return { error: err };
  }
  if (rv === null || rv === undefined ) {
    return null;
  }
  return rv;
}
