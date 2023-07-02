// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

///////////////////////// html/viewer.mjs ///////////////////////////////
// creates and controls the viewer for html files                      //
/////////////////////////////////////////////////////////////////////////

import downloadFile from '../../open-guide-misc/download.mjs';

window.viewerparent = {};
window.htmliframe = {}

// download the outputfile
function downloadOutput() {
    // determine basename of outputfile
    const outputsplit = window.outputfile.split('/');
    const outputbase = outputsplit[ outputsplit.length - 1 ];
    // url is same but with download set to true
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

// set up the viewer initially
window.onload = function() {
    window.panel = document.getElementById("toppanel");
    window.viewerparent = document.getElementById("viewerparent");
    // create an iframe and set its src
    window.htmliframe = newElem('iframe', window.viewerparent);
    window.htmliframe.src = getIframeSrc(false);
    // create button for downloading the html
    window.panel.downloadButton = panelButton({
        "normal" : {
            icon: "download",
            tooltip: "download html file",
            clickfn: function() { downloadOutput(); }
        }
    });
    window.panel.downloadButton.makeState("normal");
    // tell the editor we've loaded
    window.sendmessage({ loaded: 'html' });
}

// reload the html file
window.viewerrefresh = function(opts) {
    window.htmliframe.contentWindow.location.reload();
    window.sendmessage({ refreshed: true });
}
