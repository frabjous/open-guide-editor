<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see 
// https://www.gnu.org/licenses/.

/////////////////// getfilecontents.php ///////////////////////////
// responds to fetch request for the contents of a file          //
///////////////////////////////////////////////////////////////////

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
    rage_quit(new StdClass(), 'Could not parse posted JSON.', 400);
}
$required = array('dirname', 'basename');
foreach($required as $req) {
    if (!isset($data->{$req})) {
        rage_quit(new StdClass(), 'Required part of data not provided.');
    }
}
// initiate key variables
$rv = new StdClass();
$dirname = $data->dirname;
$basename = $data->basename;
$filename = $dirname . '/' . $basename;

// ensure user has the proper authentication
if (!has_authentication($filename)) {
    rage_quit($rv, "user does not have authentication to " .
        "edit the file in quesiton");
}

// ensure file exists and is in fact a file
if (!file_exists($filename)) {
    rage_quit($rv, "file does not exist");
}

if (is_dir($file)) {
    rage_quit($rv, 'cannot read a directory');
}

// read file, set new directory and basename for editor
$rv->filecontents = file_get_contents($filename);

$realpath = realpath($filename);
$rv->newdir = dirname($realpath);
$rv->newfn = basename($realpath);

send_as_json($rv);
exit(0);
