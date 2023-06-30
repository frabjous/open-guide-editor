<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see 
// https://www.gnu.org/licenses/.
//
require 'open-guide-misc/pipe.php';
$swapvariables = array('outputfile', 'rootdocument', 'savedfile');

function fill_processing_variables($opts) {
    global $swapvariables;
    $cmd = 'false';
    if (isset($opts->routine->command)) {
        $cmd = $opts->routine->command;
    }
    foreach ($swapvariables as $variable) {
        if (isset($opts->{$variable})) {
            $cmd = str_replace(
                '%' . $variable . '%',
                '"' . $opts->{$variable} . '"',
                $cmd
            );
        }
    }
    return $cmd;
}
