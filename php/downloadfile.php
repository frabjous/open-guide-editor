<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see 
// https://www.gnu.org/licenses/.

/////////////////// downloadfile.php ////////////////////////////////
// sends the contents of a file specified by parameter if allowed  //
/////////////////////////////////////////////////////////////////////

session_start();
chdir('..');
require_once 'php/libauthentication.php';

// get filename
if (!isset($_GET["filename"])) {
    header('Location: meinongian-file.html');
    exit();
}
$filename = $_GET["filename"];

// ensure user has the proper authentication
if (!has_authentication($filename)) {
    header("HTTP/1.1 403 Forbidden");
    exit();
}

require_once('open-guide-misc/libservelet.php');

servelet_send(array(
    "download" => true,
    "filename" => $filename
));
exit(0);
