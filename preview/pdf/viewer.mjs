// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

///////////////////////// pdf/viewer.mjs ////////////////////////////////
// creates and controls the viewer for pdf files                       //
/////////////////////////////////////////////////////////////////////////

import downloadFile from '../../open-guide-misc/download.mjs';

window.viewerparent = {};
window.pdfimageholder = {}

// download the pdf
function downloadOutput() {
    // determine basename of outputfile
    const outputsplit = window.outputfile.split('/');
    const outputbase = outputsplit[ outputsplit.length - 1 ];
    // url is sake
    const url = '../php/downloadfile.php?filename=' +
        encodeURIComponent(window.outputfile);
    return downloadFile(url, outputbase);
}

// function get the right src url for the preview imageholder
function getimageholderSrc(download = false) {
    let h= 'pdf/getpdf.php?file=' +
        encodeURIComponent(window.outputfile) + '&ts=' +
        (new Date()).getTime().toString();
    // mark as download if requested
    if (download) { h += '&download=true' };
    return h;
}

window.onload = function() {
    window.panel = document.getElementById("toppanel");
    window.viewerparent = document.getElementById("viewerparent");
    window.pdfimageholder = newElem('imageholder', window.viewerparent);
    window.pdfimageholder.src = getimageholderSrc(false);
    window.panel.downloadButton = panelButton({
        "normal" : {
            icon: "download",
            tooltip: "download pdf file",
            clickfn: function() { downloadOutput(); }
        }
    });
    window.panel.downloadButton.makeState("normal");
    window.sendmessage({ loaded: true });
}

window.viewerrefresh = function(opts) {
    window.pdfimageholder.contentWindow.location.reload();
    window.sendmessage({ refreshed: true });
}
