<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////////////// forwardjump.php ////////////////////////////////////
// determines from the line number what page to go to in the PDF         //
///////////////////////////////////////////////////////////////////////////

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

$opts = new StdClass();
//populate opts
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

$keydata = data_for_key($accesskey);
if (!$keydata) {
    rage_quit(new StdClass(), 'nothing found for access key',403);
    exit();
}

$settings = merge_projectsettings(dirname($filename));

$rootextension = pathinfo($rootfile, PATHINFO_EXTENSION);
$outputextension = pathinfo($outputfile, PATHINFO_EXTENSION);

if (!isset($settings->routines->{$rootextension}->{$outputextension}->reversejump)) {
    rage_quit(new StdClass(), 'No reverse jump command set for routine.');
}
if (!isset($settings->routines->{$rootextension}->{$outputextension}->getpagedimensions)) {
    rage_quit(new StdClass(), 'No page dimensions command set for routine.');
}
$opts->routine = new StdClass();
$opts->routine->command =
    $settings->routines->{$rootextension}->{$outputextension}->getpagedimensions;
$opts->routine->postprocess =
    $settings->routines->{$rootextension}->{$outputextension}->reversejump;

require_once('php/libprocessing.php');
require_once('open-guide-misc/pipe.php');

$dcmd = fill_processing_variables($opts);

$page_dimen_result = pipe_to_command($dcmd);

$dimens = explode("\n",trim($page_dimen_result->stdout));

if (count($dimens) < 2) {
    rage_quit(new StdClss(), 'Unable to read page dimensions.');
}

$width = floatval($dimens[0]);
$height = floatval($dimens[1]);

$opts->x = ($width * $xperc);
$opts->y = ($height * $yperc);

$jcmd = fill_processing_variables($opts, true);

$jumpresult = pipe_to_command($jcmd);

$rv = new StdClass();

$rv->line = $jumpresult->stdout;
$rv->getpagedimensionscommand = $dcmd;
$rv->reversejump = $jcmd;
$rv->stdout = $result->stdout;
$rv->stderr = $result->stderr;

send_as_json($rv);
exit(0);
