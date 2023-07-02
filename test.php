<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

///////////////////////////// index.php /////////////////////////////
// sets up and serves the main page for the editor
/////////////////////////////////////////////////////////////////////
session_start();



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
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Material+Symbols+Outlined">
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet"> 

        <!-- javascript file -->
        <script charset="utf-8" src="js/filetypeicons.js"></script>
        <style>
            html, body {
                margin: 0;
                padding: 0;
                font-size: 16px;
            }
            #allcontainer {
                height: 100vh;
                max-height: 100vh;
                width: 100vw;
                position: absolute;
                display: flex;
                flex-direction: column;
                align-items: stretch;
                overflow-y: hidden;
            }
            #toppanelcontainer {
                z-index: 10;
                width: 100%;
                min-height: 2.8rem;
                flex-shrink: 0;
            }
            #editorcontainer {
                flex-grow: 1;
                width: 100%;
                height: 100%;
                max-height: 100%;
                overflow-y: auto;
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
                font-family:
                    'JetBrains Mono',
                    'JuliaMono',
                    'TeX Gyre DejaVu Math',
                    'DejaVu Sans Mono',
                    monospace !important;
                overflow: auto;
            }
        </style>

    </head>
    <body>
        <div id="allcontainer">
            <div id="toppanelcontainer">
                <div id="toppanel">
                    <div id="toppanelleftbuttons"></div>
                    <div id="toppanelrightbuttons"></div>
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
