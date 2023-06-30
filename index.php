<?php

session_start();
require_once 'php/libauthentication.php';

// read access key
$accesskey = '';
if (isset($_GET["accesskey"])) {
    $accesskey = $_GET["accesskey"];
}

// only power users can access without key
if ($accesskey == '' && !$poweruser) {
    header("HTTP/1.1 403 Forbidden");
    exit;
}

// get key data
$keydata = false;
if ($accesskey != '') {
    $keydata = data_for_key($accesskey);
}

// if key not found, it's a bad attempt
if (!$keydata === false && !$poweruser) {
    header("HTTP/1.1 403 Forbidden");
    exit;
}

// determine dirname, basename from key data
$dirname = '';
$basename = '';
if (!$keydata === false) {
    $dirname = $keydata->dirname;
    $basename = $keydata->basename;
}
$fullfilename = $dirname . '/' . $basename;

// add dirname to editor access directories; merge settings
if (!isset($_SESSION["open-guide-editor-access"])) {
    $_SESSION["open-guide-editor-access"] = array();
}
if ($dirname != '') {
    $_SESSION["open-guide-editor-access"] = array_unique(
        array_merge($_SESSION["open-guide-editor-access"], array($dirname))
    );
    $settings = merge_projectsettings($dirname);
}

// determine title
$displaybasename = ($basename == '') ? '⟨unnamed⟩' : $basename;
$file_contents = '';
    if ((file_exists($fullfilename)) && ($fullfilename != '/') &&
        !is_dir($fullfilename)) {
        $file_contents = file_get_contents($fullfilename);
    }

// determine root document
$rootdocument = $fullfilename;
if (isset($settings->rootdocument)) {
    $rootdocument = $settings->rootdocument;
}
$rootextension = pathinfo($rootdocument, PATHINFO_EXTENSION);
?><!DOCTYPE html>
<html lang="en">
    <head>
        <!-- standard metadata -->
        <meta charset="utf-8">
        <meta name="description" content="Open guide editor and preview launcher">
        <meta name="author" content="Kevin C. Klement">
        <meta name="copyright" content="Copyright 2023 © Kevin C. Klement">

        <!-- disable search indexing -->
        <meta name="robots" content="noindex,nofollow">

        <!-- mobile ready -->
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="mobile-web-app-capable" content="yes">

        <!-- web icon and title -->
        <link rel="shortcut icon" href="favicon.ico" type="image/x-icon">
        <title><?php echo $displaybasename; ?> | <?php echo $projectname; ?> editor</title>

        <!-- css files -->
        <link rel="stylesheet" type="text/css" href="style/colors.css">
        <link rel="stylesheet" type="text/css" href="style/panel.css">
        <link rel="stylesheet" type="text/css" href="open-guide-misc/dialog.css">
        <link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Material+Symbols+Outlined">

        <!-- javascript file -->
        <script type="text/javascript" charset="utf-8" src="js/filetypeicons.js"></script>
        <script type="text/javascript" charset="utf-8" src="js/libeditor.js"></script>

        <style>
            html, body {
                margin: 0;
                padding: 0;
                font-size: 16px;
            }
            #allcontainer {
                height: 100vh;
                width: 100vw;
                position: absolute;
            }
            #toppanelcontainer {
                position: fixed;
                z-index: 10;
                top: 0;
                width: 100%;
                height: 2.8rem;
            }
            #editorcontainer {
                position: fixed;
                top: calc(2.4rem + 2px);
                min-height: calc(100vh - 2.8rem);
                max-height: calc(100vh - 2.8rem);
                height: calc(100vh - 2.8rem);
                width: 100%;
            }
            #editorparent {
                width: 100%;
                height: 100%;
            }
            .cm-editor {
                height: 100%;
                width: 100%;
            }
            .cm-scroller {
                overflow: auto;
            }
        </style>
        <script type="module" src='open-guide-misc/fetch.mjs'></script>
        <script type="module" src='open-guide-misc/dialog.mjs'></script>
        <script>
            window.filecontents = <?php echo json_encode($file_contents); ?>;
            window.poweruser = <?php echo json_encode($poweruser); ?>;
            window.dirname = '<?php echo $dirname; ?>';
            window.basename = '<?php echo $basename; ?>';
            window.ogeSettings = <?php echo json_encode($settings); ?>;
            window.rootextension = '<?php echo $rootextension; ?>';
            window.rootdocument = window.dirname + '/' + window.basename;
            if (ogeSettings.rootdocument) {
                window.rootdocument = ogeSettings.rootdocument;
            }
            window.numchanges = 0;
            window.lastsavedat = 0;
            window.lastautosavedat = 0;
            window.reloadonsave = (window.basename == '');
            window.autoprocessing = false;
            window.autoprocessTimeOut = {};
            window.processedonce = false;
            window.viewedonce = false;
            window.onload = function() {
                powerUpEditor();
                // start autosave timer if applicable
                if (("autosave" in window.ogeSettings) &&
                    (window.ogeSettings?.autosave?.interval >= 1)) {
                    let asi = setInterval(
                        function() {
                            if (window.lastautosavedat
                                != window.numchanges) {
                                ogEditor.save({ autosave: true });
                            }
                        },
                        window.ogeSettings.autosave.interval
                    );
                }
            }
            window.onbeforeunload = function(e) {
                if (window.lastsavedat != window.numchanges) {
                    e.preventDefault();
                }
            }
            window.setTitle = function(changed) {
                let bn = (window.basename == '') ? '⟨untitled⟩' :
                    window.basename;
                document.title = (changed ? '[+] ' : '') +
                    bn + ' | <?php echo $projectname; ?> editor';
            }
        </script>
    </head>
    <body>
        <div id="allcontainer">
            <div id="toppanelcontainer">
                <div id="toppanel">
                </div>
            </div>
            <div id="editorcontainer">
                <div id="editorparent">
                </div>
            </div>
        </div>
        <script charset="utf-8" src="editor.bundle.js"></script>
    </body>
</html>
