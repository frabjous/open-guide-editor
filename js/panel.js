
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

/////////////////////////panel.js/////////////////////////////////
// A couple functions shared between editor window and preview  //
// window to create panel buttons, etc.                         //
//////////////////////////////////////////////////////////////////


// creates a new element with a parent, class names and innerHTML
function newElem(tagtype, par, classes = [], contents = '') {
    let e = document.createElement(tagtype);
    for (const cl of classes) {
        e.classList.add(cl);
    }
    if ((contents) && (contents != '')) {
        e.innerHTML = contents;
    }
    if (par) {
        par.appendChild(e);
    }
    return e;
}

// generic function to create the panel buttons
function panelButton( possstates ) {
    // create button and add to panel
    let panel = document.getElementById("toppanel");
    let b = newElem( "div", panel, ["panelbutton"], '');
    // create span with material symbols outlined class
    b.iconspan = newElem("span", b, ["material-symbols-outlined"],'');
    // set possible states it can have
    b.possstates = possstates;
    // function to state of button
    b.makeState = function(st) {
        // if impossible state given, leave error and stop
        if (!st in this.possstates) {
            console.error("Non-possible state given for ", b);
            return;
        }
        // change icon to the one for the state
        if (this.iconspan.innerHTML != (this?.possstates?.[st]?.icon)) {
            this.iconspan.innerHTML = ((this?.possstates?.[st]?.icon) ?? '');
        }
        // change the tooltip
        if (this?.possstates?.[st]?.tooltip != this.title) {
            this.title = ((this?.possstates?.[st]?.tooltip) ?? '');
        }
        // change on-click function
        if (this?.onclick != this?.possstates?.[st]?.clickfn) {
            this.onclick = (this?.possstates?.[st]?.clickfn ?? function() {});
        }
        // add class for state
        this.classList.add(st);
        this.mystate = st;
        // remove other classes
        for (const poss in b.possstates) {
            if (poss != st) {
                this.classList.remove(poss);
            }
        }
    }
    return b;
}

