// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: ogesetup.mjs
// Sets up the editor page on load including panel buttons and their functions

import {
  addelem,
  byid,
  extensionOf,
  iconOf
} from './misc.mjs';
import {
  closeOpenFiles,
  closeSettings,
  jsonRequest,
  openOpenFiles,
  openSettings,
  openTabsFor,
  setupAutosave,
  startReadAloud,
  stopReadAloud
} from './liboge.mjs';
import {mergeSettings} from './settings.mjs';
import {panelButton} from './panels.mjs';
import {
  defaultcolorscheme,
  loadcolorscheme,
  loadCSS,
  loadeditorfont
} from './common.mjs';
const upperpanelbuttons = byid("upperpanelbuttons");
const rightpanelbuttons = byid("rightpanelbuttons");
const defaultOrder = ['ogeurl', 'html', 'htm', 'pdf', 'txt'];

window.session = null;

function defaultIconFor(ext) {
  return {
    epub: 'install_mobile',
    htm: 'public',
    html: 'public',
    ogeurl: 'language',
    pdf: 'picture_as_pdf',
    txt: 'description'
  }?.[ext.toLowerCase()] ?? 'preview';
}

export default async function ogesetup(sessioninfo) {
  window.session = sessioninfo;

  loadCSS('oge.css');
  if ("colorscheme" in sessioninfo) {
    loadcolorscheme(sessioninfo.colorscheme);
  } else {
    loadcolorscheme(defaultcolorscheme());
  }
  if ("font" in sessioninfo) {
    loadeditorfont(sessioninfo.font)
  } else {
    loadeditorfont('JetBrains_Mono');
  }

  mergeSettings();

  window.actingRoot = function() {
    if (window?.ogesettings?.rootdocument) {
      return window.ogesettings.rootdocument;
    }
    if (window?.firstprocessedFile) {
      return window.firstprocessedFile;
    }
    return null;
  }

  window.openButton = panelButton(upperpanelbuttons, {
    open: {
      icon: "folder_open",
      classes: ["turnedon"],
      title: "close open files (esc)",
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeOpenFiles();
      }
    },
    closed: {
      icon: "folder_open",
      classes: ["ready"],
      title: "open files (ctrl-o)",
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        openOpenFiles();
      }
    }
  });
  window.openButton.setstate("closed");

  window.saveButton = panelButton(upperpanelbuttons, {
    changed: {
      icon: "save",
      classes: ["ready"],
      title: "save all files (ctrl-s)",
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (window.saveFiles) {
          window.saveFiles({all:true});
        }
      }
    },
    saving: {
      icon: "refresh",
      classes: ["busy"],
      title: "saving …",
      disabled: true,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    unchanged: {
      icon: "save",
      disabled: true,
      classes: ["inactive"],
      title: "no changes to save",
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    error: {
      icon: "save",
      classes: ["error"],
      title: "last save unsuccessful",
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (window.saveFiles) {
          window.saveFiles({all:true});
        }
      }
    }
  });
  window.saveButton.updateme = function() {
    if (this.currentstate == "error" || this.currentstate == "saving") {
      return;
    }
    let allsaved = true;
    for (const editortab of document.getElementsByClassName("ogetab")) {
      if (editortab.isSaved()) continue;
      allsaved = false;
      this.setstate("changed");
      break;
    }
    if (allsaved) this.setstate("unchanged");
  }
  window.saveButton.setstate("unchanged");

  window.outputChooseButton = panelButton(upperpanelbuttons, {
    normal: {
      icon: "preview",
      classes: ["ready"],
      title: "toggle output type (alt-o)",
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.nextext) this.nextext();
      }
    }
  });
  window.outputChooseButton.outputext = '_oge-default';
  window.outputChooseButton.extorder = [];
  window.outputChooseButton.nextext = function() {
    if (this.extorder.length < 1) return;
    const where = this.extorder.indexOf(this.outputext);
    if (where === -1 ) {
      this.applyext(this.extorder[0]);
      return;
    }
    this.applyext(this.extorder[
      (where == this.extorder.length - 1) ? 0 : (where + 1)
    ]);
    if (window.runProcess) window.runProcess();
  }
  window.outputChooseButton.applyext = function(ext) {
    const inputext = extensionOf(window.actingRoot());
    if (!inputext) return;
    const routines = window.ogesettings.routines ?? {};
    if (!routines?.[inputext]) return;
    const inroutines = routines[inputext];
    if (!inroutines?.[ext]) return;
    const routine = inroutines[ext];
    this.innerHTML = iconOf(routine?.icon ?? defaultIconFor(ext));
    this.title = `${ext} output (alt-o/click to change)`;
    this.outputext = ext;
  }
  window.outputChooseButton.updateOrder = function() {
    const inputext = extensionOf(window.actingRoot());
    if (!inputext) {
      this.classList.add('oge-hiddenbutton');
      return;
    }
    const routines = window.ogesettings.routines ?? {};
    if (!routines?.[inputext]) {
      this.classList.add('oge-hiddenbutton');
      return;
    }
    const inroutines = routines[inputext];
    this.extorder = Object.keys(inroutines)
      .filter((x) => (x != 'spellcheck' && x != 'defaultext'))
      .sort((a,b) => {
        if (a == inroutines?.defaultext && b != inroutines?.defaultext) {
          return -1;
        }
        if (b == inroutines?.defaultext && a != inroutines?.defaultext) {
          return 1;
        }
        if (defaultOrder.includes(a)) {
          if (!defaultOrder.includes(b)) return -1;
          return (defaultOrder.indexOf(a) - defaultOrder.indexOf(b));
        }
        if (defaultOrder.includes(b)) return 1;
        return a.localeCompare(b);
      });
    if (!this.extorder.includes(this.outputext) &&
       this.extorder.length > 0) {
      this.applyext(this.extorder[0])
    }
    if (this.extorder.length < 2) {
      this.classList.add('oge-hiddenbutton');
      return;
    }
    this.classList.remove('oge-hiddenbutton');
  }
  window.outputChooseButton.setstate("normal");
  window.outputChooseButton.updateOrder();

  window.processButton = panelButton(upperpanelbuttons, {
    normal: {
      icon: "play_arrow",
      classes: ["ready"],
      title: "start processing (alt-s)",
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (window.runProcess) {
          window.runProcess();
        }
      }
    },
    processing: {
      icon: "refresh",
      classes: ["busy"],
      title: "processing …",
      disabled: true,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    error: {
      icon: "play_arrow",
      classes: ["error"],
      title: "last process unsuccessful",
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (window.runProcess) {
          window.runProcess();
        }
      }
    },
    disabled: {
      icon: "play_arrow",
      classes: ["disabled", "turnedoff"],
      title: 'save in progress',
      disabled: true,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  });
  window.processButton.setstate("normal");

  window.autoProcessButton = panelButton(upperpanelbuttons, {
    on: {
      icon: "autoplay",
      title: "stop auto-processing (alt-a)",
      classes: ["turnedon"],
      disabed: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (window?.toggleAutoProcessing)
          window.toggleAutoProcessing();
      }
    },
    off: {
      icon: "autoplay",
      title: "start auto-processing (alt-a)",
      classes: ["turnedoff"],
      disabed: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (window?.toggleAutoProcessing)
          window.toggleAutoProcessing();
      }
    }
  });
  window.autoProcessButton.setstate("off");

  window.previewButton = panelButton(upperpanelbuttons, {
    active: {
      icon: "visibility",
      title: "close preview (alt-p)",
      classes: ["turnedon"],
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (window.togglePreview) {
          window.togglePreview();
        }
      }
    },
    inactive: {
      icon: "visibility_off",
      title: "open preview (alt-p)",
      classes: ["turnedoff"],
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (window.togglePreview) {
          window.togglePreview();
        }
      }
    }
  });
  window.previewButton.setstate("inactive");

  window.speakButton = panelButton(rightpanelbuttons, {
    active: {
      icon: "pause_circle",
      title: "stop reading (ctrl-alt-a)",
      classes: ["turnedon"],
      disabled: false,
      onclick: function(e) {
        if (window?.speakButton) {
          window.speakButton.stopClicked = Date.now();
        }
        e?.preventDefault?.();
        e?.stopPropagation?.();
        stopReadAloud();
      }
    },
    inactive: {
      icon: "campaign",
      title: "read aloud (ctrl-alt-a)",
      classes: ["turnedoff"],
      disabled: false,
      onclick: function(e) {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        if (window?.speakButton?.pseudoPlaying) {
          window.speakButton.stopClicked = Date.now();
          stopReadAloud();
          return;
        }
        window.speakButton.startClicked = Date.now();
        startReadAloud();
      }
    },
    error: {
      icon: "campaign",
      title: "error with tts",
      classes: ["error"],
      disabled: false,
      onclick: function(e) {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        if (window?.speakButton?.pseudoPlaying) {
          window.speakButton.stopClicked = Date.now();
          stopReadAloud();
          return;
        }
        window.speakButton.startClicked = Date.now();
        startReadAloud();
      }
    }
  });
  window.speakButton.setstate("inactive");
  window.speakButton.pseudoPlaying = false;
  window.speakButton.stopClicked = 0;
  window.speakButton.startClicked = 0;

  window.settingsButton = panelButton(rightpanelbuttons, {
    open: {
      icon: "settings",
      classes: ["turnedon"],
      title: "close settings (esc)",
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeSettings();
      }
    },
    closed: {
      icon: "settings",
      classes: ["ready"],
      title: "open settings (ctrl-p)",
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        openSettings();
      }
    }
  });
  window.settingsButton.setstate("closed");

  // basic properties of popins
  const leftpopin = byid('leftpopin');
  leftpopin.addEventListener('close', function() {
    window?.openButton?.setstate("closed");
  });
  const rightpopin = byid('rightpopin');
  rightpopin.addEventListener('close', function() {
    if (rightpopin?.reportSettings) {
      rightpopin.reportSettings();
    }
    window?.settingsButton?.setstate("closed");
  });

  // open initial tabs
  const tabStartUp = await openTabsFor({
    files: sessioninfo.files
  });

  // fetch bibliographies if need be
  const bibs = window?.ogesettings?.bibliographies;
  if (bibs && bibs.length > 0) {
    const respdata = await jsonRequest({
      reqtype: 'bibcompletions'
    });
    if (respdata?.completions) {
      window.bibcompletions = respdata.completions;
    }
  }

  const loadingdiv = byid('ogestartloading');
  loadingdiv.parentNode.removeChild(loadingdiv);

  // set to give prompt if unsaved documents
  window.onbeforeunload = function(e) {
    if (document.title.includes('[+]')) {
      e.preventDefault();
      return 'You have unsaved changes.';
    }
    if (window?.ogePreviewWindow) {
      window.ogePreviewWindow.close();
    }
    window.close();
  }

  setupAutosave();

  // TODO: make this general
  // set key listeners to body element
  document.body.onkeydown = function(e) {
    if (e.key == 'o' && e.ctrlKey) {
      e.preventDefault();
      const leftpopin = byid('leftpopin');
      if (leftpopin.hasAttribute('open')) {
        leftpopin.close();
        return;
      }
      if (window?.openOpenFiles) {
        window.openOpenFiles();
      }
    }
  }

}

