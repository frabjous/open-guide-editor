<?php

// determine project name
$projectname = 'open guide';
if (isset($_SESSION["open-guide-project-name"])) {
    $projectname = $_SESSION["open-guide-project-name"];
}

$defaultsettingsfile = 'default-settings.json';
$settings = new StdClass();
$sitesettings = new StdClass();
$projectsettings = new StdClass();
$settingsfile = 'settings.json';

if (file_exists($defaultsettingsfile)) {
    $settings = json_decode(file_get_contents($defaultsettingsfile));
}

if (file_exists($settingsfile)) {
    $sitesettings = json_decode(file_get_contents($settingsfile));
}

function get_project_settings_filename($dirname) {
    if (!has_authentication($dirname)) { return false; }
    if ($dirname == '/' || $dirname == '') { return false; }
    $checkname = $dirname . '/oge-settings.json';
    if (file_exists($checkname)) { return $checkname; }
    return get_project_settings_filename(dirname($dirname));
}

if (isset($_SESSION["open-guide-editor-dirname"])) {
    $projectsettingsfile = get_project_settings_filename(
        $_SESSION["open-guide-editor-dirname"]
    );
    if ($projectsettingsfile !== false) {
        $projectsettings = json_decode(file_get_contents($projectsettingsfile));
    }
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

$settings = merge($settings, $sitesettings);
$settings = merge($settings, $projectsettings);
