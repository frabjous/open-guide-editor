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
$opts->routine = new StdClass();
$opts->routine->command =
    $settings->routines->{$rootextension}->{$outputextension}->forwardjump;

require_once('php/libprocessing.php');
require_once('open-guide-misc/pipe.php');

$cmd = fill_processing_variables($opts);

$result = pipe_to_command($cmd);

$page = trim($result->stdout);

if ($page == '') { $page = '-1'; };

$page = intval($page);

$rv = new StdClass();

$rv->page = $page;
$rv->command = $cmd;
$rv->stdout = $result->stdout;
$rv->stderr = $result->stderr;

send_as_json($rv);
exit(0);
