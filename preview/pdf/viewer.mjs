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

window.nextPage = function() {
    if (window.pdfpage < window.numpdfpages) {
        let newpage = window.pdfpage + 1;
        setPDFPage(newpage);
    }
}

window.previousPage = function() {
    if (window.pdfpage > 1) {
        setPDFPage(window.pdfpage - 1);
    }
}

// change string from postprocessing stdout to number
function readNumPages(sdata) {
    return parseInt(sdata.trim());
}

// set the viewer to a certain pdf page
function setPDFPage(n, forced = false) {
    let changed = (n != window.pdfpage);
    if (n > window.numpdfpages) { n = window.numpdfpages; }
    if (n < 1) { n = 1; }
    // TODO: page widgets
    window.pdfpage = n;
    if (changed || forced) {
        window.pdfimg.src = getPDFPageURL();
    }
    if (n==1) {
        window.panel.prevButton.makeState("disabled");
    } else {
        window.panel.prevButton.makeState("normal");
    }
    if (n == window.numpdfpages) {
        window.panel.nextButton.makeState("disabled");
    } else {
        window.panel.nextButton.makeState("normal");
    }
    window.slider.setValue();
}

function zoomChange(amt, reset = false) {
    if (!reset) {
        if (window.pdfzoom <= 10 && (amt < 0)) { return;}
        if (window.pdfzoom > 120) { amt = amt * 4};
        if (window.pdfzoom > 250) { amt = amt * 10};
        window.pdfzoom = window.pdfzoom + amt;
    } else {
        window.pdfzoom = 100;
    }
    window.pdfimageholder.style.width = window.pdfzoom.toString() + '%';
}

window.msghandler = async function(msg) {
    if ((msg?.messagecmd == 'jump') && ("linenum" in msg)) {
        let response = await postData('pdf/forwardjump.php',{
            accesskey: window.accesskey,
            rootfile: window.rootfile,
            filename: window.filename,
            outputfile: window.outputfile,
            linenum: msg.linenum
        });
        if (response?.respObj?.page >= 1) {
            setPDFPage(response.respObj.page);
        }
    }
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
    // create previous page button
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
    window.panel.prevButton.makeState("normal");
    // create next page button
    window.panel.nextButton = panelButton({
        "normal" : {
            icon: "arrow_forward",
            tooltip: "previous page",
            clickfn: function() { nextPage(); }
        },
        "disabled": {
            icon: "arrow_forward",
            tooltip: "",
            clickfn: function() {}
        }
    });
    if (window.numpdfpages > 1) {
        window.panel.nextButton.makeState("normal");
    } else {
        window.panel.nextButton.makeState("disabled");
    }
    // create zoom in button
    window.panel.zoominButton = panelButton({
        "normal" : {
            icon: "zoom_in",
            tooltip: "zoom in",
            clickfn: function() { zoomChange(10); }
        }
    });
    window.panel.zoominButton.makeState("normal");

    // create zoom reset button
    window.panel.zoomresetButton = panelButton({
        "normal" : {
            icon: "fit_width",
            tooltip: "zoom reset",
            clickfn: function() { zoomChange(0, true); }
        }
    });
    window.panel.zoomresetButton.makeState("normal");

    window.panel.zoomoutButton = panelButton({
        "normal" : {
            icon: "zoom_out",
            tooltip: "zoom out",
            clickfn: function() { zoomChange(-10); }
        }
    });
    window.panel.zoomoutButton.makeState("normal");

    // create download button
    window.panel.downloadButton = panelButton({
        "normal" : {
            icon: "download",
            tooltip: "download pdf file",
            clickfn: function() { downloadOutput(); }
        }
    });
    window.panel.downloadButton.makeState("normal");

    let rightbuttons = document.getElementById("toppanelrightbuttons");
    let sliderlabel = newElem("span", rightbuttons, ['indicator'], "PAGE: ");
    window.currpageind = newElem("span", rightbuttons, ['indicator'],
        window.pdfpage.toString());
    let slash = newElem("span", rightbuttons, ['indicator'], " / ");
    window.totalpageind = newElem("span", rightbuttons, ['indicator'],
        window.numpdfpages.toString());
    window.slider = newElem("input", rightbuttons, ['slider']);
    window.slider.type = "range";
    window.slider.min = (1).toString();
    window.slider.max = window.numpdfpages;
    window.slider.setValue = function () {
        window.slider.value = window.pdfpage.toString();
        window.slider.max = window.numpdfpages.toString();
        window.totalpageind.innerHTML = window.numpdfpages.toString();
        window.currpageind.innerHTML = window.pdfpage.toString();
    }
    window.slider.setValue();
    window.slider.oninput = function() {
        window.currpageind.innerHTML = this.value.toString();
    }
    window.slider.onchange = function() {
        setPDFPage(parseInt(this.value));
    }
    // open first page of PDF
    setPDFPage(window.pdfpage, true);
    window.pdfimg.ondblclick = async function(e) {
        let x = e.layerX;
        let y = e.layerY;
        let w = e.target.clientWidth;
        let h = e.target.clientHeight;
        let xperc = x/w;
        let yperc = y/h;
        let response = await postData('pdf/reversejump.php', {
            accesskey: window.accesskey,
            rootfile: window.rootfile,
            filename: window.filename,
            outputfile: window.outputfile,
            page: window.pdfpage,
            xperc: xperc,
            yperc: yperc
        });
        if (("respObj" in response) && ("line" in response.respObj) &&
            ("jumpfile" in response.respObj) &&
            (response.respObj.line >= 1)) {
            window.sendmessage({
                reverseJumpLine: response.respObj.line,
                reverseJumpFile: response.respObj.jumpfile
            });
        }
    }
    window.sendmessage({ loaded: 'pdf' });
}

window.viewerrefresh = function(opts) {
    //window.pdfimageholder.contentWindow.location.reload();
    // change number of pages
    if ("postprocessdata" in opts) {
        window.numpdfpages = readNumPages(opts.postprocessdata);
    }
    setPDFPage(window.pdfpage, true);
    window.sendmessage({ refreshed: true });
}
