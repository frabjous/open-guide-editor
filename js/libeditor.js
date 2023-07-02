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
    //
    // get contents of file from server; currently unused?
    //
    ogEditor.grabcontents = async function(dir, fn) {
        // do a json fetch of the file
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
        // check we actually got what we asked for from server
        if (!("filecontents" in grab.respObj)) {
            ogEditor.openButton.makeState("error");
            ogDialog.errdiag("No file contents sent.");
            return;
        }
        // check it told us what we're now viewing
        if ((!("newdir" in grab.respObj)) ||
            (!("newfn" in grab.respObj))) {
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
    // HANDLE MESSAGE FUNCTION
    //
    ogEditor.handlemessage =function(data) {
        if (data?.refreshed || data?.loaded) {
            ogEditor.previewButton.makeState("active");
            window.viewedonce = true;
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
        let formhtml = '<div class="oge-pipeform">' +
            '<div><label for="pipeentry">Unix pipe command to filter through:</label></div>' +
            '<div><input type="text" id="pipeentry"></div>' +
            '<div><button type="button" onclick="submitPipeCmd()">run filter</button></div>' +
            '</div>';
        window.pipeBDiv = ogDialog.popupform(formhtml,true);
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
                const ts = now.getFullYear.toString() + '-' +
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
                    window.setTitle(false);
                }
                // if we have a new filename, so reload to it
                if (window.reloadonsave) {
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
            if (respObj?.processingResult &&
                ("stderr" in respObj?.processResult)) {
                processingerror + stdErrorInclusion(
                    respObj?.processResult?.stderr
                );
            }
        }

        // if there were errors saving the file, report them
        if (saveerror != '') {
            ogEditor.saveButton.makeState('error');
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
                // make download button error if download
                if ((opts?.download) &&
                    (ogEditor?.downloadButtons?.[opts.outputext])) {
                    ogEditor.downloadButtons[opts.outputext]
                        .makeState('error');
                }
            }
            ogDialog.errdiag('Processing error: ' + processingerror);
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
                if (opts?.launch ||
                    ((!window.viewedonce) &&
                    (outputext in window.outputextensions) &&
                    (window.outputextensions[outputext].viewable))) {
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
        ogEditor.outputSelectButton.makeState(window.outputopts[0]);
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
    // TODO: speak aloud button
}

function stdErrorInclusion(stderr) {
    return '<br><pre class="stderr">' + stderr + '</pre><br>';
}

// function to read pipe command form and start the filter
function submitPipeCmd() {
    // ensure that the input field exists and read its value
    let pipeentry = document.getElementById("pipeentry");
    if (!pipeentry) { return; }
    let cmd = pipeentry.value.trim();
    // close the form
    window.pipeBDiv.closeMe();
    // don't process an empty command
    if (cmd == '') { return; }
    // run filter
    ogEditor.pipefilter({},cmd);
}
