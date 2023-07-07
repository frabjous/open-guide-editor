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

// initialize variables
$browser = '';
$host = '';
$filenames = [];
$port = 0;
$templatesdir = '';

// read the command line arguments
$arg_to_read = 1;
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

        case '--host':
            if ($arg_to_read + 1 == count($argv)) {
                exit('No host specified');
            }
            $host = $argv[$arg_to_read + 1];
            $arg_to_read += 2;
            break;

        case '--port':
            if ($arg_to_read + 1 == count($argv)) {
                exit('No port specified');
            }

            $port = intval($argv[$arg_to_read + 1]);
            $arg_to_read += 2;
            break;

        case '--templates':
            if ($arg_to_read + 1 == count($argv)) {
                exit('No template directory specified');
            }
            $templatesdir = $argv[$arg_to_read + 1];
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
            array_push($filenames, $argument);
            $arg_to_read++;
            break;
    }
}

// canonicalize the filenames
$cwd = getcwd();
$filenames = array_values(array_map(function($f) {
    global $cwd;
    // for existing files, use their real location
    if (file_exists($f)) {
        return realpath($f);
    }
    // if absolute path, return it
    if (substr($f,0,1) == '/') {
        return $f;
    }
    // otherwise combine it with $cwd
    return $cwd . '/' . $f;
}, $filenames));


// move to the main open-guide-editor folder, which should be the
// parent of where this script is
chdir(dirname(dirname(__FILE__)));

// if something isn't set, try to read it from settings.json
if (($port == 0 || $browser = '' || $host == '' || $templates == '') &&
    (file_exists('settings.json'))) {
    $settings = json_decode(file_get_contents('settings.json')) ??
        (new StdClass());
    if ($port == 0 && isset($settings->port)) {
        $port = intval($settings->port);
    }
    if ($browser == '' && isset($settings->browser)) {
        $browser = $settings->browser;
    }
    if ($templatesdir == '' && isset($settings->templates)) {
        $templatesdir = $settings->templates;
    }
    if ($host == '' && isset($settings->host)) {
        $host = $settings->host;
    }
}

echo 'port - ' . strval($port) . PHP_EOL;
echo 'browser - ' . $browser . PHP_EOL;
echo 'host - ' . $host . PHP_EOL;
echo 'templates = ' . $templatesdir . PHP_EOL;
foreach ($filenames as $filename) {
    echo 'filename ' . $filename . PHP_EOL;
}
