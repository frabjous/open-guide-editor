// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

///////////////////////// preview/pdf/keys.mjs /////////////////////////
// keybindings for the preview window in pdf mode                     //
////////////////////////////////////////////////////////////////////////

// e.ctrlKey, metaKey, shiftKey, capsLock

document.body.addEventListener('keydown', function(e) {
    console.log(e.key,
        e.ctrlKey,
        e.metaKey,
        e.shiftKey,
        e.getModifierState('CapsLock'));
    //pageup, pagedown changes pages
    if (e.key == 'PageDown') {
        e.preventDefault();
        window.nextPage();
        return;
    }
    if (e.key == 'PageUp') {
        e.preventDefault();
        window.previousPage();
        return;
    }
    // arrow up, down, etc. scrolls
    if (e.key == 'ArrowUp') {
        e.preventDefault();
        window.viewerparent.scrollTop =
            (window.viewerparent.scrollTop - 50);
    }
    if (e.key == 'ArrowDown') {
        e.preventDefault();
        window.viewerparent.scrollTop =
            (window.viewerparent.scrollTop + 50);
    }
    if (e.key == 'ArrowRight') {
        e.preventDefault();
        window.viewerparent.scrollLeft =
            (window.viewerparent.scrollTop + 50);
    }
    if (e.key == 'ArrowLeft') {
        e.preventDefault();
        window.viewerparent.scrollLeft =
            (window.viewerparent.scrollTop - 50);
    }
    console.log('sh', window.viewerparent.scrollHeight, window.viewerparent.scrollWidth);
    console.log('oh', window.viewerparent.offsetHeight, window.viewerparent.offsetWidth);
    console.log('ch', window.viewerparent.clientHeight, window.viewerparent.clientWidth);
    console.log('stsl', window.viewerparent.scrollTop, window.viewerparent.scrollLeft);
});
