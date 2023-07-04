// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

/////////////////////// hightlight.mjs /////////////////////////////////
// Defines the highlight colors/styles for the open guide editor      //
// with its extensions, keymaps, settings, etc.                       //
////////////////////////////////////////////////////////////////////////

export default function getOgeStyle(HighlightStyle, tags) {
    return HighlightStyle.define([
        {tag: tags.keyword, color: "#fc6"},
        {tag: tags.comment, color: "#f5d", fontStyle: "italic"},
        {tag: tags.emphasis, color: "#f5d", fontStyle: "italic"},
        {tag: tags.strong, color: "#f5d", fontStyle: "italic"},
    ]);
}
