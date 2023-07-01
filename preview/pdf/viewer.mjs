// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

///////////////////////// pdf/viewer.mjs ////////////////////////////////
// creates and controls the viewer for pdf files                       //
/////////////////////////////////////////////////////////////////////////

import downloadFile from '../../open-guide-misc/download.mjs';

window.viewerparent = {};
window.pdfimageholder = {};
window.pdfpage = 1;
window.pdfzoom = 100;

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

function getPDFPageURL() {
    return 'pdf/getpdfpage.php?filename=' +
        encodeURIComponent(window.outputfile) +
        '&page=' + (window.pdfpage).toString() +
        '&ts=' + (new Date()).getTime().toString();
}

window.onload = function() {
    window.panel = document.getElementById("toppanel");
    window.viewerparent = document.getElementById("viewerparent");
    window.pdfimageholder = newElem('div', window.viewerparent);
    window.pdfimageholder.id = 'pdfimageholder';
    window.pdfpage = newElem('img', window.pdfimageholder);
    window.pdfpage.id = 'pdfpage';
    window.pdfpage.src = getPDFPageURL();
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
