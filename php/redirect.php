<?php

session_start();
chdir('..');
require 'libauthentication.php';

$dirname = $_GET["dirname"] ?? false;
$basename = $_GET["basename"] ?? false;

if ($dirname === false || $basename === false) {
    header('Location: ../meinongianpage.html');
    exit(0);
}

$accesskey = new_access_key($dirname, $basename);

if ($accesskey === false) {
    header("HTTP/1.1 403 Forbidden");
    exit;
}

header('Location: ../?accesskey=' . $accesskey);
exit(0);
