
// ___ ___   ___   ___    __ __  _        ___  _____
//|   T   T /   \ |   \  |  T  T| T      /  _]/ ___/
//| _   _ |Y     Y|    \ |  |  || |     /  [_(   \_
//|  \_/  ||  O  ||  D  Y|  |  || l___ Y    _]\__  T
//|   |   ||     ||     ||  :  ||     T|   [_ /  \ |
//|   |   |l     !|     |l     ||     ||     T\    |
//l___j___j \___/ l_____j \__,_jl_____jl_____j \___j

import {EditorView, basicSetup} from "codemirror";
/*import {javascript} from "@codemirror/lang-javascript";*/
import {indentWithTab} from "@codemirror/commands"
import {indentUnit} from '@codemirror/language';
import {markdown} from '@codemirror/lang-markdown';
import {EditorState} from "@codemirror/state";
import {oneDark, color} from '@codemirror/theme-one-dark';
import {keymap} from "@codemirror/view";

//            ___ __
//  ___  ____/ (_) /_____  _____
// / _ \/ __  / / __/ __ \/ ___/
///  __/ /_/ / / /_/ /_/ / /
//\___/\__,_/_/\__/\____/_/
//

let editor = new EditorView({
    extensions: [
        basicSetup,
        indentUnit.of('    '),
        keymap.of([indentWithTab]),
        markdown(),
        oneDark
    ],
    parent: document.getElementById("editorparent")
});

window.stylecolors = color;
window.ogEditor = editor;

