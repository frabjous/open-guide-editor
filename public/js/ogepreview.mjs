// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: ogepreview.mjs
// Sets up the preview page and defines its functions

import {
  defaultcolorscheme,
  loadcolorscheme,
  loadCSS
} from './common.mjs';
import {
  addelem,
  byid,
  extensionOf,
  htmlesc,
  iconOf
} from './misc.mjs';
import {panelButton} from './panels.mjs';
import {mergeSettings} from './settings.mjs';
import downloadFile from './downloadFile.mjs';

let colorscheme = null;
window.loadcolorscheme = loadcolorscheme;
const upperpanelbuttons = byid('upperpanelbuttons');
const rightpanelbuttons = byid('rightpanelbuttons');
const preview = byid('preview');
const toppanel = byid('toppanel');

window.pdfpage = 1;
window.pdfnumpages = -1;

const previewtypeMapping = {
  'url': ['ogeurl'],
  'webfile': [
    'apng',
    'avif',
    'flac',
    'gif',
    'jpeg',
    'jpg',
    'json',
    'htm',
    'html',
    'm4a',
    'm4v',
    'mp3',
    'mp4',
    'ogg',
    'ogv',
    'png',
    'rss',
    'webm',
    'webp',
    'svg',
    'txt',
    'xhtml',
    'xml'
  ],
  'pdf': ['pdf']
}

function downloadPreview() {
  if (!window.nowShowing) return;
  const basename = window.nowShowing.split('/').reverse()[0];
  let encodedfn = window.nowShowing.split('/').map((p) => encodeURIComponent(p))
    .join('/');
  const url = '/ogedownload/' + (window?.opener?.session?.sessionid ?? '') +
    '/' + encodedfn;
  downloadFile(url, basename);
}

function imgJump(e) {
  e.preventDefault();
  e.stopPropagation();
  const x = e.layerX;
  const y = e.layerY;
  const w = e.target.clientWidth;
  const h = e.target.clientHeight;
  const xperc = x/w;
  const yperc = y/h;
  window.opener.reverseJump({
    outputfile: window.nowShowing,
    page: window.pdfpage,
    xperc,
    yperc
  });
}

window.jumpTo = function(page) {
  if (page < 1) page = 1;
  if (page > this.pdfnumpages) page = this.pdfnumpages;
  this.pdfpage = page;
  preview.updateme();
  const container = byid('previewoutercontainer');
  container.scrollTo(0, 0);
}

function newPreview(ext, fn) {
  const prevtype = previewTypeOf(ext);
  window.prevtype = prevtype;
  preview.innerHTML = '';
  preview.classList.remove(...preview.classList);
  preview.classList.add(prevtype);
  toppanel.classList.remove(...toppanel.classList);
  toppanel.classList.add(prevtype);
  byid('filenamedisplay').innerHTML = htmlesc(fn);
  window.nowShowing = fn;
  return previewCreator[prevtype](fn);
}

export function ogepreviewsetup() {
  loadCSS('preview.css');
  if (window?.opener?.colorschemename) {
    loadcolorscheme(window.opener.colorschemename);
  } else {
    loadcolorscheme(defaultcolorscheme());
  }

  window.prevpageButton = panelButton(upperpanelbuttons, {
    normal: {
      icon: 'arrow_back',
      title: 'previous page',
      classes: ['ready', 'pdf-button'],
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.pdfpage = window.pdfpage - 1;
        if (window.pdfpage < 1) window.pdfpage = 1;
        preview?.updateme();
      }
    },
    disabled: {
      icon: 'arrow_back',
      title: '',
      classes: ['disabled','pdf-button'],
      disabled: true,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  });
  window.prevpageButton.setstate('disabled');

  window.nextpageButton = panelButton(upperpanelbuttons, {
    normal: {
      icon: 'arrow_forward',
      title: 'next page',
      classes: ['ready', 'pdf-button'],
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.pdfpage = window.pdfpage + 1;
        if (window.pdfpage > window.pdfnumpages) {
          window.pdfpage = window.pdfnumpages;
        }
        preview?.updateme();
      }
    },
    disabled: {
      icon: 'arrow_forward',
      title: '',
      classes: ['disabled','pdf-button'],
      disabled: true,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  });
  window.nextpageButton.setstate('disabled');

  window.zoomoutButton = panelButton(upperpanelbuttons, {
    normal: {
      icon: 'zoom_out',
      title: 'zoom out',
      classes: ['ready', 'pdf-button'],
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        zoomChange(-10, false);
      }
    }
  });
  window.zoomoutButton.setstate("normal");

  window.zoomresetButton = panelButton(upperpanelbuttons, {
    normal: {
      icon: 'fit_width',
      title: 'reset zoom',
      classes: ['ready', 'pdf-button'],
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        zoomChange(0, true);
      }
    }
  });
  window.zoomresetButton.setstate("normal");

  window.zoominButton = panelButton(upperpanelbuttons, {
    normal: {
      icon: 'zoom_in',
      title: 'zoom in',
      classes: ['ready', 'pdf-button'],
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        zoomChange(10, false);
      }
    }
  });
  window.zoominButton.setstate("normal");

  window.downloadButton = panelButton(upperpanelbuttons, {
    normal: {
      icon: 'download',
      classes: ['ready','download-button'],
      title: 'download previewed file',
      disabled: false,
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        downloadPreview();
      }
    }
  });
  window.downloadButton.setstate('normal');

  window.pageIndicator = addelem({
    tag: "span",
    parent: rightpanelbuttons,
    classes: ["pdf-button", "pagenumindicator"]
  });
  window.pageSlider = addelem({
    tag: "input",
    type: "range",
    parent: rightpanelbuttons,
    classes: ["pdf-button", "pageslider"],
    min: '1',
    onchange: function(e) {
      e.stopPropagation();
      window.pdfpage = parseInt(this.value);
      if (window.pdfpage < 1) window.pdfpage = 1;
      if (window.pdfpage > window.pdfnumpages) {
        window.pdfpage = window.pdfnumpages;
      }
     preview?.updateme();
    }
  })
  window.updatePage = function() {
    this.pageIndicator.innerHTML = 'PAGE: ' +
      `${window.pdfpage.toString()} / ${window.pdfnumpages.toString()}`;
    this.pageSlider.max = window.pdfnumpages.toString();
    this.pageSlider.value = window.pdfpage.toString();
    this.prevpageButton.setstate(
      (this.pdfpage == 1) ? 'disabled' : 'normal'
    );
    this.nextpageButton.setstate(
      (this.pdfpage >= this.pdfnumpages) ? 'disabled' : 'normal'
    );
  }

  // inform editor of close
  window.onbeforeunload = function(e) {
    window.opener.closePreview(true);
  }

  const loadingdiv = byid('ogestartloading');
  loadingdiv.parentNode.removeChild(loadingdiv);
  preview.innerHTML = 'Loading preview.';

  // tell other window we are open
  window.opener.previewButton.setstate('active');

  updateOGEPreview();

  window.opener.ogePreviewWindow = window;
}

const previewCreator = {

  ogedownloadonly: function(fn) {
    const bn = fn.split('/').reverse()[0];
    const dldiv = addelem({
      tag: 'div',
      parent: preview
    });
    const upperp = addelem({
      tag: 'p',
      parent: dldiv,
      innerHTML: 'OGE cannot preview this type of file.'
    });
    const linkp = addelem({
      tag: 'p',
      parent: dldiv,
      classes: ['oge-dllink'],
      innerHTML: iconOf('download') + ' <span>Download ' + htmlesc(fn) +
        '</span>',
      title: 'Download ' + htmlesc(fn),
      onclick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        downloadPreview();
      }
    });
    const updatep = addelem({
      tag: 'p',
      parent: dldiv,
      classes: ['lastupdated']
    });
    preview.updateme = () => {
      updatep.innerHTML = 'last updated ' + (new Date()).toLocaleString();
    }
    preview.updateme();
  },

  pdf: function(fn) {
    window.pdfpage = 1;
    window.pdfzoom = 100;
    const previewext = window?.opener?.ogesettings?.viewer
      ?.pdf?.convertextension ?? 'svg';
    window.imgholder = addelem({
      parent: preview,
      tag: 'div',
      id: 'pdfimageholder'
    });
    const img = addelem({
      parent: window.imgholder,
      alt: 'PDF page image',
      tag: 'img',
      classes: ['pdfpage']
    });
    preview.updateme = () => {
      let encodedfn = fn.split('/').map((p) => encodeURIComponent(p))
        .join('/');
      img.src = '/ogepdfpage/' + window.pdfpage.toString() +
        '/' + Date.now().toString() + '/' +
        (window?.opener?.session?.sessionid ?? 'none') + '/' +
        encodedfn + '.' + previewext;
      img.ondblclick = imgJump;
      window.updatePage();
    }
    preview.updateme();
  },

  url: function(fn) {
    const iframe = addelem({
      tag: 'iframe',
      parent: preview,
      src: fn
    });
    preview.updateme = () => {
      iframe.src = fn;
    }
    preview.updateme();
  },

  webfile: function(fn) {
    let encodedfn = fn.split('/').map((p) => encodeURIComponent(p))
          .join('/');
    const url = '/ogepreviewfile/' + window.opener.session.sessionid +
      '/' + encodedfn;
    const iframe = addelem({
      tag: 'iframe',
      parent: preview,
      src: url
    });
    preview.updateme = () => {
      iframe.contentWindow.location.reload()
    }

    preview.updateme();
  }

}

function previewTypeOf(ext) {
  for (const prevtype in previewtypeMapping) {
    const exts = previewtypeMapping[prevtype];
    if (exts.includes(ext)) {
      return prevtype;
    }
  }
  return 'ogedownloadonly';
}

function updateOGEPreview() {
  const actingroot = window.opener.actingRoot();
  // run process in browser if nothing now to show
  if (!actingroot) {
    window.opener.runProcess();
    return;
  }
  const inputext = extensionOf(actingroot);
  let outputext = window?.opener?.outputChooseButton?.outputext;
  if (!outputext) {
    outputext = window?.opener?.ogesettings?.routines?.[inputext]?.defaultext;
  }
  if (!outputext) {
    preview.innerHTML = 'Error. Could not determine what to preview.';
    return;
  }
  if (outputext == 'pdf' && window.pdfnumpages == -1) {
    const openerpages = window?.opener?.pdfnumpages;
    if (openerpages && !isNaN(openerpages)) {
      window.pdfnumpages = openerpages;
    }
    // if cannot determine number of pages, better run process instead
    if (window.pdfnumpages == -1) {
      window.opener.runProcess();
      return;
    }
  }
  const routine = window?.opener?.ogesettings?.routines?.[inputext]?.[outputext];
  if (!routine) {
    preview.innerHTML = 'Error. Could not determine current routine.'
  }
  let outputfile = routine?.outputfile;
  if (!outputfile && outputext == 'ogeurl' && routine?.url) {
    outputfile = routine.url;
  }
  if (!outputfile) {
    outputfile = actingroot.substring(0, actingroot.length - inputext.length)
      + outputext;
  }
  if (outputfile == window?.nowShowing) {
    if (preview.updateme) preview.updateme();
    return;
  }
  window?.opener?.alltabs?.classList?.[
    (routine?.forwardjump) ? 'add' : 'remove']?.('jumpable');
  newPreview(outputext, outputfile);
}

window.updateOGEPreview = updateOGEPreview;

function zoomChange(amt, reset) {
  if (!window.imgholder) return;
  if (!reset) {
    if (window.pdfzoom <= 10 && (amt < 0)) { return;}
    if (window.pdfzoom > 120) { amt = amt * 4};
    if (window.pdfzoom > 250) { amt = amt * 10};
    window.pdfzoom = window.pdfzoom + amt;
  } else {
      window.pdfzoom = 100;
  }
  window.imgholder.style.width = window.pdfzoom.toString() + '%';
}

window.addEventListener('keydown', function(e) {
  const container = byid('previewoutercontainer');
  if (this.prevtype !== 'pdf') return;
  if (e.key == 'PageDown') {
    if (this.pdfpage == this.pdfnumpages) return;
    e.preventDefault();
    e.stopPropagation();
    this.pdfpage = this.pdfpage + 1;
    preview.updateme();
    return;
  }
  if (e.key == 'PageUp') {
    if (this.pdfpage == 1) return;
    this.pdfpage = this.pdfpage -1;
    e.preventDefault();
    e.stopPropagation();
    preview.updateme();
    return;
  }
  if (e.key == 'Home') {
    if (this.pdfpage == 1) return;
    this.pdfpage = 1;
    e.preventDefault();
    e.stopPropagation();
    preview.updateme();
    container.scrollTo(0, 0);
    return;
  }
  if (e.key == 'End') {
    if (this.pdfpage == this.pdfnumpages) return;
    this.pdfpage = this.pdfnumpages;
    e.preventDefault();
    e.stopPropagation();
    preview.updateme();
    container.scrollTo(0, container.scrollHeight);
    return;
  }

  if (e.key == '+'|| e.key == '=') {
    e.preventDefault();
    e.stopPropagation();
    zoomChange(10, false);
    return;
  }
  if (e.key == '-') {
    e.preventDefault();
    e.stopPropagation();
    zoomChange(-10, false);
    return;
  }
  if (e.key == '0') {
    e.preventDefault();
    e.stopPropagation();
    zoomChange(0, true);
    return;
  }
  if (e.key == 'ArrowUp') {
    e.preventDefault();
    e.stopPropagation();
    container.scrollTop =
      (container.scrollTop - 50);
    return;
  }
  if (e.key == 'ArrowDown') {
    e.preventDefault();
    e.stopPropagation();
    container.scrollTop =
      (container.scrollTop + 50);
    return;
  }
  if (e.key == 'ArrowRight') {
    e.preventDefault();
    e.stopPropagation();
    container.scrollLeft =
      (container.scrollLeft + 50);
    return;
  }
  if (e.key == 'ArrowLeft') {
    e.preventDefault();
    e.stopPropagation();
    container.scrollLeft =
      (container.scrollLeft - 50);
    return;
  }

});

