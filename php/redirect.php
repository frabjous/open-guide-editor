<?php

session_start();

$redirect_url = '../meinongian-page';

$dirname = $_GET["dirname"] ?? false;
$basename = $_GET["basename"] ?? false;

if ($dirname === false || $basename === false) {
    header('Location: ../meinongianpage.html');
    exit(0);
}

$_SESSION["open-guide-editor-dirname"] = $dirname;
$_SESSION["open-guide-editor-basename"] = $basename;

error_log("redirect-oge" . $_SESSION["open-guide-editor-dirname"]);

header('Location: ../');
exit(0);
