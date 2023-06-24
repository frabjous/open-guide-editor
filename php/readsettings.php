<?php

$settingsfile = '../settings.json';
$settings = new StdClass();

if (file_exists($settingsfile)) {
    $settings = json_decode(file_get_contents($settingsfile));
}
