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

// quit here if no processing to be done
if (!isset($opts->routine)) {
    send_as_json($rv);
    exit(0);
}

$rv->processResult = new StdClass();

if (!isset($opts->outputext)) {
    $rv->processResult->error = true;
    $rv->processResult->errMsg = 'no output extension given';
    send_as_json($rv);
    exit(0);
}

// put filename in opts
$opts->savedfile = $filename;

// take root document from opts if present
if (!isset($opts->rootdocument)) {
    $opts->rootdocument = $filename;
}

// determine input and put extension
$inext = pathinfo($opts->rootdocument, PATHINFO_EXTENSION);
$outext = $opts->outputext;

// determine the full path of the root document
$opts->fullroot = full_document_root($dirname, $opts->rootdocument);

// $determine the outputfile
$opts->outputfile = mb_ereg_replace($inext . '$', $outext, $opts->fullroot);

// allow overriding the output file in the settings
if (isset($opts->routine->outputfile)) {
    $opts->outputfile = $opts->routine->outputfile;
}

// load library
require 'php/libprocessing.php';

//TODO
