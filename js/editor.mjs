import {EditorView, basicSetup} from "../node_modules/codemirror"
import {javascript} from "../node_modules/@codemirror/lang-javascript"

let editor = new EditorView({
  extensions: [basicSetup, javascript()],
  parent: document.getElementById("editorparent")
})

