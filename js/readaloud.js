
window.readaloud = true;

function makeReadAloudButton() {
    if (!ogEditor) { return; }
    // create preview window button
    ogEditor.readaloudButton = panelButton({
        "inactive": {
            icon: "campaign",
            tooltip: "read text aloud",
            clickfn: function() { ogEditor.startReadAloud(); }
        },
        "active": {
            icon: "pause_circle,
            tooltip: "stop reading aloud",
            clickfn: function() { ogEditor.stopReadAloud(); }
        }
    });
    ogEditor.readaloudButton.makeState("inactive");

    ogEditor.startReadAloud = function() {
        ogEditor.readaloudButton.makeState("active");
        let sel = ogEditor.getfirstselection();
        let texttoread = '';
        let continuenextline = true;
        if (sel.selectedtext != '') {
            texttoread = sel.selectedtext;
            continuenextline = false;
        }
        if (
        if (!ogEditor.readaudio) {
            ogEditor.readaudio = newElem('audio',document.body);
            ogEditor.readaudio.controls = false;
        }
        ogEditor.readaudio.src = 'php/getaudio.php?text=' +
            encodeURIComponent(texttoread) +
            '&accesskey=' + encodeURIComponent(window.accesskey);
        ogEditor.audiosrc.play();
    }

/*
        if (!view.getfirstselection) { return false; }
    let sel = view.getfirstselection();
    if (sel.selectedtext == '') {
        // nothing selected, get text of current line, copy to clipboard
        if (navigator?.clipboard) {
            let r = view.state.selection.ranges[0];
            if (r.from == r.to) {
                let txt = view.state.doc.lineAt(r.from).text;
                navigator.clipboard.writeText(txt);
            }
        }
        // delete the line
        deleteLine(view);
        return true;
    }
    // returning false passes through to next binding
    return false;*/
}
