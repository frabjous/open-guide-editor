// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

/////////////////////// cmpanels.mjs ////////////////////////////////////
// Creates small panels on top of codemirror                           //
////////////////////////////////////////////////////////////////////////

//
// Modules
//
import {showPanel, EditorView, keymap} from "@codemirror/view";
import {StateField, StateEffect} from "@codemirror/state";

const togglePnl = StateEffect.define();

const pnlState = StateField.define({
    create: () => false,
    update(value, tr) {
        for (let e of tr.effects) if (e.is(togglePnl)) value = e.value;
        return value;
    },
    provide: f => showPanel.from(f, on => on ? createPnl : null)
});

function createPnl(view) {
    if (!window.ogePanel) {
        window.ogePanel = document.createElement("div");
    }
    window.ogePanel.innerHTML = '';
    window.ogePanel.className = "cm-oge-panel";
    return { top: true, dom: window.ogePanel };
}

export function toggleOgePanel(view) {
    view.dispatch({
        effects: togglePnl.of(!view.state.field(pnlState))
    });
    return true;
}

const pnlKeymap = [{
    key: "F2",
    run(view) {
        return toggleOgePanel(view);
    }
}];

const ogePnlTheme = EditorView.baseTheme({
    ".cm-oge-panel": {
        padding: "0.5rem",
        backgroundColor: "var(--gray2)",
        fontFamily: "sans-serif"
    }
});

export function ogePanel() {
    return [pnlState, keymap.of(pnlKeymap), ogePnlTheme];
}



