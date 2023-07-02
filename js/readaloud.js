
window.readaloud = true;

function makeReadAloudButton() {
    if (!ogEditor) { return; }
    // create preview window button
    ogEditor.readaloudButton = panelButton({
        "inactive": {
            icon: "campaign",
            tooltip: "activate preview",
            clickfn: function() { ogEditor.startReadAloud(true); }
        },
        "active": {
            icon: "pause_circle,
            tooltip: "deactivate preview",
            clickfn: function() { ogEditor.stopReadAloud(false); }
        }
    });
    ogEditor.previewButton.makeState("inactive");

}
