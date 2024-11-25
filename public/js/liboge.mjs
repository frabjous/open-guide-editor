// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: liboge.mjs
// Defines most of the important functions that provide the capabilities
// of the OGE editor above what codemirror offers

import {loadcolorscheme, loadeditorfont} from './common.mjs';
import ogeEditor from './editor.mjs';
import {addelem, byid, extensionOf, htmlesc, iconOf, basename} from './misc.mjs';
import jsonFetch from './jsonFetch.mjs';
import {mergeSettings} from './settings.mjs';

window.alltabs = byid('alltabs');
const maintabs = byid('maintabs');
const stackedtabs = byid('stackedtabs');
const hiddentabs = byid('hiddentabs');
const tablist = byid('tablist');
const upperpanelbuttons = byid("upperpanelbuttons");
const rightpanelbuttons = byid("rightpanelbuttons");

window.neverpreviewed = true;

function anyUnsaved() {
  const editortabs = document.getElementsByClassName("ogetab");
  return [...editortabs].some((et) => (!et.isSaved()));
}

async function autoSave() {
  const tabs = [...document.getElementsByClassName("ogetab")];
  const reqdata = {
    reqtype: 'autosave',
    files: []
  }
  for (const editortab of tabs) {
    if (editortab.isSaved()) continue;
    reqdata.files.push({
      filename: editortab.filename,
      contents: editortab.view1.state.doc.toString()
    });
  }
  const respdata = await jsonRequest(reqdata);
  if (respdata?.autosaveerror) {
    const editortab = getCurrentTab();
    if (!editortab) return;
    editortab?.view1?.dialogPanel?.errormsg(htmlesc(respdata.autosaveerror));
  }
}

function clearAPTimer() {
  if (window?.autoprocessTimer) {
    clearTimeout(window.autoprocessTimer);
  }
  window.autoprocessTimer = null;
}

export function closeOpenFiles() {
  byid("leftpopin").close();
}

export function closeSettings() {
  byid("rightpopin").close();
}

function closePreview(onown = false) {
  if (!onown && window?.ogePreviewWindow) {
    window.ogePreviewWindow.close();
  }
  window.ogePreviewWindow = null;
  window.previewButton.setstate('inactive');
  alltabs.classList.remove('jumpable');
}
window.closePreview = closePreview;

function closeTab(force = false) {
  const unsaved = !(this.isSaved());
  if (unsaved && !force) return this.saveWarning();
  const filename = this.filename;
  if (this.view1) this.view1.destroy();
  if (this.view2) this.view2.destroy();
  this.parentNode.removeChild(this);
  this.classList.remove("ogetab");
  const maint = maintabs.getElementsByClassName("ogetab");
  const stackedt = stackedtabs.getElementsByClassName("ogetab");
  const hiddent = hiddentabs.getElementsByClassName("ogetab");
  if (maint.length == 0 && stackedt.length > 0) {
    const mover = stackedt[0];
    maintabs.appendChild(mover);
    mover.focus();
    mover.cursorInMiddle();
  }
  if (maint.length == 0 && hiddent.length > 0) {
    const mover = hiddent[0];
    maintabs.appendChild(mover);
    mover.view1.focus();
    mover.view1.cursorInMiddle();
  }
  if (maint.length == 0) {
    openOpenFiles();
  }
  jsonRequest({
    reqtype: 'removefilefromsession',
    filename
  })
  updateTabList();
}

function createEditorTab(file) {
  let {name, content} = file;
  if (!name) return null;
  if (!content) content = '';
  const editortab = addelem({
    parent: hiddentabs,
    tag: 'div'
  });
  if (!ogeEditor({
    parent: editortab,
    content: content,
    filetype: filetypeOf(name)
  })) return null;
  // put in maintab if nothing there
  const tabsinmain = maintabs.getElementsByClassName("ogetab");
  if (tabsinmain.length == 0) {
    maintabs.appendChild(editortab);
  }
  // deal with split
  editortab.setsplit = setsplit;
  editortab.togglesplit = togglesplit;
  editortab.setsplit(false);

  // set file name
  editortab.filename = name;
  editortab.extension = extensionOf(name);

  // start with file contents saved
  editortab.savedContents = editortab.view1.state.doc.toString();

  // attach methods
  editortab.soloShow = soloShow;
  editortab.hideMe = hideMe;
  editortab.ondocchange = ondocchange;
  editortab.isSaved = isSaved;
  editortab.saveWarning = saveWarning;
  editortab.closeme = closeTab;
  editortab.toggleVisibility = toggleVisibility;
  editortab.toggleZoom = toggleZoom;
  editortab.rotateTabs = rotateTabs;
  editortab.moveTab = moveTab;
  editortab.switchTab = switchTab;
  editortab.makeGitCommit = makeGitCommit;
  editortab.reportCheckOnSaveError = reportCheckOnSaveError;

  // new methods, etc. for views
  for (const view of [editortab.view1, editortab.view2]) {
    view.unixFilter = unixFilter;
    view.forwardjump = forwardjump;
    view.getLineDom = getLineDom;
    view.insertTemplate = insertTemplate;
    view.smartQuote = smartQuote;
    // enable spellcheck
    if (window?.ogesettings?.routines?.[editortab.extension]?.spellcheck) {
      view.contentDOM.spellcheck = true;
    }
  }

  // update the tab list
  updateTabList();

  return editortab;
}

function filetypeOf(name) {
  if (name.substring(1).includes('.')) {
    let ext = name.replace(/.*\./,'');
    ext = ext.toLowerCase();
    if (['md', 'markdown'].includes(ext)) return 'markdown';
    if (['html', 'htm', 'xhtml'].includes(ext)) return 'html';
    if (['json', 'task'].includes(ext)) return 'json';
    if (['css', 'scss'].includes(ext)) return 'css';
    if (['cjs', 'js', 'mjs'].includes(ext)) return 'javascript';
    if (['sh', 'bash', 'zsh', 'shell', 'dirs',' install'].includes(ext)) {
      return 'shell';
    }
    if (['yaml', 'yml'].includes(ext)) return 'yaml';
    if (['tex', 'latex', 'ltx', 'sty', 'cls'].includes(ext)) return 'tex';
    if (['txt', 'log', 'py', 'bib', 'ris', 'rtf'].includes(ext)) return 'plain';
    if (['php'].includes(ext)) return 'php';
    if (['lua'].includes(ext)) return 'lua';
    if (['xml', 'svg', 'rss'].includes(ext)) return 'xml';
  }
  if (
    /^\.?bash/.test(name) ||
    /^\.?inputrc/.test(name) ||
    /^\.?[Xx][Cc]ompose/.test(name) ||
    /^\.?xinitrc/.test(name) ||
    /^\.?[Xx]resources/.test(name) ||
    /^\.?PKGBUILD/.test(name)
  ) return 'shell';
  return 'plain';
}

function fileselectitemPowerup(li) {
  const filename = li.myfilename;
  const ft = filetypeOf(filename);
  if (ft == 'unknown') return;
  li.title = 'open ' + htmlesc(basename(filename));
  li.classList.add("oge-openable");
  li.onclick = function(e) {
    e.preventDefault();
    byid("leftpopin").close();
    openOrSwitchTo(this.myfilename, false);
  }
  li.assocTab = getTabByFilename(filename);
  if (li?.assocTab) {
    li.classList.add("oge-alreadyopen");
    if (li.assocTab.parentNode == maintabs ||
      li.assocTab.parentNode == stackedtabs) {
      li.classList.add("oge-isvisible");
      }
  }
  const btns = addelem({
    parent: li,
    classes: ['oge-filelistbuttons'],
    tag: 'div'
  });
  const viewBtn = addelem({
    parent: btns,
    tag: 'span',
    title: 'view',
    classes: ['oge-filelistviewbtn'],
    innerHTML: iconOf('visibility'),
    myfilename: filename,
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      byid('leftpopin').close();
      openOrSwitchTo(this.myfilename, true);
    }
  });
  const closeBtn = addelem({
    parent: btns,
    tag: 'span',
    title: 'close',
    classes: ['oge-filelistclosebtn'],
    innerHTML: iconOf('close'),
    mytab: li?.assocTab,
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      byid('leftpopin').close();
      if (this.mytab) this.mytab.closeme();
    }
  });
}

function fileSelectList(parent, dirlisting) {
  const bname = basename(dirlisting?.dirname);
  parent.toggleopen = function() {
    if (this.classList.contains('oge-opendirlisting')) {
      this.iconSpan.innerHTML = iconOf('folder');
      this.classList.remove('oge-opendirlisting');
      return;
    }
    this.classList.add('oge-opendirlisting');
    this.iconSpan.innerHTML = iconOf('folder_open');
  }
  const namediv = addelem({
    parent: parent,
    tag: 'div',
    mylisting: parent,
    onclick: function(e) {
      e.preventDefault();
      this.mylisting.toggleopen();
    }
  });
  parent.iconSpan = addelem({
    parent: namediv,
    innerHTML: iconOf('folder'),
    classes: ['oge-directory-icon'],
    tag: 'span'
  });
  const nameSpan = addelem({
    parent: namediv,
    tag: 'span',
    innerHTML: htmlesc(bname)
  });
  const ul = addelem({
    parent: parent,
    tag: 'ul'
  });
  const subdirsSorted = dirlisting?.subdirs?.sort?.((a,b) =>
    a.dirname.localeCompare(b.dirname)
  ) ?? [];
  // subdirectory listing
  for (const subdir of subdirsSorted) {
    const li = addelem({
      parent: ul,
      tag: 'li',
      classes: ['oge-dirlistdiritem'],
    });
    li.listing = fileSelectList(li, subdir);
  }
  // regular file listing
  for (const file of dirlisting.regularfiles) {
    const li = addelem({
      parent: ul,
      tag: 'li',
      myfilename: (dirlisting.dirname + '/' + file)
        .substring(window.session.dir.length + 1),
    });
    li.nameSpan = addelem({
      parent: li,
      tag: 'span',
      innerHTML: htmlesc(file)
    });
    fileselectitemPowerup(li, li.myfilename);
  }
  for (const file of dirlisting.hiddenfiles) {
    const li = addelem({
      parent: ul,
      classes: ['oge-hiddenfile'],
      myfilename: (dirlisting.dirname + '/' + file)
        .substring(window.session.dir.length + 1),
      tag: 'li'
    });
    li.nameSpan = addelem({
      parent: li,
      tag: 'span',
      innerHTML: htmlesc(file)
    });
    fileselectitemPowerup(li);
  }

  // newfile
  const nfli = addelem({
    parent: ul,
    classes: ['oge-filelistnewfile'],
    tag: 'li'
  });

  const nflabel = addelem({
    parent: nfli,
    tag: "label",
    innerHTML: '<span>' + iconOf('note_add') + '</span>'
  })

  const nfinp = addelem({
    parent: nflabel,
    tag: "input",
    type: "text",
    mydir: (dirlisting.dirname + '/').substring(window.session.dir.length + 1),
    placeholder: "new filename",
    onkeydown: function(e) {
      if (e.key == '/') e.preventDefault();
      if (e.key == 'Enter') {
        e.preventDefault();
        this.createFile();
      }
    },
    createFile: async function() {
      const filename = this.value.trim();
      const ffn = this.mydir + filename;
      // dont create file without letters
      if (!/[a-z]/i.test(filename)) return;
      byid("leftpopin").close();
      const reqdata = {
        reqtype: 'newfile',
        files: [ffn]
      }
      const respdata = await jsonRequest(reqdata);
      if (respdata.error) {
        const maint = maintabs.getElementsByClassName("ogetab");
        if (!maint || maint.length == 0) {
          return;
        }
        maint[0]?.view1?.dialogPanel?.errormsg('Error creating file: '
          + htmlesc(respdata.error.toString()));
        return;
      }
      await openTabsFor({
        files: [ffn]
      });
      const newtab = getTabByFilename(ffn);
      if (newtab) newtab.soloShow();
    }
  });
  const nfgoicon = addelem({
    tag: 'span',
    parent: nflabel,
    innerHTML: '<span>' + iconOf('add') + '</span>',
    myinp: nfinp,
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.myinp.createFile();
    }
  });
  return ul;
}

async function forwardjump() {
  const view = this;
  const cpos = view?.state?.selection?.main?.anchor ?? 0;
  const line = view?.state?.doc?.lineAt?.(cpos);
  const linenum = line?.number;
  if (!linenum) return  false;
  const currentfile = this?.myTab?.filename;
  if (!currentfile) return false
  const rootdocument = window?.actingRoot?.();
  const outputfile = window?.ogePreviewWindow?.nowShowing;
  if (!outputfile || !rootdocument) return false;
  const outputext = extensionOf(outputfile);
  const inputext = extensionOf(rootdocument);
  const routine = window?.ogesettings?.routines?.[inputext]?.[outputext];
  if (!routine?.forwardjump) return false;
  const reqdata = {
    reqtype: 'forwardjump',
    line: linenum,
    currentfile,
    rootdocument,
    outputfile,
    inputext,
    outputext
  }
  const respdata = await jsonRequest(reqdata);
  if (respdata?.page) {
    window.ogePreviewWindow.jumpTo(respdata.page);
    return true;
  }
  return false;
}

function getCurrentTab() {
  for (const editortab of document.getElementsByClassName("ogetab")) {
    if (editortab.contains(document.activeElement)) {
      return editortab;
    }
  }
  const maint = maintabs.getElementsByClassName("ogetab");
  if (maint.length > 0) {
    return maint[0];
  }
  if (window?.tabLastModified) {
    return window.tabLastModified;
  }
  return null;
}

function getLastFocusedTab() {
  for (const editortab of document.getElementsByClassName("ogetab")) {
    if (editortab.contains(document.activeElement)) {
      return editortab;
    }
  }
  if (window?.lastfocusedtab) return window.lastfocusedtab;
  const maint = maintabs.getElementsByClassName("ogetab");
  if (maint.length > 0) {
    return maint[0];
  }
  if (window?.tabLastModified) {
    return window.tabLastModified;
  }
  return null;
}
window.getLastFocusedTab = getLastFocusedTab;

function getLineDom(n) {
  const ll = this.contentDOM.getElementsByClassName("cm-line");
  if (n<=ll.length) return ll[n-1];
  return null;
}

function getTabByFilename(filename) {
  const editortabs = document.getElementsByClassName('ogetab');
  for (const editortab of editortabs) {
    if (editortab.filename == filename) return editortab;
  }
  return null;
}

function hideMe() {
  hiddentabs.appendChild(this);
}

async function insertTemplate(templatenum) {
  const templateext = extensionOf(this.myTab.filename);
  if (!templateext) return;
  const respdata = await jsonRequest({
    reqtype: 'template',
    templateext,
    templatenum
  });
  if (respdata?.error || !respdata?.template) {
    console.error('Template error: ', respdata?.error);
    return;
  }
  const mainsel = this?.state?.selection?.main;
  const fr = mainsel?.from ?? 0;
  const to = mainsel?.to ?? 0;
  this.dispatch(this.state.update({
    changes: {
      from: fr,
      to: to,
      insert: respdata.template
    }
  }));
}

function isSaved() {
  return (this.savedContents == this.view1.state.doc.toString());
}

export async function jsonRequest(reqdata) {
  reqdata.sessionid = window?.session?.sessionid;
  if (!reqdata.sessionid) return null;
  reqdata.dir = window.session?.dir;
  if (!reqdata.dir) return null;
  const res = await jsonFetch('/ogejson/' + reqdata.sessionid, reqdata);
  return res;
}

function launchPreview() {
  window.ogePreviewWindow = window.open(
    '/ogepreview/' + window.session.sessionid,
    'preview' + window.session.sessionid.replace(/[^0-9a-z]/gi,''),
    'popup,width=' + (window.ogesettings?.viewer?.width ?? 900).toString() +
    ',height=' + (window.ogesettings?.viewer?.height ?? 500).toString()
  );
  window.neverpreviewed = false;
}

function makeGitCommit(msg) {
  saveFiles({
    all: true,
    download: false,
    process: false,
    gitcommit: msg,
    fromtab: this
  });
}

function moveTab(clockwise) {
  const maint = maintabs.getElementsByClassName("ogetab");
  const stackedt = stackedtabs.getElementsByClassName("ogetab");
  // does not make sense to move hidden tab
  if (![...maint,...stackedt].includes(this)) return;
  // does not make sense to move tab if only one shown
  if (maint.length == 0 || stackedt.length == 0) return;
  // currently main
  if ([...maint].includes(this)) {
    if (clockwise) {
      const stackedmover = stackedt[stackedt.length - 1];
      stackedtabs.prepend(this);
      maintabs.appendChild(stackedmover);
      updateTabList();
      this.view1.focus();
      this.view1.cursorInMiddle();
      return;
    }
    const stackedmover = stackedt[0];
    stackedtabs.appendChild(this);
    maintabs.prepend(stackedmover);
    updateTabList();
    this.view1.focus();
    this.view1.cursorInMiddle();
    return;
  }
  // currently stacked
  if (clockwise) {
    if (this == stackedt[stackedt.length - 1]) {
      const mainmover = maint[0];
      stackedtabs.prepend(mainmover);
      maintabs.appendChild(this);
      updateTabList();
      this.view1.focus();
      this.view1.cursorInMiddle();
      return;
    }
    this.parentNode.insertBefore(this.nextSibling, this);
    updateTabList();
    this.view1.focus();
    this.view1.cursorInMiddle();
    return;
  }
  if (this == stackedt[0]) {
    const mainmover = maint[maint.length - 1];
    stackedtabs.appendChild(mainmover);
    maintabs.prepend(this);
    updateTabList();
    setTimeout(() => {
      this.view1.focus();
      this.view1.cursorInMiddle();
    },10);
    return;
  }
  this.parentNode.insertBefore(this, this.previousSibling);
  updateTabList();
  this.view1.focus();
  this.view1.cursorInMiddle();
  return;
}

function ondocchange(update) {
  window.tabLastModified = this;
  if (window?.saveButton?.updateme) window.saveButton.updateme();
  if (window.autoProcessButton.currentstate == "on") {
    restartAPTimer();
  }
}

export async function openOpenFiles() {
  const popin = byid('leftpopin');
  popin.showModal();
  window?.openButton?.setstate("open");
  popin.innerHTML = '<span class="spinicon">' + iconOf('refresh') + '</span>' +
    ' Loading …';
  const respdata = await jsonRequest({ reqtype:'filelist'});
  popin.innerHTML = '';

  const hdr = addelem({
    parent: popin,
    tag: 'header',
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeOpenFiles();
    }
  });
  const closer = addelem({
    parent: hdr,
    tag: 'form',
    method: 'dialog',
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.submit();
    },
    innerHTML: iconOf('chevron_left')
  });
  const lbl = addelem({
    parent: hdr,
    tag: 'div',
    innerHTML: 'Files'
  });
  const selectorHolder = addelem({
    parent: popin,
    tag: 'div',
    classes: ['oge-fileselector']
  });
  const mainFileSelect = fileSelectList(selectorHolder, respdata);
  selectorHolder.toggleopen();
}
window.openOpenFiles = openOpenFiles;

async function openOrSwitchTo(filename, makevisible) {
  const editortab = getTabByFilename(filename);
  if (editortab) {
    if (editortab.parentNode == maintabs) {
      if (makevisible) {
        editortab.toggleVisibility();
        return editortab;
      }
      editortab.view1.focus();
      return editortab;
    }
    if (makevisible) {
      editortab.toggleVisibility();
      return editortab;
    }
    editortab.soloShow();
    return editortab;
  }
  await openTabsFor({
    files: [filename]
  });
  const newtab = getTabByFilename(filename);
  newtab.soloShow();
  return newtab;
}

export async function openSettings() {
  const popin = byid('rightpopin');
  popin.showModal();
  window?.settingsButton?.setstate("open");
  popin.innerHTML = '<span class="spinicon">' + iconOf('refresh') + '</span>' +
    ' Loading …';
  const respdata = await jsonRequest({ reqtype:'settingsoptions'});
  popin.innerHTML = '';

  const hdr = addelem({
    parent: popin,
    tag: 'header',
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeSettings();
    }
  });
  const closer = addelem({
    parent: hdr,
    tag: 'form',
    method: 'dialog',
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.submit();
    },
    innerHTML: iconOf('chevron_right')
  });
  const lbl = addelem({
    parent: hdr,
    tag: 'div',
    innerHTML: 'Settings'
  });
  const settingsHolder = addelem({
    parent: popin,
    tag: 'div',
    classes: ['oge-settings']
  });
  if (!respdata?.colorschemes || !respdata?.fonts) {
    settingsHolder.innerHTML = 'Sorry. ' +
      'There was a error loading settings options.';
    return;
  }
  const colorLabel = addelem({
    parent: settingsHolder,
    tag: 'label',
    htmlFor: 'colorschemeselector',
    innerHTML: 'Color scheme'
  });
  window.revertcolorscheme = window.colorschemename;
  const colorSelect = addelem({
    parent: settingsHolder,
    id: 'colorschemeselector',
    tag: 'select',
    onchange: function() {
      const newscheme = this.value;
      loadcolorscheme(newscheme);
    }
  });
  for (const cs of respdata.colorschemes) {
    const opt = addelem({
      tag: 'option',
      parent: colorSelect,
      innerHTML: cs.replaceAll('_', ' '),
      value: cs,
      selected: (cs == window.revertcolorscheme)
    });
  }
  const csrevertdiv = addelem({
    tag: 'div',
    parent: settingsHolder,
    classes: ['oge-settingsrevertdiv']
  });
  const csreverter = addelem({
    tag: 'div',
    parent: csrevertdiv,
    myselect: colorSelect,
    title: 'return to earlier scheme',
    innerHTML: 'revert ' + iconOf('settings_backup_restore'),
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.myselect.value = window.revertcolorscheme;
      loadcolorscheme(window.revertcolorscheme);
    }
  });
  const fontLabel = addelem({
    parent: settingsHolder,
    tag: 'label',
    htmlFor: 'fontselector',
    innerHTML: 'Editor font'
  });
  window.revertfont = window.editorfontname;
  const fontSelect = addelem({
    parent: settingsHolder,
    id: 'fontselector',
    tag: 'select',
    onchange: function() {
      const newfont = this.value;
      loadeditorfont(newfont);
    }
  });
  for (const fname of respdata.fonts) {
    const opt = addelem({
      tag: 'option',
      parent: fontSelect,
      innerHTML: fname.replaceAll('_', ' '),
      value: fname,
      selected: (fname == window.revertfont)
    });
  }
  const fontrevertdiv = addelem({
    tag: 'div',
    parent: settingsHolder,
    classes: ['oge-settingsrevertdiv']
  });
  const fontreverter = addelem({
    tag: 'div',
    parent: fontrevertdiv,
    myselect: fontSelect,
    title: 'return to earlier font',
    innerHTML: 'revert ' + iconOf('settings_backup_restore'),
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.myselect.value = window.revertfont;
      loadeditorfont(window.revertfont);
    }
  });

  const speedLabel = addelem({
    tag: 'label',
    parent: settingsHolder,
    htmlFor: 'delayinput',
    innerHTML: 'Autoprocess delay (ms)'
  });
  const speedInput = addelem({
    tag: 'input',
    parent: settingsHolder,
    type: 'number',
    id: 'delayinput',
    startval: window.ogesettings.autoprocess.delay.toString(),
    value: window.ogesettings.autoprocess.delay.toString(),
    onkeydown: function(e) {
      if (/^[a-z]$/i.test(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    onchange: function(e) {
      const newval = parseInt(this.value);
      if (isNaN(newval)) return;
      if (newval < 10 || newval > 3600000) {
        this.value = this.startval;
        return;
      }
      setNewSpeed(newval);
    },
    min: 10,
    max: 3600000,
  });
  const speedrevertdiv = addelem({
    tag: 'div',
    parent: settingsHolder,
    classes: ['oge-settingsrevertdiv']
  });
  const speedreverter = addelem({
    tag: 'div',
    parent: speedrevertdiv,
    myinp: speedInput,
    title: 'return to earlier delay',
    innerHTML: 'revert ' + iconOf('settings_backup_restore'),
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.myinp.value = this.myinp.startval;
      setNewSpeed(parseInt(this.myinp.startval));
    }
  });

  popin.reportSettings = async () => {
    const reqdata = {
      delay: parseInt(speedInput.value),
      font: fontSelect.value,
      colorscheme: colorSelect.value,
      reqtype: 'reportpreferences'
    }
    const repdata = await jsonRequest(reqdata);
  }

}
window.openSettings = openSettings;

export async function openTabsFor(reqdata) {
  reqdata.reqtype = 'getfiles';
  const fileinfo = await jsonRequest(reqdata);
  if (!fileinfo) return false;
  if (fileinfo?.error) {
    console.error(fileinfo.error);
    return false;
  }
  if (!("dir" in fileinfo) || (fileinfo.dir != window?.session?.dir)) {
    console.error(`Returned directory of files do not match session.`);
    return false;
  }
  if (!fileinfo?.files || fileinfo.files.length == 0) return true;
  for (const file of fileinfo.files) {
    createEditorTab(file);
  }
}

function reportCheckOnSaveError(msg) {
  const firstline = msg.split('\n')[0];
  const parts = firstline.split(':');
  let blameLine = -1;
  let blameCol = -1;
  if (parts.length > 1 &&
    parts[0].includes(this.filename) &&
    /^[0-9]+$/.test(parts[1].trim())) {
    const lnum = parseInt(parts[1]);
    if (!isNaN(lnum)) blameLine = lnum;
    if (parts.length > 2) {
      const cnum = parseInt(parts[2]);
      if (!isNaN(cnum)) blameCol = cnum;
    }
  }
  if (blameLine == -1 &&
    /[Ll]ine [0-9]+/.test(msg)) {
    for (const outline of msg.split('\n')) {
      const lnum = parseInt(outline.
        replace(/^.*[Ll]ine ([0-9]+).*$/,"$1"));
      if (!isNaN(lnum)) blameLine = lnum;
    }
  }
  if (blameCol == -1 &&
    /[Cc]ol(umn)? [0-9]+/.test(msg)) {
    const colnum = parseInt(msg.
      replace(/.*[Cc]ol(umn)? ([0-9]+).*/,"$2"));
    if (!isNaN(colnum)) blameCol = colnum;
  }

  this.soloShow();
  const view = this.view1;
  let badline = null;
  if (blameLine >= 1) {
    if (blameCol == -1) blameCol = 0;
    view.gotolinecol(blameLine, blameCol);
    badline = view.getLineDom(blameLine)
    setTimeout(() => {
      if (!badline) return;
      badline.classList.add('flashbad');
    }, 10);
  }
  setTimeout(() => (
  view.dialogPanel.errormsg(
    `Check on save error:<pre>${htmlesc(msg)}</pre>`
  )), 2000);
}

function restartAPTimer() {
  clearAPTimer();
  const delay = window?.ogesettings?.autoprocess?.delay ?? 800;
  if (delay == 0) return;
  window.autoprocessTimer = setTimeout(
    () => (runProcess(true)),
    delay
  );
}

async function reverseJump(opts) {
  opts.rootdocument = window.actingRoot();
  if (!opts?.rootdocument) return false;
  const inputext = extensionOf(opts.rootdocument);
  const outputext = extensionOf(opts.outputfile);
  const routine = window?.ogesettings?.routines?.[inputext]?.[outputext];
  opts.inputext = inputext;
  opts.outputext = outputext;
  if (!routine?.reversejump) return false;
  opts.reqtype = 'reversejump';
  const respdata = await jsonRequest(opts);
  if (!respdata.filename) {
    console.error('Reverse jump file not found.');
    return;
  }
  // see if already open
  const editortab = await openOrSwitchTo(respdata.filename, false);
  if (editortab?.view1.gotolinecol && respdata.line) {
    editortab.view1.gotolinecol(respdata.line, 0);
    editortab.view1.cursorInMiddle();
    editortab.view1.focus();
    const ldom = editortab.view1.getLineDom(respdata.line);
    if (!ldom) {
      return;
    }
    setTimeout(() => (ldom.classList.add('flashy')), 100);
  }
}
window.reverseJump = reverseJump;

function rotateTabs(clockwise) {
  const maint = maintabs.getElementsByClassName("ogetab");
  const stackedt = stackedtabs.getElementsByClassName("ogetab");
  // need tabs in both for rotating to be possible
  if (maint.length == 0 || stackedt.length == 0) return;
  const mainmovers = [...maint].reverse();
  if (clockwise) {
    const stackedmover = stackedt[stackedt.length - 1];
    for (const mover of mainmovers) {
      stackedtabs.prepend(mover);
    }
    maintabs.appendChild(stackedmover);
    updateTabList();
    return;
  }
  const stackedmover = stackedt[0];
  for (const mover of mainmovers) {
    stackedtabs.appendChild(mover);
  }
  maintabs.prepend(stackedmover);
  updateTabList();
}

function runProcess(auto = false) {
  const editortab = getCurrentTab();
  if (editortab?.filename && !window?.firstprocessedFile) {
    window.firstprocessedFile = editortab.filename;
    window?.outputChooseButton?.updateOrder();
  }
  const outputext = window?.outputChooseButton?.outputext ?? '';
  saveFiles({
    all: true,
    process: true,
    auto,
    outputext,
    editortab,
    actingroot: window.actingRoot()
  });
}
window.runProcess = runProcess;

async function saveFiles(opts) {
  const auto = opts?.auto ?? false;
  if (window?.isSaving && opts?.process) {
    window.processPending = true;
  }
  if (window?.isSaving) return;
  window.isSaving = true;
  let tabs = [];
  if (opts.editortab) tabs = [opts.editortab];
  if (opts?.all) tabs = [...document.getElementsByClassName("ogetab")];
  const reqdata = {
    actingroot: opts?.actingroot ?? false,
    process: opts?.process ?? false,
    gitcommit: opts?.gitcommit ?? false,
    outputext: opts?.outputext ?? '',
    reqtype: 'savefiles',
    currentfile: opts?.editortab?.filename ?? '',
    files: []
  }
  for (const editortab of tabs) {
    if (editortab.isSaved()) continue;
    reqdata.files.push({
      filename: editortab.filename,
      contents: editortab.view1.state.doc.toString()
    });
  }
  if (window?.saveButton) {
    window.saveButton.setstate('saving');
  }
  if (window?.processButton) {
    if (opts?.process) {
      window.processButton.setstate('processing');
    } else {
      window.processButton.setstate('disabled');
    }
  }
  const respdata = await jsonRequest(reqdata);
  window.isSaving = false;
  window?.saveButton?.setstate((respdata?.error || respdata?.saveerror)
    ? 'error' : 'unchanged');
  window.processButton.setstate((respdata?.processerror) ? 'error' : 'normal');
  let panelOpen = false;
  const errmsgs = [];
  if (!respdata) errmsgs.push('Invalid response from server.');
  if (respdata?.error) errmsgs.push(respdata.error.toString());
  if (respdata?.saveerror) errmsgs.push(respdata.saveerror);
  if (respdata?.giterror) errmsgs.push(respdata.giterror);
  if (respdata?.processerror) errmsgs.push(respdata.processerror);
  if (errmsgs.length > 0) {
    const maint = maintabs.getElementsByClassName("ogetab");
    if (maint.length > 0) {
      maint[0]?.view1?.dialogPanel?.errormsg(errmsgs.join('<br>'), 0, auto);
      panelOpen = true;
    }
  }
  for (const file of reqdata.files) {
    if (respdata?.error || respdata?.saveerror) break;
    let foundtab = null;
    for (const editortab of document.getElementsByClassName("ogetab")) {
      if (editortab.filename == file.filename) {
        editortab.savedContents = file.contents;
        foundtab = editortab;
      }
    }

    if (foundtab && (file.filename in (respdata?.checkonsaveerrors ?? {}))) {
      foundtab.reportCheckOnSaveError(
        respdata.checkonsaveerrors[file.filename]
      );
    }

    // if file is oge-settings apply it!
    if (file.filename == 'oge-settings.json') {
      try {
        const newSettings = JSON.parse(file.contents);
        window.localogesettings = newSettings;
        settingsChange();
      } catch(err) {
        if (foundtab?.view1?.dialogPanel.errormsg) {
          const errStr = err.toString();
          foundtab?.view1?.dialogPanel?.errormsg(
            `Could not merge new settings: ` +
              htmlesc(errStr), 3000
          );
          panelOpen = true;
          if (/at line [0-9]+ column [0-9]+/.test(errStr)) {
            const errLine = parseInt(
              errStr.replace(/.*at line ([0-9]+) column.*/,"$1")
            );
            let errCol = parseInt(
              errStr.replace(/.*at line [0-9]+ column ([0-9]*).*/,"$1")
            );
            if (errCol > 0) errCol = errCol - 1;
            if (isNaN(errLine) || isNaN(errCol)) return;
            foundtab.view1?.gotolinecol(errLine, errCol);
            foundtab.view1.focus();
            const badline = foundtab.view1.getLineDom(errLine);
            if (badline) {
              setTimeout(()=>(badline.classList.add('flashbad')), 100);
            }
          }
        }
      }
    }
  }
  if (errmsgs.length == 0 &&
    opts?.process && opts?.outputext == 'pdf' &&
      respdata?.postprocessout) {
    window.pdfnumpages = parseInt(respdata.postprocessout.trim());
    if (window.ogePreviewWindow && !isNaN(window.pdfnumpages)) {
      window.ogePreviewWindow.pdfnumpages = window.pdfnumpages;
    }
  }
  if (errmsgs.length == 0 && opts?.process && window?.ogePreviewWindow) {
    window.ogePreviewWindow?.updateOGEPreview();
  }
  if (opts?.process && !window?.ogePreviewWindow &&
     errmsgs.length == 0 && window.neverpreviewed) {
    launchPreview();
  }
  if (errmsgs.length == 0 && opts?.gitcommit && !panelOpen && opts?.fromtab) {
    opts.fromtab?.view1?.dialogPanel?.infomsg?.(
      `Git commit (“${opts.gitcommit}”) made successfully.`
    );
    panelOpen = true;
  }
  if (window.processPending) {
    window.processPending = false;
    if (anyUnsaved()) runProcess(true);
  }
  updateTabClasses();
}
window.saveFiles = saveFiles;

function saveWarning() {
  this.soloShow();
  this.view1.dialogPanel.errormsg('This document is unsaved. ' +
    'If you close it, you will lose your changes. ' +
    '<button type="button" class="closeanyway">close anyway</button>' +
    '<button type="button" class="closecancel">cancel</button>'
  );
  const btns = this?.view1?.dialogPanel?.getElementsByTagName("button");
  const closeanywaybtn = btns?.[0];
  const closecancelbtn = btns?.[1];
  if (!closecancelbtn) return;
  closeanywaybtn.myTab = this;
  closeanywaybtn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.myTab.closeme(true);
  }
  closecancelbtn.myview = this.view1;
  closecancelbtn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.myview.dialogPanel.closeme();
    this.myview.focus();
    this.myview.cursorInMiddle();
  }
}

function setNewSpeed(sp) {
  if (isNaN(sp)) return;
  if (!window?.session) {
    window.session = {};
  }
  if (!window.session?.ogeoverride) {
    window.session.ogeoverride = {};
  }
  if (!window.session.ogeoverride.autoprocess) {
    window.session.ogeoverride.autoprocess = {};
  }
  window.session.ogeoverride.autoprocess.delay = sp;
  mergeSettings();
}

function setsplit(d) {
  const lscape = (window.innerWidth > window.innerHeight);
  let addrem = 'add';
  let icon = '';
  if (d === false) {
    addrem = 'remove';
    icon = ((lscape) ? 'splitscreen_landscape' : 'splitscreen_portrait');
    this.splitwrapper.classList.remove('vsplit', 'hsplit');
    this.splitwrapper.classList.add('mono');
    this.isSplit = false;
    this.view1.focus();
  }
  if (d == 'v') {
    icon = 'splitscreen_landscape';
    this.splitwrapper.classList.remove('hsplit', 'mono');
    this.splitwrapper.classList.add('vsplit');
    this.isSplit = 'v';
  }
  if (d == 'h') {
    icon = 'splitscreen_portrait';
    this.splitwrapper.classList.remove('vsplit', 'mono');
    this.splitwrapper.classList.add('hsplit');
    this.isSplit = 'h';
  }
  // update button status
  const splbtns = this.getElementsByClassName("oge-split-toggle");
  for (const btn of splbtns) {
    btn.classList[addrem]('active');
    btn.innerHTML = iconOf(icon);
  }
  return true;
}

function settingsChange() {
  mergeSettings();
  if (window?.outputChooseButton?.updateOrder) {
    window.outputChooseButton.updateOrder();
  }
  // change spellcheck
  for (const editortab of document.getElementsByClassName("ogetab")) {
    const spellcheck = window?.ogesettings?.routines
      ?.[editortab.extension]?.spellcheck ?? false;
      editortab.view1.contentDOM.spellcheck = spellcheck;
      editortab.view2.contentDOM.spellcheck = spellcheck;
  }
  setupAutosave();
}

export function setupAutosave() {
  if (window.autosaveTimer) {
    clearInterval(window.autosaveTimer);
    window.autosaveTimer = null;
  }
  const interval = window?.ogesettings?.autosave?.interval;
  if (!interval || interval == 0) return;
  window.autosaveTimer = setInterval(() => {
    autoSave();
  }, interval);
}

function smartQuoteChar(dbl, ftype, before) {
  let quotes = (ftype == 'tex')
    ? ((dbl) ? { l: '``', s: '"', r: "''" }
    : { l: '`', s: "'", r: "'" })
    : ((dbl) ? { l: '“', s: '"', r: '”' }
    : { l: '‘', s:"'", r:'’' });
  // left at start of line
  if (before == '') return quotes.l;
  // depends on character before
  const prevchar = before[before.length - 1];
  // straight if after backslash
  if (prevchar == '\\') return quotes.s;
  // left quote after any of these
  if ([' ',' ',' ',' ','(','[','{','<','=','&','-','—','–',':']
    .includes(prevchar)) return quotes.l;
  // everything else is right
  return quotes.r;
}

function smartQuote(dbl, ftype) {
  const view = this;
  const range = view.state.selection.main;
  const cpos = range.anchor;
  const line = view.state.doc.lineAt(cpos);
  const before = view.state.sliceDoc(line.from, cpos);
  const char = smartQuoteChar(dbl, ftype, before);
  const displace = char.length;
  // insert matching
  let ins = char;
  // autoclose
  if (char == '`') ins += "'";
  if (char == '``') ins += "''";
  if (char == '‘') ins += '’';
  if (char == '“') ins += '”';
  view.insertHere(ins, displace);
}

function soloShow() {
  for (const editortab of [...document.getElementsByClassName("ogetab")]) {
    editortab.hideMe();
  }
  maintabs.appendChild(this);
  this.view1.focus();
  this.view1.cursorInMiddle();
  updateTabClasses();
}

export function startReadAloud() {
  // only make active once we know reading works
  window.speakButton.setstate("inactive");

  // tab is always the first one in main
  const editortab = maintabs?.getElementsByClassName("ogetab")?.[0];
  if (!editortab) return;

  // ensure we are dealing with a readable filetype
  const ext = extensionOf(editortab.filename);
  const readables = window?.ogesettings?.readaloud ?? {};
  if (!(ext in readables)) return;

  // determine view
  let view = editortab.view1;
  const fvfv = (editortab?.split2?.getElementsByClassName("cm-focus") ?? []);
  if (fvfv.length > 0) view = editortab.view2;

  // get text to read
  const mainrange = view?.state?.selection?.main;
  if (!mainrange) return;
  const hassel = !mainrange.empty;
  let text = '';
  if (hassel) {
    text = view.state.sliceDoc(mainrange.from, mainrange.to);
  } else {
    const cpos = mainrange?.anchor ?? 0;
    const line = view.state.doc.lineAt(cpos);
    text = view.state.sliceDoc(line.from, line.to);
  }

  // move to next line if empty
  if (!/[a-z]/i.test(text)) {
    const wentdown = view.linedown();
    if (!wentdown) {
      window.speakButton.setstate('inactive');
      return;
    }
    view.focus();
    return startReadAloud();
  }

  if (!window.audioelem) {
    window.audioelem = addelem({
      tag: 'audio',
      controls: false,
      parent: document.body
    });
  }

  window.audioelem.src = '/ogeaudio/' + window.session.sessionid +
    '/' + encodeURIComponent(ext) + '/oge-audio.mp3?text=' +
    encodeURIComponent(text);

  window.audioelem.currentTime = 0;
  window.audioelem.preload = true;
  window.audioelem.onended = () => {
    if (hassel) {
      window.speakButton.setstate('inactive');
      return;
    }
    const wentdown = view.linedown();
    if (!wentdown) {
      window.speakButton.setstate('inactive');
      return;
    }
    view.focus();
    return startReadAloud();
  }
  window.audioelem.onerror = () => {
    if (hassel) return;
    const wentdown = view.linedown();
    if (!wentdown) {
      window.speakButton.setstate('inactive');
      return;
    }
    view.focus();
    return startReadAloud();
  }
  window.audioelem.onplaying = () => {
    window.speakButton.setstate('active');
  }
  const playbackrate = window?.ogesettings?.readaloud?.playbackrate ?? 1;
  window.audioelem.playbackRate = playbackrate;
  window.audioelem.play();
}

export function stopReadAloud() {
  if (window.audioelem) {
    window.audioelem.onended = function() {};
    window.audioelem.pause();
  }
  window.speakButton.setstate('inactive');
}

function switchTab(tonext) {
  const lili = tablist.getElementsByClassName("oge-tablistitem");
  // doesn't make sense if fewer than two tabs
  if (lili.length < 2) return;
  let targetli = null;
  for (const li of lili) {
    if (li.classList.contains("focusedtab")) {
      targetli = li;
      break;
    }
  }
  if (!targetli) return;
  const where = [...lili].indexOf(targetli);
  if (tonext) {
    // last element, go to first
    if (where == lili.length - 1) {
      const editortab = lili[0].myTab;
      editortab.soloShow();
      return;
    }
    // otherwise, go to next
    const editortab = lili[where + 1].myTab;
    editortab.soloShow();
    return;
  }
  // backwards, if at start, go to end
  if (where == 0) {
    const editortab = lili[lili.length - 1].myTab;
    editortab.soloShow();
    return;
  }
  const editortab = lili[where - 1].myTab;
  editortab.soloShow();
  return;
}

function tablistItem(editortab) {
  const li = addelem({
    parent: tablist,
    tag: 'li',
    myTab: editortab,
    classes: ['oge-tablistitem'],
    onclick: function(e) {
      e.preventDefault();
      this.myTab.soloShow();
    }
  });
  const fnarea = addelem({
    parent: li,
    tag: 'div',
    classes: ['oge-tabfilename']
  });
  const fnpartsarea = addelem({
    parent: fnarea,
    tag: 'span'
  });
  li.saveindic = addelem({
    parent: fnarea,
    tag: 'span',
    innerHTML: iconOf('save'),
    classes: ['oge-tabsaveindicator']
  });
  const tabbtns = addelem({
    parent: li,
    tag: 'div',
    classes: ['oge-tabbuttons']
  });
  const viewbtn = addelem({
    parent: tabbtns,
    tag: 'span',
    innerHTML: iconOf('visibility'),
    title: 'toggle shown (alt-v)',
    classes: ['oge-tabviewbutton'],
    myTab: editortab,
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.myTab.toggleVisibility();
    }
  });
  const closebtn = addelem({
    parent: tabbtns,
    tag: 'span',
    title: 'close tab (alt-q)',
    innerHTML: iconOf('close'),
    classes: ['oge-tabclosebutton'],
    myTab: editortab,
    onclick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.myTab.closeme();
    }
  });
  const nameparts = editortab.filename.split('/');
  for (const namepart of nameparts) {
    const sp = addelem({
      tag: 'span',
      parent: fnpartsarea,
      classes: ['oge-tabnamepart'],
      innerHTML: htmlesc(namepart)
    });
  }
  li.title = 'switch to ' + htmlesc(nameparts[nameparts.length - 1]);
  editortab.mylistedtab = li;
  return li;
}

function toggleAutoProcessing() {
  if (!window?.autoProcessButton) return;
  const currentstate = window.autoProcessButton.currentstate;
  const newstate = (currentstate == "on") ? "off" : "on";
  window.autoProcessButton.setstate(newstate);
  if (newstate == "off") clearAPTimer();
  if (newstate == 'on') {
    runProcess(true);
  }
}
window.toggleAutoProcessing = toggleAutoProcessing;

function togglePreview() {
  if (!window?.ogePreviewWindow) {
    launchPreview();
    return;
  }
  closePreview(false);
}
window.togglePreview = togglePreview;

function togglesplit() {
  const lscape = (window.innerWidth > window.innerHeight);
  const isSplit = this?.isSplit ?? false;
  if (isSplit == false) {
    return this.setsplit((lscape) ? 'v' : 'h');
  }
  if (isSplit == 'v') {
    return this.setsplit((lscape) ? 'h' : false);
  }
  return this.setsplit((lscape) ? false : 'v');
}

function toggleVisibility() {
  const where = this.parentNode;
  const maint = maintabs.getElementsByClassName("ogetab");
  const hiddent = hiddentabs.getElementsByClassName("ogetab");
  const stackedt = stackedtabs.getElementsByClassName("ogetab");
  const visibles = [...maint, ...stackedt];
  const visiblenow = visibles.includes(this);
  if (visiblenow) {
    // never hide last tab
    if (visibles.length == 1 && hiddent.length == 0) return;
    // move to hidden
    hiddentabs.appendChild(this);
    // move something else into main if needed, and focus
    if (maint.length == 0) {
      if (stackedt.length > 0) {
        const mover = stackedt[0];
        maintabs.appendChild(mover);
      }
      if (maint.length == 0 && hiddent.length > 0) {
        const mover= hiddent[0];
        maintabs.appendChild(mover);
      }
      if (maint?.[0]) {
        maint[0].view1.focus();
        maint[0].view1.cursorInMiddle();
      }
    }
    updateTabList();
    return;
  }
  if (maint.length == 0) {
    mantabs.appendChild(this);
  }
  if (maint.length > 0) {
    stackedtabs.appendChild(this);
  }
  updateTabList();
  this.view1.focus();
  this.view1.cursorInMiddle();
}

function toggleZoom() {
  const maint = maintabs.getElementsByClassName("ogetab");
  const stackedt = stackedtabs.getElementsByClassName("ogetab");
  const isMain = [...maint].includes(this);
  if (isMain) {
    // must be something stacked, or it doesn't make sense to swap
    if (stackedt.length == 0) return;
    const mover = stackedt[0];
    stackedtabs.appendChild(this);
    maintabs.appendChild(mover);
    updateTabList();
    mover.view1.focus();
    mover.view1.cursorInMiddle();
    return;
  }
  const isStacked = [...stackedt].includes(this);
  // cannot move hidden tab
  if (!isStacked) return;
  for (const mntab of [...maint]) {
    stackedtabs.appendChild(mntab);
  }
  maintabs.appendChild(this);
  updateTabList();
  this.view1.focus();
  this.view1.cursorInMiddle();
}

async function unixFilter(unixcmd) {
  const view = this;
  if (unixcmd.includes('sudo')) {
    view.dialogPanel.errormsg('Unix filters must not contain “sudo”.');
    return;
  }
  const rangesToFilter = [];
  for (const range of (view?.state?.selection?.ranges ?? [])) {
    if (range.empty) continue;
    rangesToFilter.push({
      from: range.from,
      to: range.to,
      text: view.state.sliceDoc(range.from, range.to)
    });
  }
  // if all ranges empty, just insert result
  if (rangesToFilter.length == 0) {
    rangesToFilter.push({
      from: view.state.selection.main.from,
      to: view.state.selection.main.to,
      text: ''
    });
  }
  const reqdata = {
    tofilter: rangesToFilter,
    reqtype: 'unixfilter',
    unixcmd
  }
  const respdata = await jsonRequest(reqdata);
  if (respdata?.error) {
    view.dialogPanel.errormsg('<p>Error running UNIX Filter:</p>' +
    '<pre>' + respdata.error.toString() + '</pre>');
    return;
  }
  if (!respdata?.filterresults) {
    view.dialogPanel.errormsg('<p>Unexpected response from server ' +
      'when running UNIX filter.</p>');
      return;
  }
  const fresults = respdata.filterresults;
  view.applyUnixFilter(fresults, unixcmd);
}

function updateTabClasses() {
  const lili = tablist.getElementsByClassName("oge-tablistitem");
  let allsaved = true;
  for (const li of lili) {
    const unsaved = !(li.myTab.isSaved());
    if (unsaved) allsaved = false;
    setTimeout(()=>{
      const focuswithin = li.myTab.contains(document.activeElement);
      if (focuswithin) {
        li.classList.add('focusedtab');
        window.lastfocusedtab = li.myTab;
      } else {
        li.classList.remove('focusedtab');
      }
    }, 10);
    if (unsaved) {
      if (li.saveindic) li.saveindic.title = 'unsaved';
      li.classList.add('unsavedtab');
    } else {
      if (li.saveindic) li.saveindic.title = 'saved';
      li.classList.remove('unsavedtab');
    }
    if (li.myTab.parentNode == hiddentabs) {
      li.classList.add('hiddentab');
    } else {
      li.classList.remove('hiddentab');
    }
  }
  const dirbase = window?.session?.dir?.replace?.(/.*\//,'');
  document.title = htmlesc(dirbase) +
    ((allsaved) ? '' : ' [+]') + ' | open guide editor';
}
window.updateTabClasses = updateTabClasses;

function updateTabList() {
  // empty existing
  const lili = tablist.getElementsByClassName("oge-tablistitem");
  while (lili.length > 0) {
    const li = lili[0];
    li.parentNode.removeChild(li);
  }
  const alltabs = [
    ...maintabs.getElementsByClassName("ogetab"),
    ...stackedtabs.getElementsByClassName("ogetab"),
    ...hiddentabs.getElementsByClassName("ogetab"),
  ].sort(
    (a, b) => (basename(a.filename).localeCompare(basename(b.filename)))
  );
  for (const editortab of alltabs) {
    const li = tablistItem(editortab);
    li.parentNode.insertBefore(li, rightpanelbuttons);
  }
  updateTabClasses();
}
