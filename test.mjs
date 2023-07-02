import {basicSetup} from "codemirror";
import {texSyntax} from 'lang-tex';

let editor = new EditorView({
    extensions: [basicSetup, textSyntax()],
    parent: document.getElementById("editorparent")
});

export default editor;
