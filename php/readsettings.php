<?php

// determine project name
$projectname = 'open guide';
if (isset($_SESSION["open-guide-project-name"])) {
    $projectname = $_SESSION["open-guide-project-name"];
}

$defaultsettingsfile = 'default-settings.json';
$settings = new StdClass();
$sitesettings = new StdClass();
$settingsfile = 'settings.json';

if (file_exists($defaultsettingsfile)) {
    $settings = json_decode(file_get_contents($defaultsettingsfile));
}

if (file_exists($settingsfile)) {
    $sitesettings = json_decode(file_get_contents($settingsfile));
}

function full_document_root($dirname, $rootdocument) {
    global $settings;
    $gpsf = get_project_settings_filename($dirname);
    if ($gpsf === false) {
        return realpath($dirname . '/' + $rootdocument);
    }
    $gpsf_dir = dirname($gpsf);
    return realpath($gpsf_dir . '/' + $rootdocument);
}

function get_project_settings_filename($dirname) {
    if (!has_authentication($dirname)) { return false; }
    if ($dirname == '/' || $dirname == '') { return false; }
    $checkname = $dirname . '/oge-settings.json';
    if (file_exists($checkname)) { return $checkname; }
    return get_project_settings_filename(dirname($dirname));
}

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

function merge_projectsettings($project_dirname) {
    global $settings;
    $ps_filename = get_project_settings_filename($project_dirname);
    if ($ps_filename === false) { return $settings; }
    $projectsettings = json_decode(file_get_contents($ps_filename));
    $settings = merge($settings, $projectsettings);
    return $settings;
}

$settings = merge($settings, $sitesettings);
