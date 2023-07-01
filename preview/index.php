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

        <!-- css file -->
        <!-- <link rel="stylesheet" type="text/css" href="/kcklib/kckdialog.css"> -->
        <!-- javascript file -->
        <!-- <script type="text/javascript" charset="utf-8" src="/kcklib/kckdialog.js"></script> -->

    </head>
    <body>
        <p>This is a preview window. Hi there.</p>
    </body>
</html>
