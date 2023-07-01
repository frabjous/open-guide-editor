// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

///////////////////////// html/viewer.mjs ///////////////////////////////
// creates and controls the viewer for html files                      //
/////////////////////////////////////////////////////////////////////////

window.viewerparent = {};
window.htmliframe = {}

window.onload = function() {
    window.viewerparent = document.getElementById("viewerparent");
    window.htmliframe = newElem('iframe', window.viewerparent);
    window.htmliframe.src =
        'html/gethtml.php?file=' + encodeURIComponent(window.outputfile);
}
