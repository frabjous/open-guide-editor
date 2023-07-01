<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

/////////////////// pipefilter.php //////////////////////////////////////
// responds to fetch request to filter part or all of a file through a //
// unix command acting as a stdin/stdout pipe                          //
/////////////////////////////////////////////////////////////////////////

session_start();
chdir('..');
require_once 'open-guide-misc/send-as-json.php';
require_once 'php/libauthentication.php';


// only power users can do this
if (!$poweruser) {
    rage_quit(new StdClass(), 'Only powerusers can use unix filters.');
}

// read and verify posted information
$json = file_get_contents('php://input') ?? false;
if ($json === false) {
    rage_quit(new StdClass(), 'JSON not posted.',400);
}
$data = json_decode($json) ?? false;
if ($data === false) {
    rage_quit(new StdClass(), 'Could not parse posted JSON.',400);
}
$required = array('selectedtext', 'to', 'from', 'cmd');
foreach($required as $req) {
    if (!isset($data->{$req})) {
        rage_quit(new StdClass(), 'Required part of data not provided.');
    }
}
// initiate key variables
$rv = new StdClass();
$topipe = $data->selectedtext;
$cmd = $data->cmd;

// load pipe command from misc
require_once 'open-guide-misc/pipe.php';

// run pipe command
$piperesult = pipe_to_command($cmd, $topipe);

if ($piperesult->returnvalue != 0) {
    rage_quit(new StdClass(), 'Pipe command resulted in error: ' .
        $piperesult->stderr);
}

// send result
$rv->replacement = $piperesult->stdout;
send_as_json($rv);
exit(0);
