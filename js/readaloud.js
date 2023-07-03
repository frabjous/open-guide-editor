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

    ogEditor.playNextLine = function() {
        // stop if this last line, or we were only doing selection
        if (!ogEditor.continuenextline) {
            ogEditor.stopReadAloud();
            return;
        }
        // move down and play again
        ogEditor.linedown();
        ogEditor.startReadAloud()
    }

    ogEditor.startReadAloud = function() {
        // mark as playable
        ogEditor.readaloudButton.makeState("active");
        // initiate variables
        let texttoread = '';
        ogEditor.continuenextline = true;
        // see if we have selected text
        let sel = ogEditor.getfirstselection();
        // if something is selected, it is the text we use
        if (sel.selectedtext != '') {
            texttoread = sel.selectedtext;
            ogEditor.continuenextline = false;
        } else {
            // if nothing is selected, we get the current line
            let r = ogEditor.state.selection.ranges[0];
            texttoread = ogEditor.state.doc.lineAt(r.from).text;
            // don't continue afterwards if this is the last line
            if (ogEditor.state.doc.lineAt(r.from).number
                    == ogEditor.state.doc.lines) {
                ogEditor.continuenextline = false;
            }
        }
        // Only play lines with letters in them
        if (!(/[A-Za-z]/.test(texttoread))) {
            ogEditor.playNextLine();
            return;
        }
        // create the audio element if need be
        if (!ogEditor.readaudio) {
            ogEditor.readaudio = newElem('audio',document.body);
            ogEditor.readaudio.controls = false;
        }
        // strip double quotation marks that might screw up cmd
        texttoread = texttoread.replace('"','');
        // get mp3 data from PHP
        ogEditor.readaudio.src = 'php/getaudio.php?text=' +
            encodeURIComponent(texttoread) +
            '&accesskey=' + encodeURIComponent(window.accesskey) +
            '&ext=' + encodeURIComponent(window.thisextension);
        // start over from start of selected text
        ogEditor.readaudio.currentTime = 0;
        ogEditor.readaudio.preload = true;
        // set to continue to next line on end, or stop
        ogEditor.readaudio.onended = () => {
            ogEditor.playNextLine();
            return;
        }
        ogEditor.readaudio.onerror = function(e) {
            ogEditor.playNextLine();
            return;
        }
        // play audio
        ogEditor.readaudio.play();
    }

    ogEditor.stopReadAloud = function() {
        if (ogEditor.readaudio) { ogEditor.readaudio.pause(); }
        ogEditor.readaloudButton.makeState("inactive");
    }

}

