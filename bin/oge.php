#!/usr/bin/env php
<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////////////// bi//n/oge.php ///////////////////////////////////
// A script for launching the open guide editor from the command line //
////////////////////////////////////////////////////////////////////////

// ensure that we are in fact running from the command line and not
// via a server
if ((php_sapi_name() != 'cli') || isset($_SERVER["SERVER_PROTOCOL"])) {
    exit("ERROR. This script must be run from the command line.");
}

function showhelp() {
    global $argv;
    $exename = basename($argv[0]);
    echo <<<EOL
Usage:

{$exename} [options] filename1 [filename2 ...]

Options:

--browser (executable)   : specify the browser to use
                           (otherwise will read the \$BROWSER environmental
                            variable, or what is set in settings.json
                            falling back to "firefox")
--help                   : view this help
--host (domainname)      : specify a host domain other than "localhost"
                           (can include '/'s for subdirectories)
--port (NN)              : specify the port to look for the server
                           (otherwise will be 8181 or what is
                            set in settings.json)
--templates (directory)  : if this is set, filenames of files that don’t
                           exist already will be created according to
                           templates with names of the form "ext.template"
                           in the directory specified, e.g. "tex.template"
                           for LaTeX file

Default "browser", "host", "templates", and "port" can also be
set in your settings.json file in the open-guide-editor directory.
EOL;
}

// read the command line arguments
$arg_to_read = 1;

// initialize variables
$browser = '';
$host = '';
$filenames = [];
$port = 0;
$templatesdir = '';

while ($arg_to_read < count($argv)) {

    $argument = $argv[$arg_to_read];

    switch($argument) {

        case '--browser':
            if ($arg_to_read + 1 == count($argv)) {
                exit('No browser specified');
            }
            $browser = $argv[$arg_to_read + 1];
            $arg_to_read += 2;
            break;

        case '--port':
            if ($arg_to_read + 1 == count($argv)) {
                exit('No port specified');
            }

            $port = intval($argv[$arg_to_read + 1]);
            $arg_to_read += 2;
            break;
    
        case '-h';
        case '-?';
        case '--h';
        case '-help';
        case '--help':
            showhelp();
            exit(0);
            break;
        default:
            $arg_to_read++;
            break;
    }

}

// move to the main open-guide-editor folder, which should be the
// parent of where this script is
chdir(dirname(dirname(__FILE__)));
showhelp();
