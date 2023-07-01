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
        <title>preview | </title>

        <!-- css files -->
        <link rel="stylesheet" type="text/css" href="../style/colors.css">
        <link rel="stylesheet" type="text/css" href="../style/panel.css">
        <link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Material+Symbols+Outlined">

        <!-- javascript file -->
        <!-- <script type="text/javascript" charset="utf-8" src="/kcklib/kckdialog.js"></script> -->

        <script charset="utf-8" src="../js/filetypeicons.js"></script>
        <script charset="utf-8" src="../js/panel.js"></script>
        <script type="module" src='open-guide-misc/fetch.mjs'></script>

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
                /*position: absolute;*/
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
            #viewercontainer {
                flex-grow: 1;
                width: 100%;
                height: 100%;
                max-height: 100%;
                overflow-y: auto;
            }
            #viewerparent {
                width: 100%;
                height: 100%;
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

I<br>realize<br>there<br>are<br>some<br>things<br>I<br>wrote<br>earlier<br>that<br>may<br>make<br>it<br>sound<br>as<br>if<br>I<br>blame<br>Carla<br>for<br>the<br>incident,<br>or<br>even<br>the<br>two<br>of<br>you<br>together.<br>I<br>think<br>that<br>is<br>just<br>because<br>I<br>am<br>trying<br>to<br>make<br>it<br>clear<br>that<br>there<br>are<br>different<br>ways<br>of<br>looking<br>at<br>what<br>happened,<br>and<br>I<br>am<br>a<br>bit<br>worried<br>that<br>you<br>might<br>be<br>interpreting<br>it<br>all<br>a<br>bit<br>too<br>simply.<br>However,<br>I<br>want<br>to<br>make<br>it<br>clear<br>that<br>I<br>don’t<br>blame<br>her<br>or<br>you<br>at<br>all,<br>any<br>more<br>than<br>I<br>should<br>blame<br>myself<br>or<br>Emily<br>herself<br>for<br>Emily’s<br>troubles.<br>I<br>doubt<br>casting<br>blame<br>is<br>ever<br>very<br>useful<br>in<br>life,<br>and<br>none<br>of<br>the<br>philosophical<br>literature<br>I’ve<br>read<br>on<br>moral<br>responsibility<br>and<br>its<br>relation<br>to<br>blame<br>(which<br>is<br>a<br>fair<br>amount),<br>even<br>that<br>which<br>attempts<br>to<br>justify<br>the<br>role<br>of<br>blameworthiness<br>in<br>our<br>moral<br>practices,<br>has<br>convinced<br>me<br>that<br>the<br>concept<br>of<br>“who’s<br>to<br>blame”<br>for<br>any<br>given<br>real-life<br>situation<br>even<br>makes<br>any<br>sense.<br>We<br>were<br>all<br>caused<br>to<br>be<br>who<br>we<br>are<br>and<br>act<br>the<br>way<br>we<br>do<br>by<br>laws<br>of<br>nature<br>and<br>psychology<br>outside<br>our<br>personal<br>control.<br>Whatever<br>the<br>right<br>philosophy<br>is<br>about<br>that<br>question,<br>however,<br>we’re<br>all<br>human,<br>and<br>being<br>grandparents<br>to<br>a<br>child<br>with<br>autism<br>is<br>not<br>much<br>easier<br>than<br>being<br>parents<br>of<br>a<br>child<br>with<br>autism<br>(or<br>so<br>I<br>imagine).<br>Elyssa’s<br>parents<br>still<br>struggle<br>even<br>though<br>they<br>have<br>much<br>more<br>experience<br>with<br>Emily<br>in<br>particular<br>than<br>you<br>and<br>Carla<br>do.<br>Things<br>such<br>as<br>what<br>happened<br>are<br>bound<br>to<br>happen<br>when<br>complex<br>families<br>come<br>together<br>and<br>talk<br>about<br>anything<br>that<br>matters<br>in<br>any<br>way.<br>We<br>all<br>need<br>to<br>work<br>on<br>trying<br>not<br>to<br>take<br>these<br>things<br>personally,<br>and<br>not<br>get<br>any<br>more<br>upset<br>about<br>them<br>than<br>we<br>need<br>to,<br>and<br>remember<br>above<br>all<br>that<br>we<br>all<br>love<br>each<br>other<br>and<br>want<br>the<br>best<br>for<br>each<br>other.<br>I<br>think<br>that<br>might<br>be<br>equally<br>true<br>for<br>everyone<br>who<br>was<br>at<br>that<br>table,<br>and<br>certainly<br>myself.

Anyway,<br>I<br>don’t<br>think<br>the<br>incident<br>on<br>its<br>own<br>is<br>that<br>important.<br>I’m<br>really<br>just<br>using<br>it<br>as<br>an<br>example<br>of<br>how<br>so<br>many<br>things<br>can<br>come<br>together<br>at<br>once<br>to<br>make<br>life<br>complicated,<br>especially<br>when<br>you<br>have<br>a<br>child<br>with<br>autism.


                </div>
            </div>
        </div>
        <script charset="utf-8" src="editor.bundle.js"></script>
    </body>
</html>
