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

$opts = new StdClass();

// read filenames
$opts->outputfile = $_GET["filename"] ?? false;
$filename = $opts->outputfile;
// probably not needed for anything, so no insistence
$opts->rootdocument = $_GET["rootfile"] ?? 'xxxx';
$opts->savedfile = $_GET["editedfile"] ?? 'yyyy';

// read page; default to 1
$opts->page = $_GET["page"] ?? 1;

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
if ($opts->savedfile != 'yyyy') {
    $settings = merge_projectsettings(dirname($opts->savedfile));
}
$opts->routine = new StdClass();
$opts->routine->command = '';
$mimetype = '';
$convertext = '';
if (isset($settings->viewer->pdf->convertcommand)) {
    $opts->routine->command = $settings->viewer->pdf->convertcommand;
    $convertextension = $settings->viewer->pdf->convertextension;
    $mimetype = $settings->viewer->pdf->convertmimetype;
}

if (($mimetype == '') || ($opts->routine->command == '') ||
    ($convertextension == '')) {
    header('Location: ../../meinongian-page.html');
    exit(0);
}

// defines the command for filling in variables in commands
require_once 'php/libprocessing.php';
// defines the servelet_send command
require_once 'open-guide-misc/libservelet.php';

error_log("here");

// fill in the variables
$cmd = fill_processing_variables($opts, false);

error_log("cmd is $cmd");

$tsname = 'pdfpage-' . $opts->page . '-' . $ts . '.' .
    $convertextension;

servelet_send(array(
    "command" => $cmd,
    "filename" => $tsname,
    "mimetype" => $mimetype
));

exit(0);
