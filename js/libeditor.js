// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

/////////////////////// libeditor.js ////////////////////////////////////
// defines a function used to extend the codemirror editor and the top //
// panel to add functionality, etc.                                    //
/////////////////////////////////////////////////////////////////////////

// function run at load, giving the editor its commands and buttons
function powerUpEditor() {
    //
    // Turn autoprocessing on or off
    ogEditor.autoprocess = function(onoff) {
        // set window state to right thing
        window.autoprocessing = onoff;
        // cancel any previous autoprocess timer
        if (typeof window.autoprocessTimeOut == 'number') {
            clearTimeout(autoprocessTimeOut);
        }
        // if turning it on, start a process right away
        if (onoff) {
            ogEditor.autoprocessButton.makeState("active");
            ogEditor.triggerAutoprocess();
            return;
        }
        // turn it off; make TimeOut not even a thing
        if (typeof window.autoprocessTimeOut == 'number') {
            window.autoprocessTimeOut = {};
        }
        ogEditor.autoprocessButton.makeState("inactive");
    }
    //
    // CLOSE EDITOR FUNCTION
    //
    ogEditor.closeviewer = function(opts) {
        // close the viewer window unless closing anyway
        if ((!(opts?.closingonown)) && (window.viewerwindow !== false)) {
            window.viewerwindow.close();
        }
        // set the viewerwindow back to false
        window.viewerwindow == false;
        // set the button to off
        ogEditor.previewButton.makeState('inactive');
        ogEditor.jumpButton.showOrHide();
    }
    //
    // Download function
    //
    ogEditor.download = function(outputext) {
        ogEditor.process({
            download: true,
            outputext: outputext
        });
    }
    //
    // Forward jump function
    //
    ogEditor.forwardjump = function() {
        let r = ogEditor.state.selection.ranges[0];
        let linenum = ogEditor.state.doc.lineAt(r.from).number;
        ogEditor.sendmessage({ messagecmd: 'jump', linenum: linenum });
    }

    //
    // GET SELECTION FUNCTION
    //
    // get text, etc. from current selection
    ogEditor.getfirstselection = function() {
        // default values
        let selectedtext = '';
        let selectedfrom = 0;
        let selectedto = 0;
        // get all current selections
        let rr = ogEditor.state.selection.ranges;
        // look for first selection with distinct anchors/heads
        for (let r of rr) {
            // pay attention to those actually containing text, i.e.,
            // a different to and from
            if (r.to != r.from) {
                selectedfrom = r.from;
                selectedto = r.to;
                // get text in the selected range
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
    // git dialog
    ogEditor.gitcommitdialog = function() {
        ogEditor.togglePanel();
        if (!window.ogePanel) { return; }
        window.ogePanel.innerHTML = '<div class="oge-formpanel">' +
            '<span title="close" onclick="ogEditor.togglePanel();" style="float:right; cursor: pointer;">×</span>' +
            '<div><label for="gitentry">Git commit label/message:</label> ' +
            '<input type="text" id="gitentry"> ' +
            '<button type="button" onclick="submitGitCmd()">make commit</button></div>' +
            '</div>';
        document.getElementById("gitentry").focus();
    }
    //actually process git commit
    ogEditor.gitcommit = async function(opts = {}, msg) {
        // make button active
        ogEditor.gitButton.makeState("processing");
        // if there is a selection we only pipe it
        // post request to pipe to server
        let gitresult = await postData('php/gitcommit.php', {
            msg: msg, opts: opts, accesskey: accesskey,
            dirname: window.dirname, rootdocument: window.rootdocument
        });
        // respond to errors
        let didnothing = (("respObj" in gitresult) &&
            ("nothingtocommit" in gitresult.respObj) &&
            (gitresult.respObj.nothingtocommit));
        if (didnothing) {
            ogDialog.alertdiag("Nothing to commit. Working tree clean.");
        } else {
            // respond to errors
            if (gitresult?.error
                || (!("respObj" in gitresult))
                || gitresult?.respObj?.error
                || (!gitresult?.respObj)) {
                ogEditor.gitButton.makeState("error");
                console.log(gitresult.respObj);
                ogDialog.errdiag("Error doing git commit. " +
                    (gitresult?.errMsg ?? '') + ' ' +
                    (gitresult?.respObj?.errMsg ?? ''));
                return;
            }
        }

        // change back to normal
        if (ogEditor.saveButton.mystate == "unchanged") {
            ogEditor.gitButton.makeState("enabled");
        } else {
            ogEditor.gitButton.makeState("disabled");
        }
        if (!didnothing) {
            ogDialog.alertdiag('Git commit “' + msg + '” successful.');
        }
    }

    //
    // go to specific line
    //
    ogEditor.gotoline = function(linenum) {
        if (linenum < 1) { linenum = 1; }
        if (linenum > ogEditor.state.doc.lines) {
            linenum = ogEditor.state.doc.lines;
        }
        let pos = ogEditor.state.doc.line(linenum).from;
        ogEditor.dispatch(ogEditor.state.update({
            selection: { anchor: pos, head: pos },
            scrollIntoView: true
        }));
        ogEditor.focus();
    }

    ogEditor.gotolinediag = function() {
        ogEditor.togglePanel();
        if (!window.ogePanel) { return; }
        window.ogePanel.innerHTML = '<div class="oge-formpanel">' +
            '<span title="close" onclick="ogEditor.togglePanel();" ' +
            'style="float:right; cursor: pointer;">×</span>' +
            '<div><label for="lineentry">Go to line: </label> ' +
            '<input type="number" id="lineentry" onchange="ogEditor.' +
            'gotoline(parseInt(this.value)); ogEditor.togglePanel();" ' +
            'style="width: 4rem; text-align: center;"></div></div>';
        document.getElementById("lineentry").focus();
    }

    //
    // HANDLE MESSAGE FUNCTION
    //
    ogEditor.handlemessage =function(data) {
        if (data.loaded) {
            window.lastViewerLoaded = data.loaded;
        }
        if (data?.refreshed || data?.loaded) {
            ogEditor.previewButton.makeState("active");
            window.viewedonce = true;
            ogEditor.jumpButton.showOrHide();
        }
        if ((data?.reverseJumpLine) && (data?.reverseJumpFile)) {
            let linenum = data.reverseJumpLine;
            if (data.reverseJumpFile  == (window.dirname + '/' +
                window.basename)) {
                ogEditor.gotoline(linenum);
            } else {
                ogDialog.alertdiag('Jump spot is line ' +
                    linenum.toString() + ' in ' +
                    data.reverseJumpFile);
            }
        }
        return true;
    }
    //
    // VIEWER LAUNCH FUNCTION
    //
    ogEditor.launchviewer =function(opts = {}) {
        // get output extension, if nothing, then stop
        let outputext = ogEditor.outputSelectButton.mystate ?? '';
        opts.outputext = outputext;
        if (outputext == '') { return; }
        let url='preview/';
        url += '?accesskey=' + encodeURIComponent(window.accesskey);
        for (let opt in opts) {
            url += '&' + opt + '=' + encodeURIComponent(opts[opt]);
        }
        // open the viewerwindow
        window.viewerwindow = window.open(
            url,
            'preview',
            'popup,width=' +
                ((ogeSettings?.viewer?.width ?? 900).toString()) +
            ',height=' +
                ((ogeSettings?.viewer?.height ?? 500).toString()),
        );
        // mark it as turned off if it closes
        window.viewerwindow.onbeforeunload = function(e) {
            this.opener.ogEditor.closeviewer({ closingonown: true });
        }
    }
    //
    // OPEN FUNCTION
    //
    ogEditor.openfile = function(opts = {}) {
        // make button indicate opening
        ogEditor.openButton.makeState("opening");
        // check if there are unsaved changes
        if ((window.numchanges > window.lastsavedat) &&
            ((!("bypass" in opts)) || (!opts.bypass)) &&
            (window.reloadonsave)) {
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
        // choose the file to open
        window.ogDialog.filechoose(
            function(dir, fn) {
                // get back this silly stuff when cancelled
                if (dir == '---' && fn == '---') {
                    ogEditor.openButton.makeState("normal");
                    return;
                }
                // redirect to new file
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
    // create form for getting pipe command
    ogEditor.pipedialog = function() {
        ogEditor.togglePanel();
        if (!window.ogePanel) { return; }
        window.ogePanel.innerHTML = '<div class="oge-formpanel">' +
            '<span title="close" onclick="ogEditor.togglePanel();" style="float:right; cursor: pointer;">×</span>' +
            '<div><label for="pipeentry">Unix pipe command to filter through:</label> ' +
            '<input type="text" id="pipeentry"> ' +
            '<button type="button" onclick="submitPipeCmd()">run filter</button></div>' +
            '</div>';
    }

    //actually process the pipe command
    ogEditor.pipefilter = async function(opts = {}, cmd) {
        // make button active
        ogEditor.pipeButton.makeState("processing");
        // if there is a selection we only pipe it
        let topipe = ogEditor.getfirstselection();
        // if nothing is selected we pipe whole document
        if (topipe.selectedtext == '') {
            const selectedtext = ogEditor.state.doc.toString();
            topipe = {
                selectedtext: selectedtext,
                from: 0,
                to: selectedtext.length
            };
        }
        // set the command
        topipe.cmd = cmd;
        // post request to pipe to server
        let piperesult = await postData('php/pipefilter.php', topipe);
        // respond to errors
        if (piperesult?.error
            || (!("respObj" in piperesult))
            || piperesult?.respObj?.error
            || (!piperesult?.respObj)
            || (!("replacement" in piperesult?.respObj))) {
            ogEditor.pipeButton.makeState("error");
            ogDialog.errdiag("Error interacting with server. " +
                (piperesult?.errMsg ?? '') + ' ' +
                (piperesult?.respObj?.errMsg ?? ''));
            return;
        }
        // change back to normal
        ogEditor.pipeButton.makeState("normal");
        // swap out the selection with the new contents from the pipe
        ogEditor.dispatch(ogEditor.state.update({
            changes: {
                from: topipe.from,
                to: topipe.to,
                insert: piperesult.respObj.replacement
            }
        }));
        ogEditor.focus();
    }
    //
    // PREVIEW ON/OFF FUNCTION
    //
    ogEditor.preview = async function(onoff, opts = {}) {
        if (onoff) {
            // turning on, determine output extension
            let outputext = '';
            if ("outputext" in opts) {
                outputext = opts.outputext;
            } else {
                if (ogEditor.outputSelectButton) {
                    outputext = ogEditor.outputSelectButton.mystate;
                }
            }
            // let the view be launched by the process function
            if (outputext != '') {
                opts.launch = true;
                let r = await ogEditor.process(opts);
                // if that opened the viewer window, we're good
            }
            return;
        }
        return ogEditor.closeviewer({});
    }

    // PROCESS FUNCTION
    //
    ogEditor.process = async function(opts = {}) {
        // determine routine to use;
        // it'll either be passed as opt, or we'll read it from the
        // select button
        let outputext = '';
        if ("outputext" in opts) {
            outputext = opts.outputext;
        } else {
            if (!ogEditor?.outputSelectButton) { return false; }
            outputext = ogEditor.outputSelectButton.mystate;
        }
        const rootextension = window.rootextension;
        // ensure the routine exists
        if (!ogeSettings?.routines?.[rootextension]?.[outputext]) {
            ogDialog.errdiag('Proposed routine ' + rootextension + ' to ' +
                outputext + ' does not exist');
            ogEditor.outputSelectButton.makeState('error');
            return false;
        }
        const routine = ogeSettings.routines[rootextension][outputext];
        // call save function with options for processing
        opts.routine = routine;
        opts.outputext = outputext;
        const sv = await ogEditor.save(opts);
        return sv;
    }
    //
    // SAVE FUNCTION
    //
    ogEditor.save = async function(opts = {}) {
        // don't change button if autosaving, but otherwise do so
        const autosave = (("autosave" in opts) && (opts.autosave));
        if (!autosave) {
            ogEditor.saveButton.makeState("saving");
            if (ogEditor.gitButton) {
                ogEditor.gitButton.makeState("disabled");
            }
        }
        // if also processing, then mark its button as such
        if (("routine" in opts) && (ogEditor?.processButton)) {
            ogEditor.processButton.makeState("processing");
        }
        // if a download, then make its button processing as well
        if (("download" in opts) && ("outputext" in opts) &&
            (ogEditor?.downloadButtons?.[opts.outputext])) {
            ogEditor.downloadButtons[opts.outputext].makeState("processing");
        }
        // check if we have a basename and dirname
        let basename = window.basename;
        let dirname = window.dirname;
        if (basename == '') {
            // if autosaving an unnamed file, create a filename based
            // on the date and time
            if (autosave) {
                const now = new Date();
                const ts = now.getFullYear().toString() + '-' +
                    (now.getMonth()+1).toString() + '-' +
                    now.getDate().toString() + '-' +
                    now.getTime().toString();
                basename = 'autosave-' + ts;
            } else {
                // otherwise, we'll need to give it a filename to save it
                window.ogDialog.filechoose(
                    function(dn, bn) {
                        // crazy response if filename choice canceled
                        if (dn == '---' && bn == '---') {
                            ogEditor.saveButton.makeState("changed");
                            if (ogEditor.gitButton) {
                                ogEditor.gitButton.makeState("disabled");
                            }
                            return;
                        }
                        // start again with the filename chosen
                        window.dirname = dn;
                        window.basename = bn;
                        ogEditor.save();
                    },
                    window.dirname,
                    'Choose a file name to save:',
                    true,
                    'open-guide-misc/get-file-list.php'
                );
                // don't fall through to rest of function
                // since we're going to call it again
                return;
            }
        }
        // get contents of file
        const buffer = ogEditor.state.doc.toString();
        let saveerror = ''; let processingerror = '';
        // make this current state as the one last saved
        if (opts?.autosave) {
            window.lastautosavedat = window.numchanges;
        } else {
            window.lastsavedat = window.numchanges;
        }
        // get response from server
        let respObj = {};
        try {
            const saveresponse = await postData('php/savefile.php', {
                dirname: dirname,
                basename: basename,
                buffer: buffer,
                opts: opts
            });
            // handle errors
            if ((!("error" in saveresponse))
                || saveresponse.error
                || (!("respObj" in saveresponse))
                || (saveresponse.respObj.error)
            ) {
                saveerror += (saveresponse?.errMsg ?? '') + ' ' +
                    (saveresponse?.respObj?.errMsg ?? '');
            } else {
                // mark as saved if no new changes were make
                if (window.numchanges <= window.lastsavedat) {
                    ogEditor.saveButton.makeState('unchanged');
                    if (ogEditor.gitButton) {
                        ogEditor.gitButton.makeState("enabled");
                    }
                    window.setTitle(false);
                }
                // if we have a new filename, so reload to it
                if (window.reloadonsave && !(opts?.autosave)) {
                    window.location.href = 'php/redirect.php?dirname=' +
                        encodeURIComponent(dirname) + '&basename=' +
                        encodeURIComponent(basename);
                }
                // pass respObj back into wider scope
                respObj = saveresponse.respObj;
            }
        } catch(err) {
            // there was an error with the above; report it
            saveerror += 'Browser error: ' + err.toString() + ' ';
        }
        // look for processing error
        if (("routine" in opts) &&
            ((!("processResult" in respObj)) ||
                (respObj?.processResult?.error))) {
            processingerror += (respObj?.processResult?.errMsg ??
                'Unknown processing error');
            // report error using its stderr output
            if (respObj?.processResult &&
                ("stderr" in respObj?.processResult)) {
                processingerror += stdErrorInclusion(
                    respObj?.processResult?.stderr
                );
            }
        }

        // if there were errors saving the file, report them
        if (saveerror != '') {
            ogEditor.saveButton.makeState('error');
            if (ogEditor.gitButton) {
                ogEditor.gitButton.makeState("disabled");
            }
            ogDialog.errdiag('Unable to save. ' + saveerror);
            // mark as no longer processing
            if ("routine" in opts) {
                if (ogEditor?.processButton) {
                    ogEditor.processButton.makeState("normal");
                }
            }
            return false;
        }
        // report any processing error
        if (processingerror != '') {
            if (ogEditor.processButton) {
                ogEditor.processButton.makeState('error');
                console.log(respObj);
                // make download button error if download
                if ((opts?.download) &&
                    (ogEditor?.downloadButtons?.[opts.outputext])) {
                    ogEditor.downloadButtons[opts.outputext]
                        .makeState('error');
                }
                ogEditor.processButton.title = processingerror;
            }
            return false;
        }

        // if finished a processing run, mark the button as completed
        if ((opts?.routine) && (opts?.outputext)) {
            if (ogEditor.processButton) {
                //return processing button to normal
                ogEditor.processButton.makeState('normal');
                let outputext = opts.outputext;
                // keep track of what outputs should already exist
                window.processedonce[outputext] = true;
                // if viewer has never been launched, and this has a
                // viewable output extension, launch the viewer
                let postprocessdata = '';
                // if postprocessing info set along, then pass it to
                // viewer
                if (respObj?.processResult?.postProcessResult?.stdout) {
                    postprocessdata = respObj.processResult
                        .postProcessResult.stdout;
                }
                if ((opts?.launch || window.lastViewerLoaded != opts.outputext ||
                    ((!window.viewedonce) &&
                    (outputext in window.outputextensions) &&
                    (window.outputextensions[outputext].viewable))) &&
                    (!opts?.download)) {
                    return ogEditor.launchviewer(
                        { postprocessdata: postprocessdata }
                    );
                }
                // if viewer is currently open, refresh it
                if ((outputext in window.outputextensions) &&
                    (window.outputextensions[outputext].viewable) &&
                    (window.viewerwindow !== false)) {
                    ogEditor.sendmessage({
                        messagecmd: 'refresh',
                        opts: { postprocessdata: postprocessdata }
                    });
                }
            }
            if (opts?.download) {
                // mark download button as finished
                if (ogEditor?.downloadButtons?.[opts.outputext]) {
                    ogEditor.downloadButtons[opts.outputext].makeState('normal');
                }
                // get filename from response
                const filetodl = ((respObj?.processResult?.outputfile) ?? false);
                if (!filetodl) { return; }
                const pathparts = filetodl.split('/');
                const basename = pathparts[ pathparts.length - 1];
                // determine url
                const url = 'php/downloadfile.php?filename=' +
                    encodeURIComponent(filetodl);
                // download the file
                window.downloadFile(url, basename);
            }
        }
    }
    //
    // send a message to the viewer window
    //
    ogEditor.sendmessage = function(d, opts = {}) {
        // sanity checks
        if (!window.viewerwindow) { return false; }
        if (!window.viewerwindow?.postMessage) { return false; }
        // attach accesskey
        d.accesskey = window.accesskey;
        // post the message
        return window.viewerwindow.postMessage(d, '*');
    }
    //
    // open or close the search/replace panel
    //
    ogEditor.togglesearch = function() {
        // see if it's already open
        const ispanel = (document
            .getElementsByClassName("cm-search").length > 0);
        // close or open it accordingly
        if (ispanel) {
            ogEditor.closesearch();
        } else {
            ogEditor.opensearch();
        }
    }

    // start or re-start the autoprocesss timer
    ogEditor.triggerAutoprocess = function() {
        // cancel the current one
        if (typeof window.autoprocessTimeOut == 'number') {
            clearTimeout(window.autoprocessTimeOut);
        }
        // the timing is 1 second or what is in settings
        window.autoprocessTimeOut = setTimeout(
            function() {
                if (window.autoprocessing) {
                    ogEditor.process({ auto: true });
                }
            },
            (ogeSettings?.autoprocess?.delay ?? 100000)
        );
    }

    /////////////
    // BUTTONS //
    /////////////
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

    if (window.gitenabled) {
            ogEditor.gitButton = panelButton({
            "disabled" : {
                icon: "verified",
                tooltip: "git commit (save first)",
                clickfn: function() {}
            },
            "enabled" : {
                icon: "verified",
                tooltip: "git commit",
                clickfn: function() { ogEditor.gitcommitdialog({}); }
            },
            "processing" : {
                icon: "sync",
                tooltip: "processing",
                clickfn: function() {}
            },
            "error" : {
                icon: "verified",
                tooltip: "git error",
                clickfn: function() { ogEditor.gitcommitdialog({}); }
            }
        });
        ogEditor.gitButton.makeState("enabled");
    }

    // button for opening
    ogEditor.openButton = panelButton({
        "normal" : {
            icon: "folder_open",
            tooltip: "open file",
            clickfn: function() { ogEditor.openfile(); }
        },
        "opening" : {
            icon: "sync",
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

    // button for glyph
    ogEditor.glyphButton = panelButton({
        "active" : {
            icon: "glyphs",
            tooltip: "insert special character or symbol",
            clickfn: function() { window.symbolPicker(function (c) {
                let sel = ogEditor.state.selection.ranges[0];
                ogEditor.dispatch(ogEditor.state.update({
                    changes: {
                        from: sel.from,
                        to: sel.to,
                        insert: c
                    }
                }));
                ogEditor.goright();
            })}
        }
    });
    ogEditor.glyphButton.makeState("active");


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
        // button for piping to unix command
        ogEditor.pipeButton = panelButton({
            "normal" : {
                icon: "terminal",
                tooltip: "filter through unix command",
                clickfn: function() { ogEditor.pipedialog({}); }
            },
            "processing" : {
                icon: "sync",
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

    // button for forward jump
    ogEditor.jumpButton = panelButton({
        "normal" : {
            icon: "jump_to_element",
            tooltip: "jump to line output in preview",
            clickfn: function() { ogEditor.forwardjump({}); }
        }
    });
    ogEditor.jumpButton.makeState("normal");
    ogEditor.jumpButton.showOrHide = function() {
        const inext = window.rootextension;
        const outext = ogEditor?.outputSelectButton?.mystate ?? '';
        if (("routines" in ogeSettings) &&
            (inext in ogeSettings?.routines) &&
            (outext in ogeSettings?.routines?.[inext]) &&
            ("forwardjump" in ogeSettings?.routines?.[inext]?.[outext]) &&
            (ogEditor?.previewButton?.mystate == 'active')) {
            this.style.display = 'inline-block';
            return;
        }
        this.style.display = 'none';
    }

    // create button for picking what output routine to use
    if (("routines" in window.ogeSettings) &&
        (window.rootextension in window.ogeSettings.routines)) {
        let outputSelectButtonOpts = {};
        window.outputopts = [];
        let routines = window.ogeSettings.routines[window.rootextension];
        // for each is that is viewable, make it a state for the button
        for (let outputext in routines) {
            if (outputext in window.outputextensions) {
                if (window.outputextensions[outputext].viewable) {
                    window.outputopts.push(outputext);
                    outputSelectButtonOpts[outputext] = {
                        icon: (window.outputextensions[outputext].icon ?? ''),
                        tooltip: "change output routine",
                        clickfn: function() {
                            ogEditor.changeOutputExt();
                        }
                    }
                }
            }
        }
        // create button
        ogEditor.outputSelectButton = panelButton(outputSelectButtonOpts);
        if (ogeSettings?.routines?.[window.rootextension]?.defaultext) {
            ogEditor.outputSelectButton.makeState(
                ogeSettings.routines[window.rootextension].defaultext
            );
        } else {
            ogEditor.outputSelectButton.makeState(window.outputopts[0]);
        }
        // create function for changing the outputextension
        ogEditor.changeOutputExt = function() {
            // shorter name for button
            let b = ogEditor?.outputSelectButton;
            if (!b) { return; }
            let st = b.mystate;
            let pos = window.outputopts.indexOf(st) + 1;
            if (pos == window.outputopts.length) {
                pos = 0;
            }
            b.makeState(window.outputopts[pos]);
            ogEditor.jumpButton.showOrHide();
            if ((b.mystate != st) && (window.viewerwindow !== false)) {
                ogEditor.preview(true, { launch: true });
            }
        }
        //  hide the button if there is only one possibility
        if (window.outputopts.length == 1) {
            ogEditor.outputSelectButton.style.display = 'none';
        }

        // for non-viewable routines, create a download button
        for (let outputext in routines) {
            if (outputext in window.outputextensions) {
                if (!window.outputextensions[outputext].viewable) {
                    if (!ogEditor.downloadButtons) {
                        ogEditor.downloadButtons = {};
                    }
                    const icon = window.outputextensions[outputext].icon
                        ?? 'download';
                    const b = panelButton({
                        "normal" : {
                            icon: icon,
                            tooltip: "download " + outputext,
                            clickfn: function() {
                                ogEditor.download(this.outputext);
                            }
                        },
                        "processing" : {
                            icon: "sync",
                            tooltip: "processing download",
                            clickfn: function() { }
                        },
                        "error" : {
                            icon: icon,
                            tooltip: "download processing error",
                            clickfn: function() {
                                ogEditor.download(this.outputext);
                            }
                        }
                    }, true);
                    b.outputext = outputext;
                    b.makeState("normal");
                    ogEditor.downloadButtons[outputext] = b;
                }
            }
        }
    }

    // create button for processing if there were routines
    if (("outputopts" in window) && (window.outputopts.length > 0)) {
        // create process once button
        ogEditor.processButton = panelButton({
            "normal" : {
                icon: "play_arrow",
                tooltip: "process output",
                clickfn: function() { ogEditor.process({}); }
            },
            "processing" : {
                icon: "sync",
                tooltip: "processing",
                clickfn: function() { }
            },
            "error" : {
                icon: "play_arrow",
                tooltip: "process error",
                clickfn: function() { ogEditor.process({}); }
            }
        });
        ogEditor.processButton.makeState("normal");

        // create autoprocess button
        ogEditor.autoprocessButton = panelButton({
            "inactive": {
                icon: "autoplay",
                tooltip: "activate autopreview",
                clickfn: function() { ogEditor.autoprocess(true); }
            },
            "active": {
                icon: "autoplay",
                tooltip: "deactivate autopreview",
                clickfn: function() { ogEditor.autoprocess(false); }
            }
        });
        ogEditor.autoprocessButton.makeState("inactive");

        // create preview window button
        ogEditor.previewButton = panelButton({
            "inactive": {
                icon: "visibility_off",
                tooltip: "activate preview",
                clickfn: function() { ogEditor.preview(true); }
            },
            "active": {
                icon: "visibility",
                tooltip: "deactivate preview",
                clickfn: function() { ogEditor.preview(false); }
            }
        });
        ogEditor.previewButton.makeState("inactive");
    }
    ogEditor.jumpButton.showOrHide();
    // speak aloud button
    if (window.readaloud) { makeReadAloudButton(); }

    ////////////////////////
    // Keys on panel      //
    ////////////////////////
    // try to always maintain focus on the editor
    let bd = document.body;
    bd.addEventListener("mouseenter", function(e) {
        ogEditor.focus();
    });
    let pc = document.getElementById("toppanelcontainer");
    pc.addEventListener("click", function(e) {
        ogEditor.focus();
    });
    /////////////////////////////////////
    // Possibly enable spellchecking?  //
    /////////////////////////////////////
    if ((window.ogeSettings) &&
        ("routines" in window.ogeSettings) &&
        (window.thisextension in window.ogeSettings.routines) &&
        ("spellcheck" in window.ogeSettings.routines[window.thisextension]) &&
        (window.ogeSettings.routines[window.thisextension].spellcheck)) {
        /*setInterval(function() {*/
            let cmContents = document.getElementsByClassName("cm-content");
            if (cmContents && cmContents.length > 0) {
                cmContents[0].spellcheck = true;
            }/*
            let cmLines = document.getElementsByClassName("cm-line");
            for (let l of cmLines) {
                l.spellcheck = true;
            }
        }, 1000);*/
    }

}

function stdErrorInclusion(stderr) {
    return stderr;
}

// function to read pipe command form and start the filter
function submitGitCmd() {
    // ensure that the input field exists and read its value
    let gitentry = document.getElementById("gitentry");
    if (!gitentry) { return; }
    let msg = gitentry.value.trim();
    // close the form
    ogEditor.togglePanel();
    // don't process an empty command
    if (msg == '') { return; }
    // run filter
    ogEditor.gitcommit({},msg);
}

// function to read pipe command form and start the filter
function submitPipeCmd() {
    // ensure that the input field exists and read its value
    let pipeentry = document.getElementById("pipeentry");
    if (!pipeentry) { return; }
    let cmd = pipeentry.value.trim();
    // close the form
    ogEditor.togglePanel();
    // don't process an empty command
    if (cmd == '') { return; }
    // run filter
    ogEditor.pipefilter({},cmd);
}
