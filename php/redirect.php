<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////////////////// redirect.php //////////////////////////////////
// creates new access key for a file and redirects the user to editing  //
// that file with that key                                              //
//////////////////////////////////////////////////////////////////////////

session_start();
// move to parent directory for consistency with library locations
chdir('..');
require_once 'libauthentication.php';

$dirname = $_GET["dirname"] ?? false;
$basename = $_GET["basename"] ?? false;

// if directory or filename not set, redirect into aussersein
if ($dirname === false || $basename === false) {
    header('Location: ../meinongianpage.html');
    exit(0);
}

// create access key, which checks for authentication as well
$accesskey = new_access_key($dirname, $basename);

if ($accesskey === false) {
    header("HTTP/1.1 403 Forbidden");
    echo '<html><head><title>403 Forbidden</title></head><body><h1>Error 403 Forbidden</h1></body></html>';
    exit;
}

// redirect
header('Location: ../?accesskey=' . $accesskey);
exit(0);
