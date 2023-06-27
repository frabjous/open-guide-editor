<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see 
// https://www.gnu.org/licenses/.

session_start();
chdir('..');
require_once 'open-guide-misc/send-as-json.php';
require_once 'php/libauthentication.php';

// read and verify posted information
$json = file_get_contents('php://input') ?? false;
if ($json === false) {
    rage_quit(new StdClass(), 'JSON not posted.',400);
}
$data = json_decode($json) ?? false;
if ($data === false) {
    rage_quit(new StdClass(), 'Could not parse posted JSON.',400);
}
$required = array('dirname', 'basename', 'buffer', 'opts');
foreach($required as $req) {
    if (!isset($data->{$req})) {
        rage_quit(new StdClass(), 'Required part of data not provided.');
    }
}
// initiate key variables
$rv = new StdClass();
$dirname = $data->dirname;
$basename = $data->basename;
$buffer = $data->buffer;
$opts = $data->opts;
$filename = $dirname . '/' . $basename;
$settings = merge_projectsettings($dirname);

if (!has_authentication($filename)) {
    rage_quit(new StdClass(), "user does not have authentication to " .
        "edit the file in quesiton");
}

error_log(json_encode($settings));
// check if autosave request
if (isset($opts->autosave) && $opts->autosave) {
    if (!isset($settings->autosave->directory)) {
        rage_quit(new StdClass(), "autosaving without an autosave folder in settings");
    }
    $filename = $settings->autosave->directory . '/' .
        str_replace('/','⊃',$filename);
}

// make sure destination folder exists
if (!is_dir(dirname($filename))) {
    mkdir(dirname($filename), 0755, true);
}
// actually save the file
$putresult = file_put_contents($filename, $buffer);
if ($putresult === false) {
    rage_quit(new StdClass(), 'Saving of file failed.');
}
$rv->savesuccess = true;
send_as_json($rv);
exit(0);
