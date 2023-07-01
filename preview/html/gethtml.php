<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////////////// gethtml.php ////////////////////////////////////
// gets an html file on the system if authenticated and outputs it   //
///////////////////////////////////////////////////////////////////////

session_start();

chdir('../..');
require_once('php/libauthentication.php');

// read filename
$filename = $_GET["file"] ?? false;

// downloadmode is off by default; can be turned on with almost
// anything
$downloadmode = false;
if (isset($_GET["download"])) {
    $downloadparam = $_GET["download"];
    if ($downloadparam != "off" && $downloadparam != "no" &&
        $downloadparam != "false") {
        $downloadmode = true;
    }
}

// ensure file exists
if (!$filename || !file_exists($filename)) {
    header('Location: ../../meinongian-page.html');
    exit(0);
}

// check if authenticated
if (!has_authentication($filename)) {
    header("HTTP/1.1 403 Forbidden");
    exit;
}

// defines the servelet_send command
require_once 'open-guide-misc/libservelet.php';

servelet_send(array(
    "download" => $downloadmode,
    "filename" => $filename,
    "mimetype" => "text/html"
));

// output the file
readfile($filename);
exit(0);
