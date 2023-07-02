// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

///////////////////////// pdf/viewer.mjs ////////////////////////////////
// creates and controls the viewer for pdf files                       //
/////////////////////////////////////////////////////////////////////////

import downloadFile from '../../open-guide-misc/download.mjs';

window.viewerparent = {};
window.numpdfpages = {};
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

// gets image src
function getPDFPageURL() {
    return 'pdf/getpdfpage.php?filename=' +
        encodeURIComponent(window.outputfile) +
        '&page=' + (window.pdfpage).toString() +
        '&rootfile=' + encodeURIComponent(window.rootfile) +
        '&editedfile=' + encodeURIComponent(window.filename) +
        '&ts=' + (new Date()).getTime().toString();
}

// change string from postprocessing stdout to number
function readNumPages(sdata) {
    return parseInt(sdata.trim());
}

// set the viewer to a certain pdf page
function setPDFPage(n) {
    if (n > window.numpdfpages) { n = window.numpdfpages; }
    if (n < 1) { n = 1; }
    // TODO: page widgets
    window.pdfpage = n;
    window.pdfimg.src = getPDFPageURL();
}

window.onload = function() {
    // create the panel and put into place
    window.panel = document.getElementById("toppanel");
    window.viewerparent = document.getElementById("viewerparent");
    // create div for img
    window.pdfimageholder = newElem('div', window.viewerparent);
    window.pdfimageholder.id = 'pdfimageholder';
    // create image element
    window.pdfimg = newElem('img', window.pdfimageholder);
    window.pdfimg.id = 'pdfpage';
    // set number of pages based on postprocessdata
    window.numpdfpages = readNumPages(window.postprocessdata);
    // open first page of PDF
    setPDFPage(window.pdfpage);
    // create download button
    window.panel.downloadButton = panelButton({
        "normal" : {
            icon: "download",
            tooltip: "download pdf file",
            clickfn: function() { downloadOutput(); }
        }
    });
    // create download button
    window.panel.prevButton = panelButton({
        "normal" : {
            icon: "arrow_back",
            tooltip: "previous page",
            clickfn: function() { previousPage(); }
        },
        "disabled": {
            icon: "arrow_back",
            tooltip: "",
            clickfn: function() {}
        }
    });
    window.panel.downloadButton.makeState("normal");
    // TODO: more buttons
    window.sendmessage({ loaded: true });
}

window.viewerrefresh = function(opts) {
    //window.pdfimageholder.contentWindow.location.reload();
    // change number of pages
    if ("postprocessdata" in opts) {
        window.numpdfpages = readNumPages(opts.postprocessdata);
    }
    setPDFPage(window.pdfpage);
    window.sendmessage({ refreshed: true });
}
