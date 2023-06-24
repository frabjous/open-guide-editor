//███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
//██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
//█████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗
//██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║
//██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║
//╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝

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

function powerUpEditor() {
    ogEditor.save = function() {
        ogEditor.saveButton.makeState("saving");
        console.log("saving");
    }

    // button for saving
    ogEditor.saveButton = panelButton({
        "normal" : {
            icon: "save",
            tooltip: "save",
            clickfn: function() { ogEditor.save(); }
        },
        "saving" : {
            icon: "sync",
            tooltip: "saving",
            clickfn: function() {}
        },
        "error" : {
            icon: "save",
            tooltip: "save error",
            clickfn: function() { ogEditor.save(); }
        }
    });
    ogEditor.saveButton.makeState("normal");

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

    // TODO: add file insert button?
    //
    //  for markdown, need play, preview html, preview pdf, autopreview and speak aloud

}
