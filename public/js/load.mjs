// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: load.mjs
// Defines those key functions that call things from the codemirror
// libraries; used to create the editor.mjs through npm run build.
// Should not be loaded directly, but only through editor.mjs.

// Base CodeMirror packages imports
import {
  Annotation,
  EditorSelection,
  EditorState,
  StateEffect,
  Transaction
} from "@codemirror/state";
import {
  copyLineDown,
  cursorCharLeft,
  cursorCharRight,
  cursorLineDown,
  cursorLineEnd,
  cursorLineStart,
  cursorLineUp,
  cursorMatchingBracket,
  defaultKeymap,
  deleteLine,
  deleteToLineEnd,
  deleteToLineStart,
  history,
  historyKeymap,
  indentLess,
  indentMore,
  indentSelection,
  indentWithTab,
  insertBlankLine,
  insertNewlineAndIndent,
  insertNewlineKeepIndent,
  moveLineUp,
  redo,
  toggleComment,
  undo
} from "@codemirror/commands";
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  gutter,
  GutterMarker,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  highlightTrailingWhitespace,
  keymap,
  lineNumbers,
  rectangularSelection,
  scrollPastEnd,
  showPanel
} from "@codemirror/view";
import {
  foldGutter,
  bracketMatching,
  defaultHighlightStyle,
  foldKeymap,
  indentOnInput,
  indentUnit,
  toggleFold,
  StreamLanguage,
  syntaxHighlighting
} from '@codemirror/language';
import {
  closeSearchPanel,
  findNext,
  findPrevious,
  highlightSelectionMatches,
  openSearchPanel,
  replaceAll,
  replaceNext,
  search,
  searchKeymap,
  selectMatches
} from '@codemirror/search';
import {lintKeymap} from '@codemirror/lint';
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  CompletionContext,
  completionKeymap
} from '@codemirror/autocomplete';
import {classHighlighter} from "@lezer/highlight";
import {indentationMarkers} from '@replit/codemirror-indentation-markers';

// Language imports
import {css} from '@codemirror/lang-css';
import {html} from '@codemirror/lang-html';
import {javascript} from '@codemirror/lang-javascript';
import {json} from '@codemirror/lang-json';
import {lua} from '@codemirror/legacy-modes/mode/lua';
import {markdown, markdownLanguage} from '@codemirror/lang-markdown';
import {php} from '@codemirror/lang-php';
import {shell} from '@codemirror/legacy-modes/mode/shell';
import {stex} from '@codemirror/legacy-modes/mode/stex';
import {xml} from '@codemirror/lang-xml';
import {yaml, yamlFrontmatter} from '@codemirror/lang-yaml'

// my imports
import {addelem, iconOf} from './misc.mjs';
import symbols from './symbols.mjs';

/// PANELS ///////////////////////////

function clearnonnums() {
  this.value = this.value.replace(/[^0-9]/g,'');
}

function cursorPosition(state) {
  const cpos = state?.selection?.main?.anchor ?? 0;
  const stline = state?.doc?.lineAt(cpos);
  const numlines = state?.doc?.lines;
  const linenum = stline?.number ?? 0;
  const linestart = stline?.from ?? 0;
  const lineend = stline?.to ?? 0;
  const linewidth = lineend - linestart;
  const colnum = cpos - linestart;
  return { linenum, colnum, linewidth, numlines };
}

// arrays storing previous uses of bottom panel input fields
// for retrieval with arrow up and arrow down
let findvals = [];
let replacevals = [];
let filtervals = [];

function applyUnixFilter(fresults, unixcmd) {
  const view = this;
  // add to history list
  if (filtervals[filtervals.length-1] != unixcmd) {
    filtervals.push(unixcmd);
  }
  view.dispatch(view.state.changeByRange((range) => {
    const mymatches = fresults.filter((res) =>
      (res.from == range.from && res.to == range.to));
    if (mymatches.length == 0) return {
      changes: [], range: EditorSelection.range(range.from, range.to)
    }
    const newtext = mymatches?.[0]?.text ?? '';
    return {
      changes: [{
        from: range.from,
        to: range.to,
        insert: newtext
      }],
      range: EditorSelection.range(
        range.from,
        range.from + newtext.length
      )
    }
  }));
}

// we count panels in order to give them unique ids
let pnlctr = 0;

function bottomPanel(view) {
  let dom = document.createElement("div");
  view.mypanel = dom;
  pnlctr++;
  const idbase = 'bottompanel' + pnlctr.toString();
  dom.classList.add('oge-bottom-panel');

  // LEFT //

  // git and filter toggles
  dom.toggleBtnDiv = addelem({
    tag: 'div',
    parent: dom,
    classes: ['oge-panel-toggles']
  });
  dom.gittoggle = addelem({
    tag: 'span',
    parent: dom.toggleBtnDiv,
    innerHTML: iconOf('commit'),
    title: 'git commit (ctrl-m)',
    classes: ['oge-bottom-panel-toggle'],
    mypanel: dom,
    onclick: function(e) {
      let focus = false;
      if (e) {
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
      }
      if (this.classList.contains('active')) {
        this.classList.remove('active');
      } else {
        this.classList.add('active');
        this.mypanel.filtertoggle.classList.remove('active');
        this.mypanel.gitinp.value = '';
        focus = true;
      }
      this.mypanel.updateInputs(false);
      if (focus) this.mypanel.gitinp.focus();
    }
  });
  dom.filtertoggle = addelem({
    tag: 'span',
    parent: dom.toggleBtnDiv,
    innerHTML: iconOf('filter_alt'),
    title: 'unix pipe (ctrl-|)',
    classes: ['oge-bottom-panel-toggle'],
    mypanel: dom,
    onclick: function(e) {
      if (e?.preventDefault) e.preventDefault();
      if (e?.stopPropagation) e.stopPropagation();
      if (this.classList.contains('active')) {
        this.classList.remove('active');
      } else {
        this.classList.add('active');
        this.mypanel.gittoggle.classList.remove('active');
      }
      this.mypanel.updateInputs(false);
      this.mypanel.filterinp.focus();
    }
  });
  dom.gitarea = addelem({
    tag: 'div',
    parent: dom,
    classes: ['oge-search-find-block']
  });
  dom.gitinp = addelem({
    tag: 'input',
    parent: dom.gitarea,
    type: 'search',
    placeholder: 'new git commit message',
    myview: view,
    mypanel: dom,
    onkeydown: function(e) {
      if (e.key == 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        const commitmessage = this.value;
        if (commitmessage != '' && this?.myview?.myTab?.makeGitCommit) {
          this.myview.myTab.makeGitCommit(commitmessage);
        }
        this.mypanel.updateInputs(true);
        return;
      }
      if (e.key == 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.value = '';
        this.mypanel.updateInputs(true);
        this.myview.focus();
      }
    }
  });
  view.gitinp = dom.gitinp;
  dom.gitcommitbtn = addelem({
    tag: 'span',
    parent: dom.gitarea,
    classes: ['oge-search-find-button', 'oge-search-find-icon'],
    innerHTML: iconOf('commit'),
    myview: view,
    mypanel: dom,
    title: 'submit git commit',
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      const commitmessage = this.mypanel?.gitinp?.value;
      if (commitmessage && this?.myview?.myTab?.makeGitCommit) {
        this.myview.myTab.makeGitCommit(commitmessage);
      }
      this.mypanel.updateInputs(true);
    }
  });

  dom.filterarea = addelem({
    tag: 'div',
    parent: dom,
    classes: ['oge-search-find-block']
  });
  dom.filterinp = addelem({
    tag: 'input',
    parent: dom.filterarea,
    type: 'search',
    placeholder: 'unix filter/pipe command',
    myview: view,
    mypanel: dom,
    onkeydown: function(e) {
      if (e.key == 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (this?.value && this?.myview.unixFilter) {
          this.myview.unixFilter(this.value);
        }
        this.mypanel.updateInputs(true);
        return;
      }
      if (e.key == 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.mypanel.updateInputs(true);
        this.myview.focus();
        return;
      }
      if (e.key == 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        if (!filtervals.includes(this.value) &&
          this.value != '') {
          filtervals.push(this.value);
        }
        const where = filtervals.indexOf(this.value);
        if (where > 0) {
          this.value = (filtervals[where - 1]);
        }
        if (where == -1 && filtervals.length > 0) {
          this.value = filtervals[filtervals.length - 1];
        }
        return;
      }
      if (e.key == 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        const where = filtervals.indexOf(this.value);
        if (where == -1) return;
        if (where == filtervals.length - 1) {
          this.value = '';
          return;
        }
        this.value = filtervals[where + 1];
        return;
      }
    }
  });
  view.filterinp = dom.filterinp;
  dom.filterbtn = addelem({
    tag: 'span',
    parent: dom.filterarea,
    classes: ['oge-search-find-button', 'oge-search-find-icon'],
    innerHTML: iconOf('filter_alt'),
    myview: view,
    mypanel: dom,
    title: 'pipe text',
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      const filtertext = this.mypanel.filterinp.value;
      if (filtertext && this.myview.unixFilter) {
        this.myview.unixFilter(filtertext);
      }
      this.mypanel.updateInputs(true);
    }
  });
  view.filterbtn = dom.filterbtn;

  // search fields
  dom.searcharea = addelem({
    tag: 'div',
    parent: dom,
    classes: ['oge-search-panel']
  });

  dom.updateInputs = function(clear) {
    if (clear) {
      this.gittoggle.classList.remove('active');
      this.filtertoggle.classList.remove('active');
    }
    if (this.gittoggle.classList.contains('active')) {
      this.filterarea.classList.add('hidden');
      this.searcharea.classList.add('hidden');
      this.gitarea.classList.remove('hidden');
      return;
    }
    if (this.filtertoggle.classList.contains('active')) {
      this.gitarea.classList.add('hidden');
      this.searcharea.classList.add('hidden');
      this.filterarea.classList.remove('hidden');
      return;
    }
    this.gitarea.classList.add('hidden');
    this.filterarea.classList.add('hidden');
    this.searcharea.classList.remove('hidden');
  }
  dom.updateInputs(true);

  dom.findblock = addelem({
    tag: 'div',
    parent: dom.searcharea,
    classes: ['oge-search-find-block']
  });
  dom.findicon = addelem({
    tag: 'label',
    title: 'find (ctrl-f)',
    parent: dom.findblock,
    classes: ['oge-search-find-icon'],
    htmlFor: idbase + 'find',
    innerHTML: iconOf('search')
  });
  dom.findinput = addelem({
    tag: 'input',
    type: 'search',
    parent: dom.findblock,
    placeholder: 'find',
    myview: view,
    id: idbase + 'find',
    mirror: function() {
      openSearchPanel(this.myview);
      const view = this.myview;
      view.searchPanelFindInput =
        view.split.querySelector('input[placeholder=Find]');
      view.searchPanelCaseCB =
        view.split.querySelector('input[name=case]');
      if (!view.searchPanelFindInput) return;
      view.searchPanelFindInput.value = this.value;
      // smart case sensitivity
      view.searchPanelCaseCB.checked = (/[A-Z]/.test(this.value));
      view.searchPanelFindInput.onkeyup();
    },
    oninput: function() {
      this.mirror();
      this.focus();
    },
    onkeydown: function(e) {
      if (e.key == 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        if (!findvals.includes(this.value) &&
          this.value != '') {
          findvals.push(this.value);
        }
        const where = findvals.indexOf(this.value);
        if (where > 0) {
          this.value = (findvals[where - 1]);
          this.mirror();
        }
        if (where == -1 && findvals.length > 0) {
          this.value = (findvals[findvals.length - 1])
        }
        return;
      }
      if (e.key == 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        const where = findvals.indexOf(this.value);
        if (where == -1) return;
        if (where == findvals.length - 1) {
          this.value = '';
          this.mirror();
          return;
        }
        this.value = findvals[where + 1];
        this.mirror();
        return;
      }
      if (e.key == 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (this.value == '') return;
        betterFindNext(this.myview);
      }
      if (e.key == 'g' && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        findNext(this.myview);
        return;
      }
    },
    onchange: function() {
      this.mirror();
    }
  });
  view.findinput = dom.findinput;
  dom.findprevicon = addelem({
    tag: 'span',
    parent: dom.findblock,
    title: 'find previous',
    classes: ['oge-search-find-icon', 'oge-search-find-button'],
    myview: view,
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      betterFindPrevious(this.myview);
    },
    innerHTML: iconOf('chevron_left')
  });
  dom.findnexticon = addelem({
    tag: 'span',
    parent: dom.findblock,
    title: 'find next',
    myview: view,
    classes: ['oge-search-find-icon', 'oge-search-find-button'],
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      betterFindNext(this.myview);
    },
    innerHTML: iconOf('chevron_right')
  });
  dom.findallicon = addelem({
    tag: 'span',
    parent: dom.findblock,
    title: 'select all matches',
    myview: view,
    classes: ['oge-search-find-icon', 'oge-search-find-button'],
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      betterFindSelectAll(this.myview);
    },
    innerHTML: iconOf('done_all')
  });
  dom.replblock = addelem({
    tag: 'div',
    parent: dom.searcharea,
    classes: ['oge-search-find-block']
  });
  dom.replicon = addelem({
    tag: 'label',
    parent: dom.replblock,
    classes: ['oge-search-find-icon'],
    htmlFor: idbase + 'replace',
    title: 'replace (ctrl-r)',
    innerHTML: iconOf('find_replace')
  });
  dom.replinput = addelem({
    tag: 'input',
    type: 'search',
    parent: dom.replblock,
    placeholder: 'replace',
    myview: view,
    id: idbase + 'replace',
    mirror: function() {
      openSearchPanel(this.myview);
      const view = this.myview;
      view.searchPanelReplaceInput =
        view.split.querySelector('input[placeholder=Replace]');
      if (!view.searchPanelReplaceInput) return;
      view.searchPanelReplaceInput.value = this.value
        .replace(/\\([0-9]*)/g,"\$$1");
      view.searchPanelReplaceInput.onkeyup();
    },
    oninput: function() {
      this.mirror();
      this.focus();
    },
    onkeydown: function(e) {
      if (e.key == 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        if (!replacevals.includes(this.value) &&
          this.value != '') {
          replacevals.push(this.value);
        }
        const where = replacevals.indexOf(this.value);
        if (where > 0) {
          this.value = (replacevals[where - 1]);
          this.mirror();
        }
        if (where == -1 && replacevals.length > 0) {
          this.value = replacevals[replacevals.length - 1];
          this.mirror();
        }
        return;
      }
      if (e.key == 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        const where = replacevals.indexOf(this.value);
        if (where == -1) return;
        if (where == replacevals.length - 1) {
          this.value = '';
          this.mirror();
          return;
        }
        this.value = replacevals[where + 1];
        this.mirror();
        return;
      }
      if (e.key == 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (this.value == '') return;
        betterReplaceAll(this.myview);
        return;
      }
      // TODO: need this?
      if (e.key == 'g' && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        findNext(this.myview);
        return;
      }
    },
    onchange: function() {
      this.mirror();
    }
  });
  view.replinput = dom.replinput;
  dom.replnextbtn = addelem({
    tag: 'span',
    parent: dom.replblock,
    classes: ['oge-search-find-icon', 'oge-search-find-button'],
    innerHTML: iconOf('chevron_right'),
    title: 'replace next',
    myview: view,
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      betterReplaceNext(this.myview);
    },
  });
  dom.replallbtn = addelem({
    tag: 'span',
    parent: dom.replblock,
    myview: view,
    title: 'replace all',
    classes: ['oge-search-find-button', 'oge-search-find-icon'],
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      betterReplaceAll(this.myview);
    },
    innerHTML: iconOf('done_all')
  });

  // RIGHT ///

  dom.posindicator = addelem({
    tag: 'div',
    parent: dom,
    classes: ['oge-pos-indicator']
  });

  dom.righttoggles = addelem({
    tag: 'div',
    parent: dom.posindicator,
    classes: ['oge-panel-toggles', 'oge-panel-toggles-right']
  });

  dom.splitToggle = addelem({
    parent: dom.righttoggles,
    classes: ['oge-bottom-panel-toggle', 'oge-split-toggle'],
    tag: 'span',
    title: 'toggle split view (alt-h)',
    innerHTML: iconOf('splitscreen_landscape'),
    myview: view,
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleSplitView(this.myview);
    }
  });

  dom.specCharToggle = addelem({
    parent: dom.righttoggles,
    classes: ['oge-bottom-panel-toggle'],
    tag: 'span',
    title: 'insert special characters (alt-u)',
    innerHTML: iconOf('glyphs'),
    myview: view,
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleSpecChars(this.myview);
    }
  });
  view.specCharButton = dom.specCharToggle;

  dom.diagtoggle = addelem({
    parent: dom.righttoggles,
    classes: ['oge-bottom-panel-toggle'],
    tag: 'span',
    title: 'toggle dialog panel (alt-d)',
    innerHTML: iconOf('chat_info'),
    myview: view,
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleInfoPanel(this.myview);
      this.myview.focus();
    }
  });
  view.diagButton = dom.diagtoggle;

  dom.wraptoggle = addelem({
    parent: dom.righttoggles,
    classes: ['oge-bottom-panel-toggle', 'active'],
    tag: 'span',
    title: 'toggle line wrapping (alt-w)',
    innerHTML: iconOf('wrap_text'),
    myview: view,
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.myview.wraptoggle();
      this.myview.focus();
    }
  });
  view.wrapButton = dom.wraptoggle;

  dom.jumpbutton = addelem({
    parent: dom.righttoggles,
    classes: ['oge-bottom-panel-toggle', 'active', 'oge-jumpbutton'],
    tag: 'span',
    title: 'jump to matching spot',
    innerHTML: iconOf('jump_to_element'),
    myview: view,
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this?.myview?.forwardjump?.();
    }
  });

  // line and column indicator
  dom.linelabel = addelem({
    tag: 'label',
    htmlFor: idbase + 'line',
    innerHTML: 'Line',
    parent: dom.posindicator
  });
  dom.lineinp = addelem({
    tag: 'input',
    type: 'number',
    id: idbase + 'line',
    oninput: clearnonnums,
    parent: dom.posindicator,
    title: 'go to line # (alt-g)',
    myview: view,
    onchange: function() {
      const togoto = parseInt(this.value);
      if (isNaN(togoto)) return;
      let togotocol = parseInt(this?.myview?.colnuminp?.value);
      if (!togotocol || isNaN(togotocol)) {
        togotocol = 0;
      }
      gotoLineNumCol(this.myview, togoto, togotocol);
    }
  });
  view.linenuminp = dom.lineinp;
  dom.linemax = addelem({
    tag: 'span',
    parent: dom.posindicator
  });
  dom.collabel = addelem({
    tag: 'label',
    innerHTML: 'Col',
    htmlFor: idbase + 'col',
    parent: dom.posindicator
  });
  dom.colinp = addelem({
    tag: 'input',
    type: 'number',
    id: idbase + 'col',
    oninput: clearnonnums,
    parent: dom.posindicator,
    myview: view,
    title: 'go to col #',
    classes: ['colinput'],
    onchange: function() {
      let togoto = parseInt(this?.myview?.linenuminp?.value);
      if (!togoto || isNaN(togoto)) {
        togoto = 1;
      }
      const togotocol = parseInt(this.value);
      if (isNaN(togotocol)) return;
      gotoLineNumCol(this.myview, togoto, togotocol);
    }
  });
  view.colnuminp = dom.colinp;
  dom.colmax = addelem({
    tag: 'span',
    parent: dom.posindicator
  });
  dom.updateIndicator = function(cp) {
    this.lineinp.value = cp.linenum.toString();
    this.linemax.innerHTML = ' / ' + cp.numlines.toString() + ' : ';
    this.colinp.value = cp.colnum.toString();
    this.colmax.innerHTML = ' / ' + cp.linewidth.toString();
  }
  dom.updateIndicator(cursorPosition(view.state));
  view.bottompanel = dom;
  return {
    dom,
    update(update) {
      dom.updateIndicator(cursorPosition(update.state));
    }
  }
}

function addBottomPanel() {
  return showPanel.of(bottomPanel);
}

function infoPanel(view) {
  const dom = document.createElement("div");
  dom.classList.add("oge-info-panel", "closed");
  const panelclasses = [
    'info',
    'error',
    'utility',
    'closed',
    'closing'
  ];
  view.dialogPanel = dom;
  dom.myview = view;

  dom.closeDiv = addelem({
    tag: 'div',
    parent: dom,
    classes: ['oge-info-close-button'],
    innerHTML: iconOf('close'),
    mypanel: dom,
    title: 'close panel',
    onclick: function() {
      this.mypanel.closeme();
    }
  });

  dom.infoDiv = addelem({
    tag: 'div',
    parent: dom,
    classes: ['oge-info-message']
  });

  dom.clearClasses = function() {
    this.classList.remove(...panelclasses);
  }

  dom.closeme = function() {
    this.classList.remove('closing');
    setTimeout(() => {
      this.classList.add('closing');
    }, 0)
    setTimeout(() => {
      this.classList.remove('closing');
      this.classList.add('closed');
    }, 500);
    if (this?.myview?.diagButton) {
      this.myview.diagButton.classList.remove('active');
    }
    if (this?.myview?.specCharButton) {
      this.myview.specCharButton.classList.remove('active');
    }
  }

  dom.infomsg = function(msg, timeout = 0) {
    this.clearClasses();
    this.lastShown = 'info';
    this.infoDiv.innerHTML = '<span class="infoicon">' +
      iconOf('info') + '</span> ' + msg;
    setTimeout(() => {
      this.classList.add('info');
    }, 0);
    this.onclick = () => (this.closeme());
    if (timeout != 0) {
      setTimeout(() => {
        this.closeme()
      }, timeout);
    }
    if (this?.myview?.diagButton) {
      this.myview.diagButton.classList.add('active');
    }
    if (this?.myview?.specCharButton) {
      this.myview.specCharButton.classList.remove('active');
    }
  }

  dom.errormsg = function(msg, timeout = 0, noshow = false) {
    this.clearClasses();
    this.lastShown = 'error';
    this.infoDiv.innerHTML = '<span class="infoicon">' +
      iconOf('error') + '</span> ' + msg;
      this.onclick = () => (this.closeme());
    if (noshow) {
      this.classList.add('error','closed');
    } else {
      setTimeout(() => {
        this.classList.add('error');
      }, 0);
      this.onclick = () => (this.closeme());
      if (timeout != 0) {
        setTimeout(() => {
          this.closeme()
        }, timeout);
      }
    }
    if (this?.myview?.diagButton) {
      this.myview.diagButton.classList.add('active');
    }
    if (this?.myview?.specCharButton) {
      this.myview.specCharButton.classList.remove('active');
    }
  }

  dom.showutility = function(timeout = 0) {
    this.clearClasses();
    this.onclick = ()=>(true);
    this.lastShown = 'utility';
    setTimeout(() => {
      this.classList.add('utility');
    }, 0);
    if (timeout != 0) {
      setTimeout(() => {
        this.closeme()
      }, timeout);
    }
    if (this?.myview?.diagButton) {
      this.myview.diagButton.classList.add('active');
    }
    return this.infoDiv;
  }

  dom.reopen = function() {
    if (!this.lastShown) return;
    this.clearClasses();
    setTimeout(() => {
      this.classList.add(this.lastShown);
    });
    if (this?.myview?.diagButton) {
      this.myview.diagButton.classList.add('active');
    }
    const specChar = (dom?.getElementsByClassName?.("oge-symbol-chart")
      ?.length > 0);
    if (this?.myview?.specCharButton) {
      if (specChar) {
        this.myview.specCharButton.classList.add('active');
      } else {
        this.myview.specCharButton.classList.remove('active');
      }
    }
  }

  dom.toggle = function() {
    if (this.classList.contains('closed')) {
      this.reopen();
      return;
    }
    this.closeme();
  }

  return {
    dom,
    top: true
  }
}

function addInfoPanel() {
  return showPanel.of(infoPanel);
}

// COMMANDS //////////////////////////
// for expanded keymap

const betterFindNext = function(view) {
  view.findinput.mirror();
  findNext(view);
  view.focus();
  const searchval = view?.findinput?.value;
  if (!searchval) return;
  if (findvals[findvals.length - 1] != searchval) {
    findvals.push(searchval);
  }
}

const betterFindPrevious = function(view) {
  view.findinput.mirror();
  findPrevious(view);
  view.focus();
  const searchval = view?.findinput?.value;
  if (!searchval) return;
  if (findvals[findvals.length - 1] != searchval) {
    findvals.push(searchval);
  }
}

const betterFindSelectAll = function(view) {
  view.findinput.mirror();
  selectMatches(view);
  view.focus();
  const searchval = view?.findinput?.value;
  if (!searchval) return;
  if (findvals[findvals.length - 1] != searchval) {
    findvals.push(searchval);
  }
}

const betterReplaceAll = function(view) {
  view.findinput.mirror();
  view.replinput.mirror();

  // only replace in selection if something slected
  const smthgsel = view.state.selection.ranges.some((r) => (!r.empty));
  if (smthgsel) {
    const findval = view.findinput.value;
    if (!findval) return;
    const replval = view.replinput.value.replace(/\\([0-9]*)/g,"\$$1");
    const casesensitive= (/[A-Z]/.test(findval));
    const regexopts = 'g' + ((casesensitive) ? '' : 'i');
    const re = new RegExp(findval, regexopts);
    view.dispatch(view.state.changeByRange((range) => {
      const newContent = view.state.doc.slice(range.from, range.to)
        .toString().replace(re, replval);
      return { changes: [{
        from: range.from, to: range.to, insert: newContent
      }],
        range: EditorSelection.range(
          range.from, range.from + newContent.length
        )
      }
    }));
    view.focus();
    return;
  }

  replaceAll(view);
  view.focus();
  const repval = view?.replinput?.value;
  if (repval && replacevals[replacevals.length -1] != repval) {
    replacevals.push(repval);
  }
  const searchval = view?.findinput?.value;
  if (!searchval) return;
  if (findvals[findvals.length - 1] != searchval) {
    findvals.push(searchval);
  }
}

const betterReplaceNext = function(view) {
  view.findinput.mirror();
  view.replinput.mirror();
  replaceNext(view);
  view.focus();
  const repval = view?.replinput?.value;
  if (repval && replacevals[replacevals.length -1] != repval) {
    replacevals.push(repval);
  }
  const searchval = view?.findinput?.value;
  if (!searchval) return;
  if (findvals[findvals.length - 1] != searchval) {
    findvals.push(searchval);
  }
}

const closeMyTab = function(view) {
  if (view?.myTab?.closeme) view.myTab.closeme();
  return true;
}

const cursorInMiddle = function(view) {
  const cpos = view.state?.selection?.main?.anchor ?? 0;
  view.dispatch({
    effects: EditorView.scrollIntoView(cpos, {
      y: 'center'
    })
  });
}

const focusFind = function(view) {
  if (view?.mypanel?.updateInputs) view.mypanel.updateInputs(true);
  if (view.replinput) {
    view.replinput.value = '';
    view.replinput.mirror();
  }
  if (view.findinput) {
    view.findinput.value = '';
    view.replinput.mirror();
    view.findinput.focus();
  }
}

const forwardJump = function(view) {
  if (view?.forwardjump) view.forwardjump({});
  return true;
}

const gitCmd = function(view) {
  if (view?.mypanel?.gittoggle) view.mypanel.gittoggle.onclick();
  return true;
}

const gotoLineDiag = function(view) {
  if (view?.bottompanel?.lineinp) {
    view.bottompanel.lineinp.value = ''
    view.bottompanel.lineinp.focus();
    setTimeout(() => (view.bottompanel.lineinp.value = ''), 10);
  }
  return true;
}

const gotoLineNumCol = function(view, linenum, colnum) {
  if (linenum < 1) { linenum = 1; }
  if (linenum > view.state.doc.lines) {
      linenum = view.state.doc.lines;
  }
  let targetline = view.state.doc.line(linenum);
  let pos = targetline.from;
  if (colnum > targetline.length) colnum = targetline.length;
  pos += colnum;
  view.dispatch(view.state.update({
    selection: { anchor: pos, head: pos },
    scrollIntoView: true
  }));
  view.focus();
}

const insertBlankLineUp = function(view) {
  const cpos = view.state?.selection?.main?.anchor ?? 0;
  const stline = view.state?.doc?.lineAt(cpos);
  if (stline.number == 1) {
    cursorLineStart(view);
    insertNewlineKeepIndent(view);
    cursorLineUp(view);
    return;
  }
  cursorLineUp(view);
  cursorLineEnd(view);
  insertNewlineAndIndent(view);
}

const joinLines = function(view) {
  const smthgsel = view.state.selection.ranges.some((r) => (!r.empty));
  let fr = 0;
  let to = 0;
  if (smthgsel) {
    // if something selected, that determines range
    fr = view.state.selection.main.from;
    to = view.state.selection.main.to;
  } else {
    // otherwise, take current line
    const cpos = view?.state?.selection?.main?.anchor ?? 0;
    const stline = view.state.doc.lineAt(cpos);
    const stlinenum = stline.number;
    const nextline = view.state.doc.line(stlinenum+1);
    if (!nextline) { return; }
    fr = stline.from;
    to = nextline.to;
  }
  const stuff = view.state.sliceDoc(fr, to);
  const newstuff = stuff.replace(/\s*\n\s*/g,' ');
  view.dispatch(view.state.update({
    changes: {
      from: fr,
      to: to,
      insert: newstuff
    }
  }));
  return true;
}

// jumps to the marked line number
const jumpToMark = function(view) {
  if (!("ogeJumplinePos" in view)) return;
  const line = view.state.doc.lineAt(view.ogeJumplinePos);
  gotoLineNumCol(view, line.number, 0);
  cursorInMiddle(view);
  return true;
}

// marks the current line number as the jump-to position
const markJump = function(view) {
  let cpos = view?.state?.selection?.main?.anchor ?? 0;
  view.ogeJumplinePos = cpos;
  view.dispatch(view.state.update({
    effects: toggleJumpMarkEffect.of()
  }));
  return true;
}

const openFile = function(view) {
  if (window.openOpenFiles) {
    window.openOpenFiles();
  }
  return true;
}

const openSettingsPanel = function(view) {
  const leftpopin = document.getElementById("leftpopin");
  if (window.openSettings) {
    window.openSettings();
  }
  return true;
}

const pipeCmd = function(view) {
  if (view?.mypanel?.filtertoggle) view.mypanel.filtertoggle.onclick();
  return true;
}

// runs the processing command
const processDocument = function (view) {
  if (window.runProcess) window.runProcess();
  return true;
}

const saveCmd = function(view) {
  if (window.saveFiles) window.saveFiles({
    all: true,
    gitcommit: false,
    process: false,
    download: false
  });
  return true;
}

const smartDeleteLine = function(view) {
  // determine whether something is selected
  let smthgsel = view.state.selection.ranges.some((r) => (!r.empty));
  // if not, delete the line
  if (!smthgsel) {
    if (window.navigator?.clipboard) {
      const fr = view.state.selection.main.head;
      const txt = view.state.doc.lineAt(fr).text.toString();
      window.navigator.clipboard.writeText(txt + "\n");
    }
    deleteLine(view);
    return true;
  }
  // by returning false we pass on to next binding
  return false;
}

const toggleAutoprocessing = function(view) {
  if (window.toggleAutoProcessing) window.toggleAutoProcessing();
  return true;
}

const toggleInfoPanel = function(view) {
  if (view?.dialogPanel) view.dialogPanel.toggle();
  return true;
}

const togglePreview = function(view) {
  if (window.togglePreview) window.togglePreview();
  return true;
}

const insertHere = function(view, ins, displace) {
  const mainrange = view.state.selection.main;
  view.dispatch(view.state.update({
    changes: {
      from: mainrange.from,
      to: mainrange.to,
      insert: ins
    },
    selection: EditorSelection.range(
      mainrange.from + displace,
      mainrange.from + displace
    )
  }));
}

const insertSymbol = function(e) {
  e.preventDefault();
  e.stopPropagation();
  const view = this.myview;
  const symb = this.mysymb;
  view.dispatch(view.state.changeByRange((range) => {
    const newContent = symb;
    return {
      changes: [{
        from: range.from, to: range.to, insert: newContent
      }],
      range: EditorSelection.range(
        range.from + 1, range.from + 1
      )
    }
  }));
  if (view.dialogPanel) view.dialogPanel.closeme();
  view.focus();
}

const insertTemplate1 = function(view) {
  if (view.insertTemplate) {
    view.insertTemplate(1);
  }
  return true;
}

const insertTemplate2 = function(view) {
  if (view.insertTemplate) {
    view.insertTemplate(2);
  }
  return true;
}

const insertTemplate3 = function(view) {
  if (view.insertTemplate) {
    view.insertTemplate(3);
  }
  return true;
}

const insertTemplate4 = function(view) {
  if (view.insertTemplate) {
    view.insertTemplate(4);
  }
  return true;
}

const moveTabClockwise = function(view) {
  if (!view?.myTab?.moveTab) return;
  view.myTab.moveTab(true);
  return true;
}

const moveTabCounterclockwise = function(view) {
  if (!view?.myTab?.moveTab) return;
  view.myTab.moveTab(false);
  return true;
}

const rotateTabsClockwise = function(view) {
  if (!view?.myTab?.rotateTabs) return;
  view.myTab.rotateTabs(true);
  return true;
}

const rotateTabsCounterclockwise = function(view) {
  if (!view?.myTab?.rotateTabs) return;
  view.myTab.rotateTabs(false);
  return true;
}

const switchToNextTab = function(view) {
  if (!view?.myTab?.switchTab) return;
  view.myTab.switchTab(true);
  return true;
}

const switchToPrevTab = function(view) {
  if (!view?.myTab?.switchTab) return;
  view.myTab.switchTab(false);
  return true;
}

const texSmartDblQuote = function(view) {
  if (view?.smartQuote) {
    view.smartQuote(true, 'tex');
  }
  return true;
}

const texSmartSnglQuote = function(view) {
  if (view?.smartQuote) {
    view.smartQuote(false, 'tex');
  }
  return true;
}

const toggleOutputExt = function(view) {
  if (window.outputChooseButton) {
    window.outputChooseButton.nextext();
  }
  return true;
}

const toggleSpeakAloud = function(view) {
  if (window?.speakButton) {
    window.speakButton.onclick(null);
  }
  return true;
}

const toggleSpecChars = function(view) {
  if (!view?.dialogPanel) return;
  if (!view.dialogPanel.classList.contains('closed') &&
    (view?.dialogPanel?.getElementsByClassName?.("oge-symbol-chart")
    ?.length > 0) ) {
    view.dialogPanel.closeme();
    return;
  }
  const infodiv = view.dialogPanel.showutility();
  infodiv.innerHTML = '';
  const symbolChart = addelem({
    classes: ['oge-symbol-chart'],
    tag: 'div',
    parent: infodiv
  });
  for (const symb in symbols) {
    const desc = symbols[symb];
    const symdiv = addelem({
      parent: symbolChart,
      tag: 'div',
      innerHTML: symb,
      mysymb: symb,
      myview: view,
      title: desc,
      onclick: insertSymbol
    });
    if (desc.includes('space')) {
      symdiv.classList.add('spacesymbol');
      symdiv.innerHTML = '⎵';
    }
  }
  if (view.specCharButton) view.specCharButton.classList.add("active");
}

const toggleSplitView = function(view) {
  if (view?.myTab?.togglesplit) view.myTab.togglesplit();
  return true;
}

const toggleTabVisibility = function(view) {
  if (view?.myTab?.toggleVisibility) view.myTab.toggleVisibility();
  return true;
}

const toggleTabZoom = function(view) {
  if (view?.myTab?.toggleZoom) view.myTab.toggleZoom();
  return true;
}

const toggleWrap = function(view) {
  if (view.wraptoggle) view.wraptoggle();
  return true;
}

// KEYMAPS //////////////////////////////////////////

const additionalKeymap = [
  {key: "Shift-Tab", run: indentSelection, preventDefault: true, stopPropagation: true},
  // Ctrl-a = select all
  {key: "Ctrl-b", run: closeSearchPanel, preventDefault: true, stopPropagation: true, global: true},
  // Ctrl-c = copy
  {key: "Ctrl-d", run: copyLineDown, preventDefault: true, stopPropagation: true},
  {key: "Ctrl-f", run: focusFind, preventDefault: true, stopPropagation: true, global: true},
   // Ctrl-g = find next
  {key: "Ctrl-h", run: toggleSplitView, preventDefault: true, stopPropagation: true, global: true},
  // Ctrl-i = select paragraph or block
  {key: "Ctrl-j", run: joinLines, preventDefault: true, stopPropagation: true},
  {key: "Ctrl-k", run: deleteToLineEnd, preventDefault: true, stopPropagation: true},
  // I use ctrl-l to go to browser location bar
  {key: "Ctrl-m", run: gitCmd, preventDefault: true, stopPropagation: true, global: true},
  {key: "Ctrl-o", run: openFile, preventDefault: true, stopPropagation: true, global: true},
  {key: "Ctrl-p", run: openSettingsPanel, preventDefault: true, stopPropagation: true, global: true},
  // Ctrl q resists being mapped (quit browser)
  {key: "Ctrl-r", run: focusFind, preventDefault: true, stopPropagation: true, global: true},
  {key: "Ctrl-s", run: saveCmd, preventDefault: true, stopPropagation: true, global: true},
  // Ctrl t resists being mapped
  {key: "Ctrl-u", run: deleteToLineStart, preventDefault: true, stopPropagation: true},
  // Ctrl-v is paste
  {key: "Ctrl-w", run: toggleWrap, preventDefault: true, stopPropagation: true, global: true},
  {key: "Ctrl-x", run: smartDeleteLine},
  // Ctrl y is redo
  // Ctrl z is undo
  {key: "Ctrl-,", run: indentLess, preventDefault: true, stopPropagation: true},
  {key: "Ctrl-.", run: indentMore, preventDefault: true, stopPropagation: true},
  {key: "Ctrl-<", run: indentLess, preventDefault: true},
  {key: "Ctrl->", run: indentMore, preventDefault: true},
  {key: "Ctrl-\\", run: pipeCmd, preventDefault: true, stopPropagation: true, global: true},
  {key: "Ctrl-|", run: pipeCmd, preventDefault: true, stopPropagation: true, global: true},
  {key: "Ctrl-ArrowUp", run: insertBlankLineUp, preventDefault: true, stopPropagation: true},
  {key: "Ctrl-ArrowDown", run: insertBlankLine, preventDefault: true, stopPropagation: true},
  {key: "Ctrl-F5", run: processDocument, preventDefault: true, stopPropagation: true, global: true},
  {key: "Ctrl-F6", run: togglePreview, preventDefault: true, stopPropagation: true, global: true},
  {key: "Ctrl-F7", run: toggleAutoprocessing, preventDefault: true, stopPropagation: true, global: true},
  {key: "Ctrl-F8", run: forwardJump, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-F5", run: processDocument, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-F6", run: togglePreview, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-F7", run: toggleAutoprocessing, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-F8", run: forwardJump, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-1", run: insertTemplate1, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-2", run: insertTemplate2, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-3", run: insertTemplate3, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-4", run: insertTemplate4, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-5", run: cursorMatchingBracket, preventDefault: true, stopPropagation: true},
  {key: "Alt-a", run: toggleAutoprocessing, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-b", run: closeSearchPanel, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-c", run: toggleSpecChars, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-d", run: toggleInfoPanel, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-f", run: toggleFold, preventDefault: true, stopPropagation: true},
  {key: "Alt-g", run: gotoLineDiag, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-h", run: toggleSplitView, preventDefault: true, stopPropagation: true, global: true},
  // Alt-i = select current block
  {key: "Alt-j", run: jumpToMark, preventDefault: true, stopPropagation: true, global: true},
  // Alt-l = select current line
  {key: "Alt-m", run: markJump, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-n", run: gotoLineDiag, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-o", run: toggleOutputExt, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-p", run: togglePreview, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-q", run: closeMyTab, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-r", run: rotateTabsClockwise, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-s", run: processDocument, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-Shift-r", run: rotateTabsCounterclockwise, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-t", run: toggleFold, preventDefault: true, stopPropagation: true},
  {key: "Alt-u", run: toggleSpecChars, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-v", run: toggleTabVisibility, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-w", run: toggleWrap, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-x", run: cursorInMiddle, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-z", run: toggleTabZoom, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt--", run: toggleSplitView, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-/", run: toggleComment, preventDefault: true, stopPropagation: true},
  {key: "Alt-\\", run: pipeCmd, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-|", run: pipeCmd, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-.", run: indentMore, preventDefault: true, stopPropagation: true},
  {key: "Alt-,", run: indentLess, preventDefault: true, stopPropagation: true},
  {key: "Alt-<", run: indentLess, preventDefault: true, stopPropagation: true},
  {key: "Alt->", run: indentMore, preventDefault: true, stopPropagation: true},
  {key: "Alt-[", run: indentLess, preventDefault: true, stopPropagation: true},
  {key: "Alt-]", run: indentMore, preventDefault: true, stopPropagation: true},
  {key: "Alt-Tab", run: switchToNextTab, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-Shift-Tab", run: switchToPrevTab, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-Ctrl-a", run: toggleSpeakAloud, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-Ctrl-t", run: toggleTabVisibility, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-Ctrl-j", run: forwardJump, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-Ctrl-ArrowRight", run: moveTabClockwise, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-Ctrl-ArrowLeft", run: moveTabCounterclockwise, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-Ctrl-ArrowDown", run: moveTabClockwise, preventDefault: true, stopPropagation: true, global: true},
  {key: "Alt-Ctrl-ArrowUp", run: moveTabCounterclockwise, preventDefault: true, stopPropagation: true, global: true}
  // Ctrl-Tab, Alt-Ctrl-Tab resist being mapped
]


const texSmartQuoteKeymap = [
  {key: '"', run: texSmartDblQuote, preventDefault: true, stopPropagation: true},
  {key: "'", run: texSmartSnglQuote, preventDefault: true, stopPropagation: true}
]

//////////// COMPLETIONS //////////////////////////

// Bibliography completion
function ogeCompletions(context) {
  let word = context.matchBefore(/@[0-9A-Za-z_-]*/);
  if (word) {
    return {
      from: word.from,
      options: window?.bibcompletions ?? []
    };
  }
  if (!context.explicit) { return null; }
}

//// MARK GUTTER //////////////

const jumpLineMarker = new class extends GutterMarker {
  toDOM() {
    const e = document.createElement('div');
    e.classList.add('oge-jump-indicator');
    e.innerHTML='&nbsp;';
    return e;
  }
}

const toggleJumpMarkEffect = StateEffect.define();

const markGutter = gutter({
  class: 'oge-marker-gutter',
  lineMarker(view, line) {
    if (!("ogeJumplinePos" in view)) return null;
    if (line.from <= view.ogeJumplinePos &&
        line.to >= view.ogeJumplinePos) {
        return jumpLineMarker;
    }
    return null;
  },
  lineMarkerChange(update) {
    for (const tr of update.transactions) {
      for (const eff of tr.effects) {
        if (eff.is(toggleJumpMarkEffect)) return true;
      }
    }
    return false;
  }
});

/////////////// EXTENSION SELECTION /////////////////

// basic setup differs for spit view in leaving out
// history, and history key map

function getBasicSetup(isother) {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars({
      addSpecialChars: /[   ]/g
    }),
    ((isother) ? [] : history()),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(classHighlighter),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    highlightTrailingWhitespace(),
    search({regexp: true, top: true}),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...((isother) ? [] : historyKeymap),
      ...foldKeymap,
      ...completionKeymap,
      ...lintKeymap
    ])
  ];
}

function langExtensionsFor(ftype) {
  if (ftype == 'markdown') {
    const mdown = markdown({base: markdownLanguage});
    return [
      yamlFrontmatter({content: mdown}),
      mdown,
      EditorState.languageData.of(( ) =>
        [{autocomplete: ogeCompletions}]
      )
    ];
  }
  if (ftype == 'html') return [html()];
  if (ftype == 'css') return [css()];
  if (ftype == 'json') return [json()]; //linter?
  if (ftype == 'javascript') return [javascript()]; // linter?
  if (ftype == 'yaml') return [yaml()];
  if (ftype == 'shell') return [StreamLanguage.define(shell)];
  if (ftype == 'tex') return [
    StreamLanguage.define(stex),
    keymap.of(texSmartQuoteKeymap)
  ];
  if (ftype == 'php') return [php()];
  if (ftype == 'xml') return [xml()];
  if (ftype == 'lua') return [StreamLanguage.define(lua)];
  return [];
}

const ogeExtensions = [
  // ogePanel,
  keymap.of(additionalKeymap),
  EditorView.updateListener.of((update) => {
    if (update.focusChanged || update.docChanged) {
      if (window.updateTabClasses) window.updateTabClasses();
    }
    if (!update?.docChanged) return;
    if (update?.view?.myTab && update.view.myTab.ondocchange) {
      update.view.myTab.ondocchange(update);
    }
  }),
  indentUnit.of('  '),
  keymap.of([indentWithTab]),
  scrollPastEnd(),
  indentationMarkers(),
  markGutter,
  addInfoPanel(),
  addBottomPanel()
];

/////////// SPLIT VIEW ///////////////////////////

// Split view syncing code adapted from
// https://codemirror.net/examples/split/

let syncAnnotation = Annotation.define();

function syncDispatch(tr, view, other) {
  view.update([tr]);
  if (!tr.changes.empty && !tr.annotation(syncAnnotation)) {
    let annotations = [syncAnnotation.of(true)];
    let userEvent = tr.annotation(Transaction.userEvent);
    if (userEvent) annotations.push(Transaction.userEvent.of(userEvent));
    other.dispatch({changes: tr.changes, annotations});
  }
}

////////////////// MISC //////////////////////////////////

// function called by readAloud
const ogeLinedown = function() {
  const {linenum, colnum, numlines} = cursorPosition(this.state);
  if (linenum == numlines) return false;
   gotoLineNumCol(this, linenum + 1, colnum)
  cursorInMiddle(this);
  return true;
}

const wrapoff = function() {
  const newExtensions = this.initialExtensions.filter((ext) =>
    (ext != EditorView.lineWrapping)
  );
  this.dispatch({
    effects: StateEffect.reconfigure.of(newExtensions)
  });
  if (this?.wrapButton) this.wrapButton.classList.remove("active");
}

const wrapon = function() {
  this.dispatch({
    effects: StateEffect.reconfigure.of(this.initialExtensions)
  });
  if (this?.wrapButton) this.wrapButton.classList.add("active");
}

const wraptoggle = function() {
  const iswrapping = this?.wrapButton?.classList?.contains("active");
  return ((iswrapping) ? this.wrapoff() : this.wrapon());
}

////////////// MAIN EXPORT //////////////////////////

export default async function ogeEditor(opts) {

  const parnode= opts?.parent;
  if (!parnode) return false;

  parnode.classList.add('ogetab');

  const content = opts?.content ?? '';
  const ftype = opts?.filetype ?? 'markdown';

  parnode.splitwrapper = addelem({
      parent: parnode,
      tag: 'div',
      classes: ['ogesplitwrapper']
  });

  parnode.split1 = addelem({
      parent: parnode.splitwrapper,
      tag: 'div',
      classes: ['ogeeditorsplit', 'split1']
  });

  parnode.split2 = addelem({
      parent: parnode.splitwrapper,
      tag: 'div',
      classes: ['ogeeditorsplit', 'split2']
  });

  const startStateExtensions = [
    ogeExtensions,
    getBasicSetup(false),
    EditorView.lineWrapping,
    langExtensionsFor(ftype)
  ];

  let startState = EditorState.create({
    doc: content,
    extensions: startStateExtensions
  });

  const otherStateExtensions = [
    ogeExtensions,
    getBasicSetup(true),
    keymap.of([
      {key: "Ctrl-z", run: () => undo(mainView)},
      {key: "Ctrl-y", run: () => redo(mainView)}
    ]),
    EditorView.lineWrapping,
    langExtensionsFor(ftype)
  ];

  let otherState = EditorState.create({
    doc: startState.doc,
    extensions: otherStateExtensions
  });
  window.otherState = otherState;

  let mainView = new EditorView({
    state: startState,
    parent: parnode.split1,
    dispatch: (tr) => (syncDispatch(tr, mainView, otherView))
  });
  mainView.initialExtensions = startStateExtensions;

  let otherView = new EditorView({
    state: otherState,
    parent: parnode.split2,
    dispatch: (tr) => (syncDispatch(tr, otherView, mainView))
  });
  otherView.initialExtensions = otherStateExtensions;

  parnode.view1 = mainView;
  parnode.view2 = otherView;
  mainView.myTab = parnode;
  otherView.myTab = parnode;
  mainView.split = parnode.split1;
  otherView.split = parnode.split2;

  for (const view of [mainView, otherView]) {
    view.wrapoff = wrapoff;
    view.wrapon = wrapon;
    view.wraptoggle = wraptoggle;
    view.goright = function() { cursorCharRight(this); }
    view.linedown = ogeLinedown;
    view.applyUnixFilter = applyUnixFilter;
    view.cursorInMiddle = function() { cursorInMiddle(this); }
    view.gotolinecol = function(l, c) {gotoLineNumCol(this, l, c);}
    view.insertHere = function(ins, displace) {
      insertHere(this, ins, displace);
    }
    openSearchPanel(view);
  }

  // focus follows mouse
  mainView.split.onmouseover = () => (
    mainView.split.contains(document.activeElement) ||
    mainView.focus()
  );
  otherView.split.onmouseover = () => (
    otherView.split.contains(document.activeElement) ||
    otherView.focus()
  );

  return true;
}

const globalKeys = additionalKeymap.filter((k) => (k?.global));

// GLOBAL keybinds
window.addEventListener('keydown', function(e) {
  for (const r of globalKeys) {
    if ((e.ctrlKey == r.key.includes('Ctrl-')) &&
      (e.altKey == r.key.includes('Alt-')) &&
      (e.shiftKey == r.key.includes('Shift-')) &&
      (r.key.endsWith(e.key))) {
      if (r.preventDefault) e.preventDefault();
      if (r.stopPropagation) e.stopPropagation();
      const editortab = window?.getLastFocusedTab?.();
      if (!editortab) return;
      let view = editortab?.view1;
      if (editortab?.split2?.contains(document.activeElement)) {
        view = editortab?.view2;
      }
      if (!view) return;
      if (!r.run) return;
      r?.run?.(view);
    }
  }
})
