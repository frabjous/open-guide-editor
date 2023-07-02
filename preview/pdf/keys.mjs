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
    if (e.key == 'PageDown') {
        e.preventDefault();
        window.nextPage();
    }
    if (e.key == 'PageUp') {
        e.preventDefault();
        window.prevPage();
    }
});
