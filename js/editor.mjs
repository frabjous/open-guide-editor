// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

/////////////////////// editor.js //////////////////////////////////////
// The script that creates the core codemirror instance and interacts //
// with its extensions, keymaps, settings, etc.                       //
////////////////////////////////////////////////////////////////////////

//
// Modules
//
import {EditorView, basicSetup} from "codemirror";
import {
    cursorLineBoundaryBackward,
    copyLineDown,
    cursorCharLeft,
    cursorLineDown,
    cursorLineUp,
    cursorMatchingBracket,
    deleteLine,
    deleteToLineEnd,
    indentWithTab,
    insertBlankLine,
    insertNewlineAndIndent,
    toggleComment } from "@codemirror/commands"
import {indentUnit} from '@codemirror/language';
import {EditorState, StateEffect} from "@codemirror/state";
import {search, openSearchPanel, closeSearchPanel} from '@codemirror/search';
import {keymap} from "@codemirror/view";
// languages
import {markdown} from '@codemirror/lang-markdown';
import {html} from '@codemirror/lang-html';
import {css} from '@codemirror/lang-css';
//
// Keymap and new commands for keymap
//
const saveCmd = function(view) {
    if (view.save) { view.save(); }
}

const pipeCmd = function(view) {
    if (view.pipedialog) { view.pipedialog(); }
}

const insertBlankLineUp = function(view) {
    // handle first line differently
    cursorLineBoundaryBackward(view);
    insertNewlineAndIndent(view);
    cursorCharLeft(view);
}

const smartDeleteLine = function(view) {
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
    return false;
}

const toggleWrap = function(view) {
    if (!view.wrapButton) {
        return;
    }
    if (view.wrapButton.mystate == "inactive") {
        if (view.wrapon) { view.wrapon(); }
        return;
    }
    view.wrapoff();
}

const additionalKeymap = [
    { key: "Ctrl-d", run: copyLineDown, preventDefault: true },
    { key: "Ctrl-x", run: smartDeleteLine },
    { key: "Ctrl-k", run: deleteToLineEnd, preventDefault: true },
    { key: "Alt-5", run: cursorMatchingBracket, preventDefault: true },
    { key: "Alt-/", run: toggleComment, preventDefault: true },
    { key: "Alt-\\", run: pipeCmd, preventDefault: true },
    { key: "Ctrl-\\", run: pipeCmd, preventDefault: true },
    { key: "Ctrl-|", run: pipeCmd, preventDefault: true },
    { key: "Ctrl-s", run: saveCmd, preventDefault: true },
    { key: "Alt-w", run: toggleWrap, preventDefault: true },
    { key: "Ctrl-ArrowUp", run: insertBlankLineUp, preventDefault: true },
    { key: "Ctrl-ArrowDown", run: insertBlankLine, preventDefault: true }
]
// determine filetype
const langExtensions = [];
if (window.thisextension == 'md') {
    langExtensions.push(markdown());
} if (window.thisextension == 'css') {
    langExtensions.push(css());
} if ((window.thisextension == 'html') || (window.thisextension == 'html')) {
    langExtensions.push(html());
}

//
// Editor
//
let extensions = [
    keymap.of(additionalKeymap),
    basicSetup,
    search({ top: true }),
    EditorView.updateListener.of((update) => {
        if (update.docChanged) {
            window.numchanges++;
            if (editor?.saveButton) {
                if (editor.saveButton.mystate == 'unchanged') {
                    editor.saveButton.makeState('changed');
                }
            }
            if (document.title) {
                window.setTitle(true);
            }
            if (window.autoprocessing && ogEditor.triggerAutoprocess) {
                ogEditor.triggerAutoprocess();
            }
        }
    }),
    indentUnit.of('    '),
    keymap.of([indentWithTab]),
    EditorView.lineWrapping,
    langExtensions
];

// create the editor
let editor = new EditorView({
    doc: window.filecontents,
    extensions: extensions,
    parent: document.getElementById("editorparent")
});


// may need to fix this so it doesn't necessarily use original
// extensions
editor.wrapoff = function() {
    let newextensions = [];
    for (let ext of extensions) {
        if (ext != EditorView.lineWrapping) {
            newextensions.push(ext);
        }
    }
    editor.dispatch({
        effects: StateEffect.reconfigure.of(newextensions)
    });
    if (this.wrapButton) {
        this.wrapButton.makeState("inactive");
    }
}

// attach certain commands to be useable in other scripts
editor.wrapon = function() {
    editor.dispatch({
        effects: StateEffect.reconfigure.of(extensions)
    });
    if (this.wrapButton) {
        this.wrapButton.makeState("active");
    }
}

editor.opensearch = function() {
    openSearchPanel(this);
}

editor.closesearch = function() {
    closeSearchPanel(this);
}

editor.linedown = function() {
    cursorLineDown(this);
}

editor.pipedialog = function() {
    this.dispatch(
    )
}

window.ogEditor = editor;

