// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

//////////////////// mytheme.mjs ////////////////////////////////////////
// defines the color scheme used by the open guide editor              //
/////////////////////////////////////////////////////////////////////////

import {EditorView} from "@codemirror/view"
import {HighlightStyle, syntaxHighlighting} from "@codemirror/language"
import {tags as t} from "@lezer/highlight"

// Using https://github.com/one-dark/vscode-one-dark-theme/ as reference for the colors

const accent = "#87afdf";
const brightblack = "#898a8b";
const brightblue = "#c3d7ef";
const brightcyan = "#d7efef";
const brightgray1 = "#97989a";
const brightgray2 = "#a6a7a9";
const brightgray3 = "#b4b6b8";
const brightgray4 = "#c3c5c7";
const brightgray5 = "#d1d3d6";
const brightgray6 = "#e0e2e4";
const brightgreen = "#d7efc3";
const brightmagenta = "#efd7ef";
const brightorange = "#fad7b8";
const brightpurple = "#c7ace4";
const brightred = "#efc3c3";
const brightwhite = "#eef1f3";
const brightyellow = "#ffffd7"
const black = "#131518";
const blue = "#87afdf";
const cyan = "#afdfdf";
const gray1 = "#303236";
const gray2 = "#4d5053";
const gray3 = "#6a6d71";
const gray4 = "#878b8f";
const gray5 = "#a4a8ad";
const gray6 = "#c1c6ca";
const green = "#afdf87";
const magenta = "#dfafdf";
const orange = "#f5af71";
const purple = "#8f5ac9";
const red = "#df8787";
const white = "#dee3e8";
const yellow = "#ffffaf";
const cursor = brightpurple;
const selection = gray3;
const selectionfg = white;
const foreground = white;
const background = black;

/// The editor theme styles for One Dark.
export const ogeColorTheme = EditorView.theme({
    "&": {
        color: foreground,
        backgroundColor: background
    },

    ".cm-content": {
        caretColor: cursor
    },

    ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: cursor
    },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: selection,
        color: selectionfg
    },
    ".cm-panels": {
        backgroundColor: gray2,
        color: foreground,
        fontFamily: 'sans-serif'
    },
    ".cm-panel .cm-textfield": {
        backgroundColor: white,
        color: black,
    },
    ".cm-panel button[name=\"close\"]": {
        color: brightred, cursor: 'pointer'
    },
    ".cm-panel .cm-textfield::placeholder": {
        color: gray2,
    },
    ".cm-panels.cm-panels-top": {
        borderBottom: "2px solid " + black
    },
    ".cm-panels.cm-panels-bottom": {
        borderTop: "2px solid " + black
    },
    ".cm-searchMatch": {
        backgroundColor: cyan + "33",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
        backgroundColor: brightgreen +"55"
    },

    ".cm-activeLine": {
        backgroundColor: '#ffffff11'
    },
    ".cm-selectionMatch": {
        backgroundColor: green + "1a"
    },

    "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
        backgroundColor: orange + "88"
    },

    ".cm-gutters": {
        backgroundColor: gray2,
        color: gray5,
        border: "none"
    },

    ".cm-activeLineGutter": {
        backgroundColor: blue,
        color: gray1
    },

    ".cm-foldPlaceholder": {
        backgroundColor: "transparent",
        border: "none",
        color: white,
        fontWeight: 'bold'
    },

    ".cm-tooltip": {
        border: "none",
        backgroundColor: gray1
    },
    ".cm-tooltip .cm-tooltip-arrow:before": {
        borderTopColor: "transparent",
        borderBottomColor: "transparent"
    },
    ".cm-tooltip .cm-tooltip-arrow:after": {
        borderTopColor: gray1,
        borderBottomColor: gray1
    },
    ".cm-tooltip-autocomplete": {
        "& > ul > li[aria-selected]": {
            backgroundColor: selection,
            color: white
        }
    }
}, {dark: true})

/// The highlighting style for code in the One Dark theme.
export const ogeHighlightStyle = HighlightStyle.define([
    {tag: t.keyword,
        color: magenta},
    {tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName],
        color: cyan},
    {tag: [t.function(t.variableName), t.labelName],
        color: blue},
    {tag: [t.color, t.constant(t.name), t.standard(t.name)],
        color: orange},
    {tag: [t.definition(t.name), t.separator],
        color: foreground},
    {tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace],
        color: yellow},
    {tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.special(t.string)],
        color: purple},
    {tag: [t.meta, t.comment],
        color: gray4},
    {tag: t.strong,
        fontWeight: "bold", color: blue},
    {tag: t.emphasis,
        fontStyle: "italic", color: red},
    {tag: t.strikethrough,
        textDecoration: "line-through", color: gray4},
    {tag: t.link,
        color: blue},
    {tag: t.heading,
        fontWeight: "bold", textDecoration: "underline", color: magenta },
    {tag: [t.atom, t.bool, t.special(t.variableName)],
        color: orange },
    {tag: [t.processingInstruction, t.string, t.inserted],
        color: green},
    {tag: t.invalid,
        color: red},
])

/// Extension to enable the One Dark theme (both the editor theme and
/// the highlight style).
export const ogeTheme = [ogeColorTheme, syntaxHighlighting(ogeHighlightStyle)]
