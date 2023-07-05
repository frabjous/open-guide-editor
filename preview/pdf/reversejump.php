<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////////////// reversejump.php ////////////////////////////////////
// determines from where clicked in the PDF what line in edited document //
// corresponds to it                                                     //
///////////////////////////////////////////////////////////////////////////

session_start();

// change directory to be consistent in requiring
chdir('../..');
require_once 'open-guide-misc/send-as-json.php';
require_once 'php/libauthentication.php';

//read posted json
$json = file_get_contents('php://input') ?? false;
if ($json === false) {
    rage_quit(new StdClass(), 'JSON not posted.',400);
}
$data = json_decode($json) ?? false;
if ($data === false) {
    rage_quit(new StdClass(), 'Could not parse posted JSON.',400);
}

//populate options and key variables
$opts = new StdClass();
$accesskey = $data->accesskey ?? false;
$rootfile = $data->rootfile ?? false;
$opts->rootdocument = $rootfile;
$filename = $data->filename ?? false;
$opts->savedfile = $filename;
$outputfile = $data->outputfile ?? false;
$opts->outputfile = $outputfile;
$linenum = $data->linenum ?? false;
$xperc = $data->xperc;
$yperc = $data->yperc;
$page = $data->page;
$opts->page = $page;

// check access key
$keydata = data_for_key($accesskey);
if (!$keydata) {
    rage_quit(new StdClass(), 'nothing found for access key',403);
    exit();
}

// get settings for project
$settings = merge_projectsettings(dirname($filename));

// determine extensions and routine commands
$rootextension = pathinfo($rootfile, PATHINFO_EXTENSION);
$outputextension = pathinfo($outputfile, PATHINFO_EXTENSION);

if (!isset($settings->routines->{$rootextension}->{$outputextension}->reversejump)) {
    rage_quit(new StdClass(), 'No reverse jump command set for routine.');
}
if (!isset($settings->routines->{$rootextension}->{$outputextension}->getpagedimensions)) {
    rage_quit(new StdClass(), 'No page dimensions command set for routine.');
}
// make routine consistent with libprocessing
$opts->routine = new StdClass();
$opts->routine->command =
    $settings->routines->{$rootextension}->{$outputextension}->getpagedimensions;
$opts->routine->postprocess =
    $settings->routines->{$rootextension}->{$outputextension}->reversejump;

// load libraries needed for processing
require_once('php/libprocessing.php');
require_once('open-guide-misc/pipe.php');

// determine page dimensions
$dcmd = fill_processing_variables($opts);

$page_dimen_result = pipe_to_command($dcmd);

$dimens = explode(PHP_EOL,trim($page_dimen_result->stdout));

if (count($dimens) < 2) {
    rage_quit(new StdClss(), 'Unable to read page dimensions.');
}

$width = floatval($dimens[0]);
$height = floatval($dimens[1]);

// determine place on page clicked by calculating percentage of
// page dimensions
$opts->x = ($width * $xperc);
$opts->y = ($height * $yperc);

// determine command for determining line to jump to
$jcmd = fill_processing_variables($opts, true);

// run the command
$jumpresult = pipe_to_command($jcmd);

// initiate return value
$rv = new StdClass();

// read result to determine input file and line number
$outlines = explode(PHP_EOL, trim($jumpresult->stdout));

$jumpfile = '';
$line = '';

foreach($outlines as $outline) {
    if (substr($outline,0,6) == 'Input:') {
        $jumpfile = trim(substr($outline,6));
    }
    if (substr($outline,0,5) == 'Line:') {
        $line = trim(substr($outline,5));
    }
}

// change to integer
$line = intval($line) ?? -1;
$jumpfile = realpath($jumpfile);

// populate return json
$rv->line = $line;
$rv->jumpfile = $jumpfile;
$rv->getpagedimensionscommand = $dcmd;
$rv->reversejumpcommand = $jcmd;
$rv->stdout = $jumpresult->stdout;
$rv->stderr = $jumpresult->stderr;

// send result
send_as_json($rv);
exit(0);
