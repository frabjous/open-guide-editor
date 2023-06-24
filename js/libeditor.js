//
//███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
//██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
//█████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗
//██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║
//██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║
//╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
//

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
        const buffer = ogEditor.state.doc.text.join('\n');
        let saveerror = '';
        window.lastsavedat = window.numchanges;
        try {
            let saveresponse = await postData('php/savefile.php', {
                dirname: dirname,
                basename: basename,
                buffer: buffer,
                opts: opts
            });
            if ((!"error" in saveresponse) || saveresponse.error) {
                saveerror += (("errMsg" in saveresponse) ?
                    saveresponse.errMsg : 'Unknown error. ');
            } else {
                if (opts.autosave) { return; }
                if (window.numchanges <= window.lastsavedat) {
                    ogEditor.saveButton.makeState('unchanged');
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

    // _           _   _
    //| |__  _   _| |_| |_ ___  _ __  ___ 
    //| '_ \| | | | __| __/ _ \| '_ \/ __|
    //| |_) | |_| | |_| || (_) | | | \__ \
    //|_.__/ \__,_|\__|\__\___/|_| |_|___/
    //

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

    // button for wrap
    ogEditor.findButton = panelButton({
        "normal" : {
            icon: "search",
            tooltip: "find",
            clickfn: function() { ogEditor.find(); }
        }
    });
    ogEditor.findButton.makeState("normal");

    // button for wrap
    ogEditor.findNextButton = panelButton({
        "normal" : {
            icon: "zoom_in",
            tooltip: "find next",
            clickfn: function() { ogEditor.findnext(); }
        }
    });
    ogEditor.findNextButton.makeState("normal");

    // button for wrap
    ogEditor.replaceButton = panelButton({
        "normal" : {
            icon: "find_replace",
            tooltip: "find and replace",
            clickfn: function() { ogEditor.replace(); }
        }
    });
    ogEditor.replaceButton.makeState("normal");

    if (window.poweruser) {
        // button for wrap
        ogEditor.pipeButton = panelButton({
            "normal" : {
                icon: "terminal",
                tooltip: "filter through unix command",
                clickfn: function() { ogEditor.pipefilter(); }
            },
            "processing" : {
                icon: "terminal",
                tooltip: "processing",
                clickfn: function() { }
            },
            "error" : {
                icon: "terminal",
                tooltip: "unix command error",
                clickfn: function() { ogEditor.pipefilter(); }
            }
        });
        ogEditor.pipeButton.makeState("normal");
    }

    // TODO: generic function for adding more based on filetype?
    //  for markdown, need play, preview html, preview pdf,
    //  autopreview and speak aloud

}
