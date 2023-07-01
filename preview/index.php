<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

///////////////// preview/index.php /////////////////////////////////
// serves the page for the output preview of the file being edited //
/////////////////////////////////////////////////////////////////////

session_start();
// move to parent folder for easier access to the libraries
chdir('..');
require_once 'php/libauthentication.php';

// read access key
$accesskey = '';
if (isset($_GET["accesskey"])) {
    $accesskey = $_GET["accesskey"];
}

// only power users can access without key
if ($accesskey == '') {
    header("HTTP/1.1 403 Forbidden");
    exit;
}


