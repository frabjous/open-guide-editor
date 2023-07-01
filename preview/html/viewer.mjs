// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

///////////////////////// html/viewer.mjs ///////////////////////////////
// creates and controls the viewer for html files                      //
/////////////////////////////////////////////////////////////////////////

import downloadFile from '../../open-guide-misc/download.mjs';
    
window.viewerparent = {};
window.htmliframe = {}

function downloadOutput() {
    // determine basename of outputfile
    const outputsplit = window.outputfile.split('/');
    const outputbase = outputsplit[ outputsplit.length - 1 ];
    // url is sake
    const url = getIframeSrc(true);
    return downloadFile(url, outputbase);
}

// function get the right src url for the preview iframe
function getIframeSrc(download = false) {
    let h= 'html/gethtml.php?file=' +
        encodeURIComponent(window.outputfile) + '&ts=' +
        (new Date()).getTime().toString();
    // mark as download if requested
    if (download) { h += '&download=true' };
    return h;
}

window.onload = function() {
    window.panel = document.getElementById("toppanel");
    window.viewerparent = document.getElementById("viewerparent");
    window.htmliframe = newElem('iframe', window.viewerparent);
    window.viewerrefresh();
    window.panel.downloadButton = panelButton({
        "normal" : {
            icon: "download",
            tooltip: "download html file",
            clickfn: function() { downloadOutput(); }
        }
    });
    window.panel.downloadButton.makeState("normal");
}

window.viewerrefresh = function(opts) {
    window.htmliframe.src = getIframeSrc(false);
    window.sendmessage({ refreshed: true });
}
