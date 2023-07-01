// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

///////////////////////// html/viewer.mjs ///////////////////////////////
// creates and controls the viewer for html files                      //
/////////////////////////////////////////////////////////////////////////

window.viewerparent = {};
window.htmliframe = {}

function getIframeSrc() {
    return  'html/gethtml.php?file=' +
        encodeURIComponent(window.outputfile) + '&ts=' +
        (new Date()).getTime().toString();
}

window.onload = function() {
    window.viewerparent = document.getElementById("viewerparent");
    window.htmliframe = newElem('iframe', window.viewerparent);
    window.htmliframe.src = getIframeSrc();
       
}

window.onmessage() {

}
