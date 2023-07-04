<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see 
// https://www.gnu.org/licenses/.

//////////////////////// gitcommit.php  /////////////////////////////////////
// responds to request from editor to make a commit in the file's git repo //
/////////////////////////////////////////////////////////////////////////////

session_start();

// go to parent folder for consistency in library locations
chdir('..');

// load library
require_once 'open-guide-misc/send-as-json.php';
require_once 'php/libauthentication.php';
require_once 'open-guide-misc/pipe.php';

// read and verify posted information
$json = file_get_contents('php://input') ?? false;
if ($json === false) {
    rage_quit(new StdClass(), 'JSON not posted.',400);
}
$data = json_decode($json) ?? false;
if ($data === false) {
    rage_quit(new StdClass(), 'Could not parse posted JSON.',400);
}
$required = array('msg', 'opts', 'accesskey', 'rootdocument', 'dirname');
foreach($required as $req) {
    if (!isset($data->{$req})) {
        rage_quit(new StdClass(), 'required part of data not provided.');
    }
}
// initiate key variables
$dirname = $data->dirname ?? '';
$rootdoc = $data->rootdocument ?? '';
$opts = $data->opts;
$msg = $data->msg;
$accesskey = $data->accesskey ?? '';
$keydata = data_for_key($accesskey);
if (!$keydata) {
    rage_quit(new StdClass(), "valid access key not provided");
}
$settings = merge_projectsettings($dirname);
$fullroot = full_document_root($dirname, $rootdoc);
$rdirname = dirname($fullroot);

// ensure user has authentication
//
if (!has_authentication($rdirname)) {
    rage_quit(new StdClass(), "user does not have authentication to " .
        "edit the directory in quesiton");
}

// go into folder of root document
chdir($rdirname);

// initiate return value
$rv = new StdClass();
// do commit
$cmd = 'git add . && git commit -m "' . $msg . '"';
$rv->cmdrun = $cmd;
$rv->result = pipe_to_command($cmd,'');

// set whether or not there was an error
if ($rv->result->returnvalue == 0) {
    $rv->error = false;
} else {
    // could have failed because nothing to commit
    if (strpos($rv->result->stdout,'working tree clean') !== false) {
        $rv->nothingtocommit = true;
        $rv->error = false;
    } else {
        $rv->error = true;
        $rv->errMsg = $rv->result->stderr;
    }
}
send_as_json($rv);
exit(0);
