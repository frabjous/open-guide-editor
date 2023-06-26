<?php

session_start();
require_once 'php/libauthentication.php';

    // determine title
    $displaybasename = ($basename == '') ? '⟨unnamed⟩' : $basename;
$file_contents = '';
// TODO set fullfilename
    if ((file_exists($fullfilename)) && ($fullfilename != '/') &&
        !is_dir($fullfilename)) {
        $file_contents = file_get_contents($fullfilename);
    }

?><!DOCTYPE html>
<html lang="en">
    <head>
        <!-- standard metadata -->
        <meta charset="utf-8">
        <meta name="description" content="Open guide editor and preview launcher">
        <meta name="author" content="Kevin C. Klement">
        <meta name="copyright" content="Copyright 2023 © Kevin C. Klement">

        <!-- to disable search indexing -->
        <meta name="robots" content="noindex,nofollow">

        <!-- mobile ready -->
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="mobile-web-app-capable" content="yes">

        <!-- web icon -->
        <link rel="shortcut icon" href="favicon.ico" type="image/x-icon">
        <title><?php echo $displaybasename; ?> | <?php echo $projectname; ?> editor</title>

        <!-- css file -->
        <link rel="stylesheet" type="text/css" href="style/colors.css">
        <link rel="stylesheet" type="text/css" href="style/panel.css">
        <link rel="stylesheet" type="text/css" href="open-guide-misc/dialog.css">
        <link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Material+Symbols+Outlined">
        <!-- javascript file -->
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
            window.numchanges = 0;
            window.lastsavedat = 0;
            window.reloadonsave = (window.basename == '');
            window.onload = function() {
                powerUpEditor();
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
