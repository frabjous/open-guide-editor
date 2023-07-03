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
require_once 'open-guide-misc/send-as-json.php';
require_once 'php/libauthentication.php';

$json = file_get_contents('php://input') ?? false;
if ($json === false) {
    rage_quit(new StdClass(), 'JSON not posted.',400);
}
$data = json_decode($json) ?? false;
if ($data === false) {
    rage_quit(new StdClass(), 'Could not parse posted JSON.',400);
}

let $opts = new StdClass();
//populate opts
$accesskey = $data->accesskey ?? false;
$rootfile = $data->rootfile ?? false;
$opts->rootdocument = $rootfile;
$filename = $data->filename ?? false;
$opts->savedfile = $filename;
$outputfile = $data->outputfile ?? false;
$opts->outputfile = $outputfile;
$linenum = $data->linenum ?? false;
$opts->line = $linenum;

$keydata = data_for_key($accesskey);
if (!$keydata) {
    rage_quit(new StdClass(), 'nothing found for access key',403);
    exit();
}

$settings = merge_projectsettings(dirname($filename));

$rootextension = pathinfo($rootfile, PATHINFO_EXTENSION);
$outputextension = pathinfo($outputfile, PATHINFO_EXTENSION);

if (!isset($settings->routines->{$rootextension}->{$outputextension}->forwardjump)) {
    rage_quit(new StdClass(), 'No forward jump routine set for routine.');
}
$cmd = 


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

// fill in the variables
$cmd = fill_processing_variables($opts, false);

$tsname = 'pdfpage-' . $opts->page . '-' . $ts . '.' .
    $convertextension;

servelet_send(array(
    "command" => $cmd,
    "filename" => $tsname,
    "mimetype" => $mimetype
));

exit(0);
