<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////////////// gethtml.php ////////////////////////////////////
// gets an html file on the system if authenticated and outputs it   //
///////////////////////////////////////////////////////////////////////

session_start();

// change directory to be consistent in requiring
chdir('../..');
require_once('php/libauthentication.php');

// read filename
$filename = $_GET["file"] ?? false;

// read page; default to 1
$page = $_GET["page"] ?? 1;

// read timestamp or make out
$ts = $_GET["ts"] ?? (time().toString());

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

// get conversion commands from settings

// defines the command for filling in variables in commands
require_once 'php/libprocessing.php';
// defines the servelet_send command
require_once 'open-guide-misc/libservelet.php';

servelet_send(array(
    "command" => ,
    "filename" => ,
    "mimetype" => ""
));

// output the file
readfile($filename);
exit(0);
