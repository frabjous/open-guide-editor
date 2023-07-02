// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

/////////////////////////////// readaloud.js //////////////////////////////
// creates a button for playing the text of the edited document out loud //
///////////////////////////////////////////////////////////////////////////

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
            icon: "pause_circle",
            tooltip: "stop reading aloud",
            clickfn: function() { ogEditor.stopReadAloud(); }
        }
    },true);
    ogEditor.readaloudButton.makeState("inactive");

    ogEditor.startReadAloud = function() {
        // mark as playable
        ogEditor.readaloudButton.makeState("active");
        // initiate variables
        let texttoread = '';
        let continuenextline = true;
        // see if we have selected text
        let sel = ogEditor.getfirstselection();
        // if something is selected, it is the text we use
        if (sel.selectedtext != '') {
            texttoread = sel.selectedtext;
            continuenextline = false;
        } else {
            // if nothing is selected, we get the current line
            let r = ogEditor.state.selection.ranges[0];
            texttoread = ogEditor.state.doc.lineAt(r.from).text;
            // don't continue afterwards if this is the last line
            if (r.from == ogEditor.state.doc.lines) {
                continuenextline = false;
            }
        }
        // create the audio element if need be
        if (!ogEditor.readaudio) {
            ogEditor.readaudio = newElem('audio',document.body);
            ogEditor.readaudio.controls = false;
        }
        // get mp3 data from PHP
        ogEditor.readaudio.src = 'php/getaudio.php?text=' +
            encodeURIComponent(texttoread) +
            '&accesskey=' + encodeURIComponent(window.accesskey);
        // start over from start of selected text
        ogEditor.readaudio.currentTime = 0;
        // set to continue to next line on end, or stop
        ogEditor.readaudio.onended = () => {
            if (!continuenextline) {
                ogEditor.stopReadAloud();
                return;
            }
            this.linedown();
            ogEditor.startReadAloud()
        }
        // play audio
        ogEditor.readaudio.play();
    }

    ogEditor.stopReadAloud = function() {
        if (ogEditor.readaudio) { ogEditor.readaudio.pause(); }
        ogEditor.readaloudButton.makeState("inactive");
    }

}
