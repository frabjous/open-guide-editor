import {EditorView, basicSetup} from "codemirror";
import {texSyntax} from "lang-tex";

let editor = new EditorView({
    extensions: [basicSetup, texSyntax()],
    parent: document.getElementById("editorparent")
});

export default editor;
