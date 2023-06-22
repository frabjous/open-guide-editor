<?php

session_start();

$basename = 'placeholder.md';

?><!DOCTYPE html>
<html lang="en">
    <head>
        <!-- standard metadata -->
        <meta charset="utf-8">
        <meta name="description" content="Open guide editor and preview launcher">
        <meta name="author" content="Kevin C. Klement">
        <meta name="copyright" content="Copyright 2023 © Kevin C> Klement">

        <!-- to disable search indexing -->
        <meta name="robots" content="noindex,nofollow">

        <!-- mobile ready -->
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="mobile-web-app-capable" content="yes">

        <!-- web icon -->
        <link rel="shortcut icon" href="favicon.ico" type="image/x-icon">
        <title><?php echo $basename; ?> | open guide editor</title>

        <!-- css file -->
        <!-- <link rel="stylesheet" type="text/css" href="/kcklib/kckdialog.css"> -->
        <!-- javascript file -->
        <!-- <script type="text/javascript" charset="utf-8" src="/kcklib/kckdialog.js"></script> -->

        <style>
            html, body {
                margin: 0;
                padding: 0;
                font-size: 16px;
                background-color: white;
                color: black;
            }
            #allcontainer {
                height: 100vh;
                width: 100vw;
            }
            #toppanelcontainer {
                position: fixed;
                z-index: 10;
                top: 0;
                width: 100%;
                height: 3rem;
                background-color: LightGray;
            }
            #editorcontainer {
                position: relative;
                padding-top: 3rem;
                min-height: calc(100vh - 3rem);
            }
            #editorparent {
                width: 100%;
                height: 100%;
                overflow: auto;
            }
        </style>
    </head>
    <body>
        <div id="allcontainer">
            <div id="toppanelcontainer">
                <div id="toppanel">
                    Some content.
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
