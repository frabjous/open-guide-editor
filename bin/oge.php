#!/usr/bin/env php
<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////////////// bi//n/oge.php ///////////////////////////////////
// A script for launching the open guide editor from the command line //
////////////////////////////////////////////////////////////////////////

// ensure that we are in fact running from the command line and not
// via a server
if ((php_sapi_name() != 'cli') || isset($_SERVER["SERVER_PROTOCOL"])) {
    exit("ERROR. This script must be run from the command line.");
}
echo <<<EOL
 hi there
you there
EOL;
// move to the main open-guide-editor folder, which should be the
// parent of where this script is
chdir(dirname(dirname(__FILE__)));
echo getcwd();
