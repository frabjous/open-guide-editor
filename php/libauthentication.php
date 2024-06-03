<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

/////////////// libauthentication.php ////////////////////////////////
// determines what authentication level the user has and provides a //
// library dealing with it for other scripts                        //
//////////////////////////////////////////////////////////////////////

// should always be required from script that calls session_start

// global variable for poweruser if not set
if (!(isset($poweruser))) {
    $poweruser = ((isset($_SESSION["open-guide-editor-poweruser"])) &&
        $_SESSION["open-guide-editor-poweruser"]);
}

// define this function first as it is required by readsettings.php
// though I'm not sure that matters
function has_authentication($filename) {
    global $poweruser;
    $filename = realpath($filename);
    if ($poweruser) { return true; }

    // no one can access root
    if ($filename == '/' || $filename == '') { return false; }

    // check for access variable being set
    if (!isset($_SESSION["open-guide-editor-access"])) {
        return false;
    }
    // check individual folders
    foreach($_SESSION["open-guide-editor-access"] as $dir) {
        if (strlen($dir) > strlen($filename)) { return false; }
        if (substr($filename,0,strlen($dir)) == $dir) {
            // return true if requested filename is in any allowed folder
            return true;
        }
    }
    // fallback to false
    return false;
}

// need settings read for data location, etc.
require_once("readsettings.php");

// returns the dirname and basename for a given key
function data_for_key($accesskey) {
    $allkeys = load_access_keys();
    if (!isset($allkeys->{$accesskey})) { return false;}
    return $allkeys->{$accesskey};
}

// read access keys from file
function load_access_keys() {
    global $settings;
    // settings should contain accesskeyfile, or things are broken
    if (!isset($settings->accesskeyfile)) {
        return false;
    }
    // if file doesn't exist yet, send empty object
    if (!file_exists($settings->accesskeyfile)) {
        return (new StdClass());
    }
    return json_decode(file_get_contents($settings->accesskeyfile)) ?? false;
}

// return false when access should not be granted
// returns key string otherwise
function new_access_key($dirname, $basename) {
    global $poweruser, $settings;

    // use real directory
    $dirname = realpath($dirname) ?? '';

    // dirname and basename cannot be blank
    if ($basename == '' || $basename == '') {
        return false;
    }

    // check for regular authentication
    $fullfilename = $dirname .'/'.$basename;
    if (!has_authentication($fullfilename)) {
        return false;
    }

    // create new key entry with file name data
    $entry = new StdClass();
    $entry->dirname = $dirname;
    $entry->basename = $basename;

    // load existing keys and ensure validity
    $allkeys = load_access_keys();
    if ($allkeys === false) {
        return false;
    }
    // generate a random string until new one found
    $accesskey = random_string(24);
    while (isset($allkeys->{$accesskey})) {
        $accesskey = random_string(24);
    }
    $allkeys->{$accesskey} = $entry;

    // save changes
    save_access_keys($allkeys);

    // return key string
    return $accesskey;
}

// for generating random strings for access keys, etc.
function random_string($length = 24) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $clength = strlen($characters);
    $str = '';
    for ($i = 0; $i < $length; $i++) {
        $str .= $characters[random_int(0, $clength - 1)];
    }
    return $str;
}

// save access keys after adding to them
function save_access_keys($newkeys) {
    global $settings;
    if (!isset($settings->accesskeyfile)) {
        return false;
    }
    $keysjson = json_encode($newkeys) ?? 'invalidjson';
    if ($newkeys === 'invalidjson') {
        return false;
    }
    if (!is_dir(dirname($settings->accesskeyfile))) {
        if (!mkdir(dirname($settings->accesskeyfile), 0755, true)) {
            return false;
        }
    }
    return file_put_contents($settings->accesskeyfile, $keysjson);
}
