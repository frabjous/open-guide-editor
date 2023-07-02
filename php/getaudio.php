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

if (!isset($_GET["accesskey"])) {
    header("HTTP/1.1 403 Forbidden");
    exit;
}
