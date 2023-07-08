<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

//////////////// readsettings.php //////////////////////////////////////
// reads the editor settings from a file and defines functions for    //
// making use of those settings                                       //
////////////////////////////////////////////////////////////////////////

// determine project name
$projectname = 'open guide';
if (isset($_SESSION["open-guide-project-name"])) {
    $projectname = $_SESSION["open-guide-project-name"];
}

// initiate some variables
$defaultsettingsfile = 'default-settings.json';
$settings = new StdClass();
$sitesettings = new StdClass();
$settingsfile = 'settings.json';

// get default and site-wide settings from files
if (file_exists($defaultsettingsfile)) {
    $settings = json_decode(file_get_contents($defaultsettingsfile));
}

if (file_exists($settingsfile)) {
    $sitesettings = json_decode(file_get_contents($settingsfile));
}

// get full path of root document
function full_document_root($dirname, $rootdocument) {
    global $settings;
    // check if already an absolute path
    if (substr($rootdocument,0,1) == '/') {
        return $rootdocument;
    }
    // look for where settings are; relative path
    // would be relative to it, most likely
    $gpsf = get_project_settings_filename($dirname);
    // if not settings file found, use the saved file's
    // director as base
    if ($gpsf === false) {
        return realpath($dirname . '/' . $rootdocument);
    }
    // otherwise use path relative to settings file
    $gpsf_dir = dirname($gpsf);
    return realpath($gpsf_dir . '/' . $rootdocument);
}

// determine where the project-specific settings file, if any
function get_project_settings_filename($dirname) {
    if (!has_authentication($dirname)) { return false; }
    if ($dirname == '/' || $dirname == '') { return false; }
    $checkname = $dirname . '/oge-settings.json';
    if (file_exists($checkname)) { return $checkname; }
    return get_project_settings_filename(dirname($dirname));
}

// merge settings from different files, recursively
function merge($obj, $rep_obj) {
    foreach($rep_obj as $key => $val) {
        if (!isset($obj->{$key})) {
            $obj->{$key} = $val;
            continue;
        }
        if (gettype($val) != 'object') {
            $obj->{$key} = $val;
            continue;
        }
        $obj->{$key} = merge($obj->{$key}, $val);
    }
    return $obj;
}

// get the project settings file, read it, and merge it
function merge_projectsettings($project_dirname) {
    global $settings;
    $ps_filename = get_project_settings_filename($project_dirname);
    if ($ps_filename === false) { return $settings; }
    $projectsettings = json_decode(file_get_contents($ps_filename));
    // allowing accesskeyfile to be set in project settings could be
    // a security problem
    if (isset($projectsettings->accesskeyfile)) {
        unset($projectsettings->accesskeyfile);
    }
    $settings = merge($settings, $projectsettings);
    return $settings;
}

// merge the files already read
$settings = merge($settings, $sitesettings);
