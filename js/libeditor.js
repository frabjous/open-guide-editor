// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// creates a new element with a parent, class names and innerHTML
function newElem(tagtype, par, classes = [], contents = '') {
    let e = document.createElement(tagtype);
    for (const cl of classes) {
        e.classList.add(cl);
    }
    if ((contents) && (contents != '')) {
        e.innerHTML = contents;
    }
    if (par) {
        par.appendChild(e);
    }
    return e;
}

// generic function to create the panel buttons
function panelButton( possstates ) {
    // create button and add to panel
    let panel = document.getElementById("toppanel");
    let b = newElem( "div", panel, ["panelbutton"], '');
    // create span with material symbols outlined class
    b.iconspan = newElem("span", b, ["material-symbols-outlined"],'');
    // set possible states it can have
    b.possstates = possstates;
    // function to state of button
    b.makeState = function(st) {
        // if impossible state given, leave error and stop
        if (!st in this.possstates) {
            console.error("Non-possible state given for ", b);
            return;
        }
        // change icon to the one for the state
        if (this.iconspan.innerHTML != (this?.possstates?.[st]?.icon)) {
            this.iconspan.innerHTML = ((this?.possstates?.[st]?.icon) ?? '');
        }
        // change the tooltip
        if (this?.possstates?.[st]?.tooltip != this.title) {
            this.title = ((this?.possstates?.[st]?.tooltip) ?? '');
        }
        // change on-click function
        if (this?.onclick != this?.possstates?.[st]?.clickfn) {
            this.onclick = (this?.possstates?.[st]?.clickfn ?? function() {});
        }
        // add class for state
        this.classList.add(st);
        this.mystate = st;
        // remove other classes
        for (const poss in b.possstates) {
            if (poss != st) {
                this.classList.remove(poss);
            }
        }
    }
    return b;
}

// function run at load, giving the editor its commands and buttons
function powerUpEditor() {
    // get text, etc. from current selection
    ogEditor.getfirstselection = function() {
        let selectedtext = '';
        let selectedfrom = 0;
        let selectedto = 0;
        let rr = ogEditor.state.selection.ranges;
        // look for first selection with distinct anchors/heads
        for (let r of rr) {
            if (r.to != r.from) {
                selectedfrom = r.from;
                selectedto = r.to;
                selectedtext = ogEditor.state.doc
                    .slice(r.from, r.to).toString();
                break;
            }
        }
        return {
            selectedtext: selectedtext,
            from: selectedfrom,
            to: selectedto
        }
    }
    //
    // get contents of file from server
    // 
    ogEditor.grabcontents = async function(dir, fn) {
        let grab = await postData('php/getfilecontents.php',
            { dirname: dir, basename: fn }
        );
        // report errors if do not get good response from server
        if ((grab?.error) || (grab?.respObj?.error)) {
            ogEditor.openButton.makeState("error");
            ogDialog.errdiag("Unable to open file: " +
                (grab?.errMsg ?? '') + ' ' +
                (grab?.respObj.errMsg ?? ''));
            return;
        }
        if (!"filecontents" in grab.respObj) {
            ogEditor.openButton.makeState("error");
            ogDialog.errdiag("No file contents sent.");
            return;
        }
        if ((!"newdir" in grab.respObj) ||
            (!"newfn" in grab.respObj)) {
            ogEditor.openButton.makeState("error");
            ogDialog.errdiag("No file name/location not sent.");
            return;
        }
        // mark editor as saved
        ogEditor.openButton.makeState("normal");
        ogEditor.saveButton.makeState("unchanged");
        // change editor to new document
        ogEditor.switchToDocument(
            grab.respObj.filecontents,
            grab.respObj.newdir,
            grab.respObj.newfn
        );
    }
    //
    // OPEN FUNCTION
    //
    ogEditor.openfile = function(opts = {}) {
        ogEditor.openButton.makeState("opening");
        if ((window.numchanges > window.lastsavedat) &&
            ((!"bypass" in opts) || (!opts.bypass))) {
            ogDialog.yesno('You have unsaved changes. ' +
                'Open a new file anyway?',
            function() {
                ogEditor.openfile({bypass: true});
            },
            function() {
                ogEditor.openButton.makeState("normal");
            });
            return;
        }
        window.ogDialog.filechoose(
            function(dir, fn) {
                let url = 'php/redirect.php?dirname=' +
                    encodeURIComponent(dir) + '&basename=' +
                    encodeURIComponent(fn);
                // if current window does not have any file save,
                // reload it in this one, otherwise open in new tab
                if (window.reloadonsave) {
                    window.location.href = url;
                } else {
                    window.open(url, '_blank').focus();
                    ogEditor.openButton.makeState("normal");
                }
            },
            window.dirname,
            "Choose a file to open:",
            false,
            'open-guide-misc/get-file-list.php',
            ''
        );
    }
    //
    // PIPE FILTER
    //
    ogEditor.pipedialog = function() {
        let formhtml = '<div class="oge-pipeform">' +
            '<div><label for="pipeentry">Unix pipe command to filter through:</label></div>' +
            '<div><input type="text" id="pipeentry"></div>' +
            '<div><button type="button" onclick="submitPipeCmd()">run filter</button></div>' +
            '</div>';
        window.pipeBDiv = ogDialog.popupform(formhtml,true);
    }
    ogEditor.pipefilter = async function(opts = {}, cmd) {
        ogEditor.pipeButton.makeState("processing");
        let topipe = ogEditor.getfirstselection();
        if (topipe.selectedtext == '') {
            const selectedtext = ogEditor.state.doc.toString();
            topipe = {
                selectedtext: selectedtext,
                from: 0,
                to: selectedtext.length
            };
        }
        topipe.cmd = cmd;
        let piperesult = await postData('php/pipefilter.php', topipe);
        if (piperesult?.error
            || (!"respObj" in piperesult)
            || piperesult?.respObj?.error
            || (!piperesult?.respObj)
            || (!"replacement" in piperesult?.respObj)) {
            ogEditor.pipeButton.makeState("error");
            ogDialog.errdiag("Error interacting with server. " +
                (piperesult?.errMsg ?? '') + ' ' +
                (piperesult?.respObj?.errMsg ?? ''));
            return;
        }
        ogEditor.pipeButton.makeState("normal");
        ogEditor.dispatch(ogEditor.state.update({
            changes: {
                from: topipe.from,
                to: topipe.to,
                insert: piperesult.respObj.replacement
            }
        }));
    }

    //
    // SAVE FUNCTION
    //
    ogEditor.save = async function(opts = {}) {
        // don't save if already saving
        let autosave = (("autosave" in opts) && (opts.autosave));
        if (!autosave) {
            ogEditor.saveButton.makeState("saving");
        }
        let basename = window.basename;
        let dirname = window.dirname;
        if (basename == '') {
            if (autosave) {
                const now = new Date();
                const ts = now.getFullYear.toString() + '-' +
                    (now.getMonth()+1).toString() + '-' +
                    now.getDate().toString() + '-' +
                    now.getTime().toString();
                basename = 'autosave-' + ts;
            } else {
                window.ogDialog.filechoose(
                    function(dn, bn) {
                        if (dn == '---' && bn == '---') {
                            ogEditor.saveButton.makeState("changed");
                            return;
                        }
                        window.dirname = dn;
                        window.basename = bn;
                        ogEditor.save();
                    },
                    window.dirname,
                    'Choose a file name to save:',
                    true,
                    'open-guide-misc/get-file-list.php'
                );
                return;
            }
        }
        const buffer = ogEditor.state.doc.toString();
        let saveerror = '';
        window.lastsavedat = window.numchanges;
        try {
            let saveresponse = await postData('php/savefile.php', {
                dirname: dirname,
                basename: basename,
                buffer: buffer,
                opts: opts
            });
            if ((!"error" in saveresponse)
                || saveresponse.error
                || (!"respObj" in saveresponse)
                || (saveresponse.respObj.error)
            ) {
                saveerror += (saveresponse?.errMsg ?? '') + ' '
                    (saveresponse?.respObj?.errMsg ?? '');
            } else {
                if (opts.autosave) { return; }
                if (window.numchanges <= window.lastsavedat) {
                    ogEditor.saveButton.makeState('unchanged');
                    window.setTitle(false);
                }
                if (window.reloadonsave) {
                    window.location.href = 'php/redirect.php?dirname=' +
                        encodeURIComponent(dirname) + '&basename=' +
                        encodeURIComponent(basename);
                }
                // TODO: postprocessing
            }
        } catch(err) {
            saveerror += 'Browser error: ' + err.toString() + ' ';
        }
        if (saveerror != '') {
            ogEditor.saveButton.makeState('error');
            ogDialog.errdiag('Unable to save. ' + saveerror);
        }
    }

    ogEditor.togglesearch = function() {
        let ispanel = (document
            .getElementsByClassName("cm-search").length > 0);
        if (ispanel) {
            ogEditor.closesearch();
        } else {
            ogEditor.opensearch();
        }
    }

    // button for saving
    ogEditor.saveButton = panelButton({
        "unchanged" : {
            icon: "save",
            tooltip: "file already saved",
            clickfn: function() {}
        },
        "changed" : {
            icon: "save",
            tooltip: "save",
            clickfn: function() { ogEditor.save({}); }
        },
        "saving" : {
            icon: "sync",
            tooltip: "saving",
            clickfn: function() {}
        },
        "error" : {
            icon: "save",
            tooltip: "save error",
            clickfn: function() { ogEditor.save({}); }
        }
    });
    ogEditor.saveButton.makeState("unchanged");

    // button for opening
    ogEditor.openButton = panelButton({
        "normal" : {
            icon: "folder_open",
            tooltip: "open file",
            clickfn: function() { ogEditor.openfile(); }
        },
        "opening" : {
            icon: "folder_open",
            tooltip: "opening",
            clickfn: function() {}
        },
        "error" : {
            icon: "folder_open",
            tooltip: "error opening file",
            clickfn: function() { ogEditor.openfile(); }
        }
    });
    ogEditor.openButton.makeState("normal");

    // button for wrap
    ogEditor.wrapButton = panelButton({
        "active" : {
            icon: "wrap_text",
            tooltip: "toggle line wrapping",
            clickfn: function() { ogEditor.wrapoff(); }
        },
        "inactive" : {
            icon: "wrap_text",
            tooltip: "toggle line wrapping",
            clickfn: function() { ogEditor.wrapon(); }
        }
    });
    ogEditor.wrapButton.makeState("active");

    // button for find
    ogEditor.findButton = panelButton({
        "normal" : {
            icon: "search",
            tooltip: "toggle find/replace panel",
            clickfn: function() { ogEditor.togglesearch(); }
        }
    });
    ogEditor.findButton.makeState("normal");

    if (window.poweruser) {
        // button for wrap
        ogEditor.pipeButton = panelButton({
            "normal" : {
                icon: "terminal",
                tooltip: "filter through unix command",
                clickfn: function() { ogEditor.pipedialog({}); }
            },
            "processing" : {
                icon: "terminal",
                tooltip: "processing",
                clickfn: function() { }
            },
            "error" : {
                icon: "terminal",
                tooltip: "unix command error",
                clickfn: function() { ogEditor.pipedialog({}); }
            }
        });
        ogEditor.pipeButton.makeState("normal");
    }
    // TODO: generic function for adding more based on filetype?
    //  for markdown, need play, preview html, preview pdf,
    //  autopreview and speak aloud

}

function submitPipeCmd() {
    let pipeentry = document.getElementById("pipeentry");
    if (!pipeentry) { return; }
    let cmd = pipeentry.value;
    window.pipeBDiv.closeMe();
    if (cmd == '') { return; }
    ogEditor.pipefilter({},cmd);
}
