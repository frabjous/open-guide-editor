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
$not_cli_errmsg = "ERROR. This script must be run from the command line.";
if ((php_sapi_name() != 'cli') || isset($_SERVER["SERVER_PROTOCOL"])) {
    exit($not_cli_errmsg);
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
                           (can include '/'s for subdirectories, but
                            then you should use port 80 or 443)
--port (NN)              : specify the port to look for the server
                           (otherwise will be 8181 or what is
                            set in settings.json)
--templates (directory)  : if this is set, filenames of files that don’t
                           exist already will be created according to
                           templates with names of the form "ext[1].template"
                           in the directory specified, e.g. "tex.template"
                           or "tex1.template" for a LaTeX file

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
                error_log('No browser specified');
                exit(1);
            }
            $browser = $argv[$arg_to_read + 1];
            $arg_to_read += 2;
            break;

        case '--host':
            if ($arg_to_read + 1 == count($argv)) {
                error_log('No host specified');
                exit(1);
            }
            $host = $argv[$arg_to_read + 1];
            $arg_to_read += 2;
            break;

        case '--port':
            if ($arg_to_read + 1 == count($argv)) {
                error_log('No port specified');
                exit(1);
            }

            $port = intval($argv[$arg_to_read + 1]);
            $arg_to_read += 2;
            break;

        case '--templates':
            if ($arg_to_read + 1 == count($argv)) {
                error_log('No template directory specified');
                exit(1);
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

// if no filenames given, quit
if (count($filenames) == 0) {
    showhelp();
    error_log(PHP_EOL . "At least one filename must be given.");
    exit(1);
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

// if templates set, canonicalize it
if ($templatesdir != '' && is_dir($templatesdir)) {
    $templatesdir = realpath($templatesdir);
}

// move to the main open-guide-editor folder, which should be the
// parent of where this script is
chdir(dirname(dirname(realpath(__FILE__))));

$poweruser = true;
require_once('php/libauthentication.php');

// if something isn't set, try to read it from settings.json
if (($port == 0 || $browser == '' || $host == '' ||
    $templatesdir == '') && (file_exists('settings.json'))) {
    //$settings = json_decode(file_get_contents('settings.json')) ??
        //(new StdClass());
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

// handle defaults
if ($port == 0) { $port = 8181; }

// try to read browser from environmental variable
if ($browser == '') {
    $browser = getenv("BROWSER") ?? '';
}

// if still unset, use firefox
if ($browser == '') {
    $browser = 'firefox';
}

// host defaults to "localhost"
if ($host == '') { $host = 'localhost'; }

// if templates directory is set, it should exist
if ($templatesdir != '' && !is_dir($templatesdir)) {
    error_log("Template directory specified does not exist.");
    exit(1);
}

// ensure open-guide-misc exists
if (!file_exists('open-guide-misc/fetch.mjs')) {
    error_log("ERROR. The open-guide-misc submodule does not exist.");
    error_log("Did you clone the repository with the" .
       " --recurse-submodules option?");
    exit(1);
}

// ensure node_modules exist; if not try to install with npm
if (!is_dir('node_modules')) {
    error_log("Codemirror and its dependencies are not installed.");
    error_log("Attempting to install. This should only need to be" .
        " done once.");
    exec('npm install --quiet 2>&1', $o, $e);
    if ($e != 0) {
        error_log(PHP_EOL . implode(PHP_EOL,$o) . PHP_EOL);
        error_log("Attempt failed. Is npm installed?");
        exit(1);
    }
}

// ensure bundled script exists
if (!file_exists("editor.bundle.js")) {
    error_log("Rollup bundle of codemirror libraries not found.");
    error_log("Attempting to create.");
    exec('node_modules/.bin/rollup js/editor.mjs -f iife -o ' .
        'editor.bundle.js -p @rollup/plugin-node-resolve 2>&1',$o,$e);
    if ($e != 0) {
        error_log(PHP_EOL . implode(PHP_EOL,$o) . PHP_EOL);
        error_log("Attempt failed. OGE will not work without it.");
        exit(1);
    }
}

// check on server by trying to grab this very script
$protocol = 'http' . (($port == 443) ? 's' : '');
$urlbase = $protocol . '://' . $host;
if ($port != 443 && $port != 80) {
    $urlbase .= ':' . strval($port);
}

// try to determine webroot based on names, might not be best
$pathparts = explode('/', getcwd());
$stophere = 0;
for($i = (count($pathparts) - 1); $i >= 0; $i--) {
    $thispart = $pathparts[$i];
    if ((strpos($thispart, 'http') !== false) ||
        (strpos($thispart, 'html') !== false) ||
        (strpos($thispart, 'www') !== false)) {
        $stophere = $i;
        break;
    }
}


$basepath = implode('/',array_slice($pathparts, $stophere + 1));

if ($basepath[0] != '/') {
    $basepath = '/' . $basepath;
}

$url = $urlbase . $basepath . '/bin/oge.php';

// start a curl session
$curl = curl_init();
curl_setopt($curl, CURLOPT_URL, $url);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_HEADER, false);
$curl_result = curl_exec($curl);
curl_close($curl);

// not running; start php testing server
if (!str_contains($curl_result, $not_cli_errmsg)) {
    error_log("starting server …");
    shell_exec('php -S localhost:' . $port .
        ' >/dev/null 2>&1 & disown');
    sleep(1);
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_HEADER, false);
    $curl_result = curl_exec($curl);
    curl_close($curl);
    if (!str_contains($curl_result, $not_cli_errmsg)) {
        error_log("Could not connect to or start OGE server.");
        exit(1);
    }
}

// process each file
foreach ($filenames as $filename) {
    // if file does not exist, look for template
    if (!file_exists($filename) && $templatesdir != '') {
        $ext = pathinfo($filename, PATHINFO_EXTENSION);
        if ($ext != '') {
            foreach(array(
                $templatesdir .'/'. $ext . '.template',
                $templatesdir .'/'. $ext . '1.template'
            ) as $posstemplate) {
                // if template found, copy it, but quit on error
                if (file_exists($posstemplate)) {
                    $copyresult = copy($posstemplate, $filename);
                    if (!$copyresult) {
                        error_log("Failed copying template " .
                            $posstemplate . " to " . $filename . ".");
                        exit(1);
                    }
                    break;
                }
            }
        }
    }
    // if the file still does not exist, create it.
    if (!file_exists($filename)) {
        $touchresult = touch($filename);
        if (!$touchresult) {
            error_log("Failed to create file {$filename}.");
            exit(1);
        }
    }

    // open a redirection to the file in the browser
    $dirname = dirname($filename);
    $basename = basename($filename);
    $accesskey = new_access_key($dirname, $basename);
    $filelaunchurl = $urlbase . $basepath . '/?accesskey=' . $accesskey;
    //$filelaunchurl = $urlbase . $basepath . '/php/redirect.php?dirname=' .
        //rawurlencode($dirname) . '&basename=' . rawurlencode($basename);
    shell_exec($browser . ' "' . $filelaunchurl .
        '" >/dev/null 2>&1 & disown');
}
