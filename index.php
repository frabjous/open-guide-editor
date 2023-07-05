<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

///////////////////////////// index.php /////////////////////////////
// sets up and serves the main page for the editor
/////////////////////////////////////////////////////////////////////
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

// determine filename to use in title
$displaybasename = ($basename == '') ? '⟨unnamed⟩' : $basename;

// read contents
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
$rootdocument = full_document_root($dirname, $rootdocument);
$rootextension = pathinfo($rootdocument, PATHINFO_EXTENSION);
$rdirname = dirname($rootdocument);

// check if readloud should be done
$thisextension = pathinfo($basename, PATHINFO_EXTENSION);
$readaloud = false;
if (isset($settings->readaloud->{$thisextension})) {
    $readaloud = true;
}

// check if there is a bibliography
$bibcompletions = [];
if (isset($settings->bibliographies)) {
    foreach ($settings->bibliographies as $bibfile) {
        $fullbibfile = $rdirname . '/' . $bibfile;
        if (!file_exists($fullbibfile)) {
            continue;
        }
        $bibfilecontents = file_get_contents($fullbibfile) ?? false;
        if (!$bibfilecontents) { continue; }
        $bibentries = json_decode($bibfilecontents) ?? false;
        if (!$bibentries) { continue; }
        foreach ($bibentries as $bibentry) {
            $completion = new StdClass();
            if (!isset($bibentry->id)) { continue; }
            $completion->label = '@' . $bibentry->id;
            $completion->type = 'text';
            $detail = '';
            if (isset($bibentry->author)) {
                $lastnames = array_map( function($ae) {
                    return $ae->family ?? '';
                }, $bibentry->author);
                $detail = implode('; ',$lastnames);
            }
            if ($detail == '') {
                if (isset($bibentry->editor)) {
                    $lastnames = array_map ( function($ee) {
                        return $ee->family ?? '';
                    }, $bibentry->editor);
                    $detail .= implode('; ',$lastnames) . ', eds.';
                }
            }
            if (isset($bibentry->title)) {
                $detail .= ' – ' . $bibentry->title;
            }
            $completion->detail = $detail;
            array_push($bibcompletions, $completion);
        }
    }
}

// check if git enabled
$gitenabled = false;
if (is_dir($rdirname . '/.git')) {
    $gitenabled = true;
}

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
        <script charset="utf-8" src="js/panel.js"></script>
        <script charset="utf-8" src="js/libeditor.js"></script>
        <?php if ($readaloud) { ?><script charset="utf-8" src="js/readaloud.js"></script><?php } ?>
        <script type="module" charset="utf-8" src='open-guide-misc/fetch.mjs'></script>
        <script type="module" charset="utf-8" src='open-guide-misc/dialog.mjs'></script>
        <script type="module" charset="utf-8">
            import downloadFile from './open-guide-misc/download.mjs';
            import symbolPicker from './open-guide-misc/symbol-picker.mjs';
            window.downloadFile = downloadFile;
            window.symbolPicker = symbolPicker;
        </script>
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

        <script>
            window.filecontents = <?php echo json_encode($file_contents); ?>;
            window.bibcompletions = <?php echo json_encode($bibcompletions); ?>;
            window.poweruser = <?php echo json_encode($poweruser); ?>;
            window.accesskey = '<?php echo $accesskey; ?>';
            window.dirname = '<?php echo $dirname; ?>';
            window.basename = '<?php echo $basename; ?>';
            window.ogeSettings = <?php echo json_encode($settings); ?>;
            window.thisextension = '<?php echo $thisextension; ?>';
            window.rootextension = '<?php echo $rootextension; ?>';
            window.gitenabled = <?php echo json_encode($gitenabled); ?>;
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
            window.processedonce = {};
            window.viewedonce = false;
            window.viewerwindow = false;
            window.jumpline = 1;
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
                // close viewer window when closing this window
                if (window.viewerwindow) {
                    window.viewerwindow.close();
                }
                // prevent losing saved data
                if (window.lastsavedat != window.numchanges) {
                    e.preventDefault();
                }
            }
            window.onmessage = function(e) {
                // sanity checks
                if (!e.data) { return false; }
                if (!ogEditor) { return false; }
                if (!ogEditor.handlemessage) { return false; }
                return ogEditor.handlemessage(e.data);
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
                    <div id="toppanelrightbuttons"></div>
                    <div id="toppanelleftbuttons"></div>
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
