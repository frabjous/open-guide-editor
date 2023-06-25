<?php

$_SESSION["open-guide-editor-basename"] = '';
$_SESSION["open-guide-editor-dirname"] = '';

if ($_SERVER["SERVER_NAME"] == 'localhost') {
    $_SESSION["open-guide-editor-poweruser"] = true;
}
function has_authentication($filename) {
    if ($_SESSION["open-guide-editor-poweruser"]) {
        return true;
    }

    if ($filename == '/') { return false; }



    if (!isset($_SESSION["open-guide-editor-access"])) {
        return false;
    }
    // check individual folders
    foreach($_SESSION["open-guide-editor-access"] as $dir) {
        if (strlen($dir) > strlen($filename)) { return false; }
        if (substr($filename,0,strlen($dir)) == $dir) {
            return true;
        }
    }
    return false;
}

