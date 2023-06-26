<?php

// should always be required from script that calls session_start

if ($_SERVER["SERVER_NAME"] == 'localhost') {
    $_SESSION["open-guide-editor-poweruser"] = true;
}

// global variable for poweruser
$poweruser = ((isset($_SESSION["open-guide-editor-poweruser"])) &&
    $_SESSION["open-guide-editor-poweruser"]);

// define this function first as it is required by readsettings.php
// though I'm not sure that matters
function has_authentication($filename) {
    global $poweruser;
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

require_once("php/readsettings.php");

// returns the dirname and basename for a given key
function data_for_key($accesskey) {
    $allkeys = load_access_keys();
    if (!isset($allkeys->{$accesskey})) { return false;}
    return $allkeys->{$accesskey};
}

// returns true for poweruser accessing blank page
// return false when access should not be granted
// returns key string otherwise
function get_new_access_key() {
    global $poweruser, $settings;

    // only powerusers may start blank pages; if they try, return false
    if ((!$poweruser) && (
        !isset($_SESSION["open-guide-editor-dirname"]) ||
        !isset($_SESSION["open-guide-editor-basename"])
    )) {
       return false;
    }

    // get target from session
    $dirname = $_SESSION["open-guide-editor-dirname"] ?? '';
    $basename = $_SESSION["open-guide-editor-basename"] ?? '';

    // clear session variables so they're not "saved"
    unset($_SESSION["open-guide-editor-dirname"]);
    unset($_SESSION["open-guide-editor-basename"]);

    // for blank page return true (must be poweruser to get here)
    if ($basename == '') {
        return true;
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

function random_string($length = 24) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $clength = strlen($characters);
    $str = '';
    for ($i = 0; $i < $length; $i++) {
        $str .= $characters[random_int(0, $clength - 1)];
    }
    return $str;
}

function save_access_keys($newkeys) {
    global $settings;
    if (!isset($settings->accesskeyfile)) {
        return false;
    }
    $keysjson = json_encode($newkeys) ?? 'invalidjson';
    if ($newkeys === 'invalidjson') {
        return false;
    }
    return file_put_contents($settings->accesskeyfile, $keysjson);
}
