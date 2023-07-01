<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

///////////////// preview/index.php /////////////////////////////////
// serves the page for the output preview of the file being edited //
/////////////////////////////////////////////////////////////////////

session_start();
// move to parent folder for easier access to the libraries
chdir('..');
require_once 'php/libauthentication.php';

// read access key
$accesskey = '';
if (isset($_GET["accesskey"])) {
    $accesskey = $_GET["accesskey"];
}

// only power users can access without key
if ($accesskey == '') {
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

// merge the project settings
$settings = merge_projectsettings($dirname);

// determine root document
$rootdocument = $fullfilename;
if (isset($settings->rootdocument)) {
    $rootdocument = $settings->rootdocument;
}
$rootextension = pathinfo($rootdocument, PATHINFO_EXTENSION);
$fullroot = full_document_root($dirname, $rootdocument);

// determine output file from extension given; default to html
$outputext = $_GET["outputext"] ?? 'html';

// go to directory of root folder
// ensure that it exists
if (!file_exists($fullroot)) {
    header("HTTP/1.1 404 Not Found");
    exit;
}

// go into folder of root document
$whereiwas = getcwd();
$rootdir = dirname($fullroot);
chdir($rootdir);

// since we are in its folder, let's use its basename
$rootbase = basename($fullroot);

$routine = new StdClass();
if (isset($settings->routines->{$rootextension}->{$outputext})) {
    $routine = $settings->routines->{$rootextension}->{$outputext};
}

// determine the outputfile
$outputfile = mb_ereg_replace($rootextension . '$', $outputext,
       $rootbase);

// allow overriding the output file in the settings
if (isset($routine->outputfile)) {
    $outputfile = $opts->routine->outputfile;
}

// used in title, etc.
$outputbase = basename($outputfile);
$outputfull = realpath($outputfile);

// ensure we can actually preview the kind of file in question
if (!file_exists("$whereiwas/preview/$outputext/viewer.mjs")) {
    header("Location: ../meinongian-page.html");
    exit;
}


?><!DOCTYPE html>
<html lang="en">
    <head>
        <!-- standard metadata -->
        <meta charset="utf-8">
        <meta name="description" content="open guide editor preview">
        <meta name="author" content="Kevin C. Klement">
        <meta name="copyright" content="Copyright 2023 © Kevin C. Klement">
        <meta name="keywords" content="preview,file,edit,open guide">
        <meta name="dcterms.date" content="2023-07-30">

        <!--disable search indexing -->
        <meta name="robots" content="noindex,nofollow">

        <!-- mobile ready -->
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="mobile-web-app-capable" content="yes">

        <!-- web icon -->
        <link rel="shortcut icon" href="../favicon.ico" type="image/x-icon">
        <title><?php echo $outputbase; ?> | <?php echo $projectname; ?> preview</title>

        <!-- css files -->
        <link rel="stylesheet" type="text/css" href="../style/colors.css">
        <link rel="stylesheet" type="text/css" href="../style/panel.css">
        <link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Material+Symbols+Outlined">

        <!-- javascript file -->
        <!-- <script type="text/javascript" charset="utf-8" src="/kcklib/kckdialog.js"></script> -->

        <script charset="utf-8" src="../js/panel.js"></script>
        <script type="module" charset="utf-8" src="../open-guide-misc/fetch.mjs"></script>
        <script type="module" charset="utf-8" src="<?php echo $outputext; ?>/viewer.mjs"></script>

        <script>
            //LICENSE: GNU GPL v3
                window.ogeSettings = <?php echo json_encode($settings); ?>;
                window.outputfile = '<?php echo $outputfull; ?>';
        </script>

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
                max-height: 100vh;
                width: 100vw;
                display: flex;
                flex-direction: column;
                align-items: stretch;
                overflow-y: hidden;
                padding: 0;
            }
            #toppanelcontainer {
                z-index: 10;
                width: 100%;
                min-height: 2.8rem;
                flex-shrink: 0;
            }
            #viewercontainer {
                flex-grow: 1;
                width: 100%;
                height: 100%;
                max-height: 100%;
                overflow: auto;
            }
            #viewerparent {
                width: 100%;
                height: 100%;
                padding: 0;
                margin: 0;
                overflow: hidden;
            }
            #viewerparent iframe {
                border: none;
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
            }
        </style>

    </head>
    <body>
        <div id="allcontainer">
            <div id="toppanelcontainer">
                <div id="toppanel">
                </div>
            </div>
            <div id="viewercontainer">
                <div id="viewerparent">
                </div>
            </div>
        </div>
    </body>
</html>
