// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

/////////////////////// editor.mjs /////////////////////////////////////
// The script that creates the core codemirror instance and interacts //
// with its extensions, keymaps, settings, etc.                       //
////////////////////////////////////////////////////////////////////////

//
// Modules
//
import {indentUnit, toggleFold, StreamLanguage} from '@codemirror/language';
import {EditorView, basicSetup} from "codemirror";
import {
    cursorLineBoundaryBackward,
    copyLineDown,
    cursorCharLeft,
    cursorCharRight,
    cursorLineDown,
    cursorLineUp,
    cursorMatchingBracket,
    deleteLine,
    deleteToLineEnd,
    indentLess,
    indentMore,
    indentSelection,
    indentWithTab,
    insertBlankLine,
    insertNewlineAndIndent,
    toggleComment } from "@codemirror/commands"
import {CompletionContext} from "@codemirror/autocomplete";
import {EditorState, StateEffect} from "@codemirror/state";
import {search, openSearchPanel, closeSearchPanel} from '@codemirror/search';
import {keymap, scrollPastEnd} from "@codemirror/view";
// languages
import {markdown, markdownLanguage} from '@codemirror/lang-markdown';
import {html} from '@codemirror/lang-html';
import {css} from '@codemirror/lang-css';
import {xml} from '@codemirror/lang-xml';
import {json} from '@codemirror/lang-json';
import {php} from '@codemirror/lang-php';
import {javascript} from '@codemirror/lang-javascript';
import {lua} from '@codemirror/legacy-modes/mode/lua';
import {stex} from '@codemirror/legacy-modes/mode/stex';
import {shell} from '@codemirror/legacy-modes/mode/shell';
import {yaml} from '@codemirror/legacy-modes/mode/yaml';
//import { texSyntax } from "lang-tex";

// my package
import { ogeTheme } from './theme.mjs';
import { ogePanel, toggleOgePanel } from './cmpanels.mjs';

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

const gotoLineDiag = function(view) {
    if (view.gotolinediag) {
        view.gotolinediag();
    }
}

const smartDeleteLine = function(view) {
    // determine whether something is selected
    let smthgsel = view.state.selection.ranges.some(r => !r.empty);
    // if not, delete the line
    if (!smthgsel) {
        if (window.navigator?.clipboard) {
            let fr = view.state.selection.main.head;
            let txt = view.state.doc.lineAt(fr).text.toString();
            window.navigator.clipboard.writeText(txt + "\n");
        }
        deleteLine(view);
        return true;
    }
    // by returning false we pass on to next binding
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

const joinLines = function(view) {
    let smthgsel = view.state.selection.ranges.some(r => !r.empty);
    let fr = 0;
    let to = 0;
    if (smthgsel) {
        // if something selected, that determines range
        fr = view.state.selection.main.from;
        to = view.state.selection.main.to;
    } else {
        // otherwise, take current line
        let cpos = view?.state?.selection?.main?.anchor ?? 0;
        const stline = view.state.doc.lineAt(cpos);
        const stlinenum = stline.number;
        const nextline = view.state.doc.line(stlinenum+1);
        if (!nextline) { return; }
        fr = stline.from;
        to = nextline.to;
    }
    let stuff = view.state.sliceDoc(fr, to);
    let newstuff = stuff.replace(/\s*\n\s*/g,' ');
    view.dispatch(view.state.update({
        changes: {
            from: fr,
            to: to,
            insert: newstuff
        }
    }));
    return true;
}

// marks the current line number as the jump-to position
const markJump = function(view) {
    let cpos = view?.state?.selection?.main?.anchor ?? 0;
    window.jumpline = view.state.doc.lineAt(cpos).number;
    return true;
    //TODO acknowledge or mark line
}


// jumps to the marked line number
const jumpToMark = function(view) {
    if (view.gotoline) { view.gotoline(window?.jumpline ?? 1); }
    return true;
}

// runs the view's process command
const processDocument = function (view) {
    if (view.process) { view.process({}); }
    return true;
}

const forwardJump = function (view) {
    if (view.forwardjump) { view.forwardjump({}); }
    return true;
}

const toggleAutoprocessing = function(view) {
    if ((view.autoprocess) && (view.autoprocessButton)) {
        let turnon = (view.autoprocessButton.mystate == 'inactive');
        view.autoprocess(turnon);
    }
    return true;
}

const togglePreview = function(view) {
    if ((view.preview) && (view.previewButton)) {
        let turnon = (view.previewButton.mystate == 'inactive');
        view.preview(turnon);
    }
    return true;
}

const openFile = function(view) {
    if ((view.openfile) && (view.openButton)) {
        view.openfile();
    }
    return true;
}

const additionalKeymap = [
    { key: "Ctrl-d", run: copyLineDown, preventDefault: true },
    { key: "Ctrl-r", run: openSearchPanel, preventDefault: true },
    { key: "Ctrl-j", run: joinLines, preventDefault: true },
    { key: "Alt-t", run: toggleFold, preventDefault: true },
    { key: "Ctrl-o", run: openFile, preventDefault: true },
    { key: "Ctrl-k", run: deleteToLineEnd, preventDefault: true },
    { key: "Ctrl-x", run: smartDeleteLine },
    { key: "F5", run: processDocument, preventDefault: true },
    { key: "Ctrl-F5", run: processDocument, preventDefault: true },
    { key: "F6", run: togglePreview, preventDefault: true },
    { key: "Ctrl-F6", run: togglePreview, preventDefault: true },
    { key: "Ctrl-F7", run: toggleAutoprocessing, preventDefault: true },
    { key: "F7", run: toggleAutoprocessing, preventDefault: true },
    { key: "Ctrl-F8", run: forwardJump, preventDefault: true },
    { key: "F8", run: forwardJump, preventDefault: true },
    { key: "Alt-5", run: cursorMatchingBracket, preventDefault: true },
    { key: "Alt-j", run: jumpToMark, preventDefault: true },
    { key: "Alt-m", run: markJump, preventDefault: true },
    { key: "Alt-n", run: gotoLineDiag, preventDefault: true },
    { key: "Alt-/", run: toggleComment, preventDefault: true },
    { key: "Alt-\\", run: pipeCmd, preventDefault: true },
    { key: "Alt-|", run: pipeCmd, preventDefault: true },
    { key: "Alt-,", run: indentLess, preventDefault: true },
    { key: "Ctrl-,", run: indentLess, preventDefault: true },
    { key: "Alt-<", run: indentLess, preventDefault: true },
    { key: "Ctrl-<", run: indentLess, preventDefault: true },
    { key: "Alt-.", run: indentMore, preventDefault: true },
    { key: "Ctrl-.", run: indentMore, preventDefault: true },
    { key: "Alt->", run: indentMore, preventDefault: true },
    { key: "Ctrl->", run: indentMore, preventDefault: true },
    { key: "Ctrl-\\", run: pipeCmd, preventDefault: true },
    { key: "Ctrl-|", run: pipeCmd, preventDefault: true },
    { key: "Ctrl-s", run: saveCmd, preventDefault: true },
    { key: "Alt-w", run: toggleWrap, preventDefault: true },
    { key: "Shift-Tab", run: indentSelection, preventDefault: true },
    { key: "Alt-Shift-Tab", run: indentSelection, preventDefault: true },
    { key: "Alt-Tab", run: indentSelection, preventDefault: true },
    { key: "Ctrl-ArrowUp", run: insertBlankLineUp, preventDefault: true },
    { key: "Ctrl-ArrowDown", run: insertBlankLine, preventDefault: true }
]


// bibliography completion
function ogeCompletions(context) {
    let word = context.matchBefore(/@[0-9A-Za-z_-]*/);
    if (word) {
        return {
            from: word.from,
            options: window.bibcompletions
        };
    }
    if (!context.explicit) { return null; }
}

// determine filetype
const langExtensions = [];
const ext = window.thisextension;
if (ext == 'md') {
    langExtensions.push(markdown({base: markdownLanguage}));
    langExtensions.push(EditorState.languageData.of(( ) =>
        [{autocomplete: ogeCompletions}]));
} else if (ext == 'css') {
    langExtensions.push(css());
} else if ((ext == 'html') || (ext == 'html')) {
    langExtensions.push(html());
} else if ((ext == 'svg') || (ext == 'xml')) {
    langExtensions.push(xml());
} else if (ext == 'lua') {
    langExtensions.push(StreamLanguage.define(lua));
} else if (ext == 'json') {
    langExtensions.push(json());
} else if ((ext == 'js') || (ext == 'mjs')) {
    langExtensions.push(javascript());
} else if (ext == 'php') {
    langExtensions.push(php());
} else if (['tex','cls','sty'].indexOf(ext) >= 0) {
    langExtensions.push(StreamLanguage.define(stex));
} else if (['sh','zsh','bash'].indexOf(ext) >= 0) {
    langExtensions.push(StreamLanguage.define(shell));
} else if (ext == 'yaml') {
    langExtensions.push(StreamLanguage.define(yaml));
}
/*else if (ext == 'tex') {
    langExtensions.push(texSyntax());
}*/


//
// Editor
//
let extensions = [
    ogePanel(),
    keymap.of(additionalKeymap),
    search({ top: true }),
    EditorView.updateListener.of((update) => {
        if (update.docChanged) {
            window.numchanges++;
            if (editor?.saveButton) {
                if (editor.saveButton.mystate == 'unchanged') {
                    editor.saveButton.makeState('changed');
                    if (editor.gitButton) {
                        editor.gitButton.makeState("disabled");
                    }
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
    scrollPastEnd(),
    EditorView.lineWrapping,
    basicSetup,
    ogeTheme,
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
    const r = this.state.selection.ranges[0];
    const ln = this.state.doc.lineAt(r.from).number;
    const linenum = ln +1;
    const pos = this.state.doc.line(linenum).from;
    this.dispatch(this.state.update({
        selection: { anchor: pos, head: pos },
        scrollIntoView: true
    }));
}

editor.goright = function() {
    cursorCharRight(this);
}

editor.togglePanel = function() {
    toggleOgePanel(this);
}

window.ogEditor = editor;

