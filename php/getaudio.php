<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////////////// getaudio.php //////////////////////////////////
// Sends an mp3 to standard out of desired text to read aloud       //
//////////////////////////////////////////////////////////////////////
session_start();
// go up a folder for consistency with library loading
chdir('..');
require_once 'php/libauthentication.php';

// get and verify the access key
if (!isset($_GET["accesskey"])) {
    header("HTTP/1.1 403 Forbidden");
    exit();
}
$accesskey = $_GET["accesskey"];

$keydata = data_for_key($accesskey);
if (!$keydata) {
    header("HTTP/1.1 403 Forbidden");
    exit();
}

$text = $_GET["text"] ?? 'nothing to play';
$ext = $_GET["ext"] ?? '';

// ensure we have a command set
if (!isset($settings->readaloud->{$ext}->command)) {
    header("HTTP/1.1 403 Forbidden");
    exit();
}
$cmd = $settings->readaloud->{$ext}->command;
$cmd = str_replace( '%text%', '"' . $text . '"', $cmd);

require_once('open-guide-misc/pipe.php');
$res = pipe_to_command($cmd, '');

/*
require_once 'open-guide-misc/stream.php';

// the opts should be an associative array with the following
// "attachmentname" => "nameoffilefordownload.txt", [optional],
// "command" => "command to output result of", [optional],
// "download" => <boolean>, [whether to send as download; optional],
// "filename" => "nameoffile.ext", [to send or use],
// "mimetype" => "something/mimetype", [optional if sending file],
servelet_send(array(
    "command" => $cmd,
    "filename" => microtime(true) . '.mp3',
    "mimetype" => "audio/mpeg"
));*/

require_once('open-guide-misc/stream.php');

stream('/tmp/oge-audio.mp3');
exit();
