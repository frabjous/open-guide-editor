<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see 
// https://www.gnu.org/licenses/.

////////////////// libprocessing.php //////////////////////////////////
// defines functions common to different scripts that do processing  //
///////////////////////////////////////////////////////////////////////

require_once(dirname(__FILE__) . '/../open-guide-misc/pipe.php');
$swapvariables = array(
    'outputfile', 'page', 'rootdocument', 'savedfile', 'line', 'x', 'y'
);

function fill_processing_variables($opts, $postprocess = false) {
    global $swapvariables;
    $cmd = 'false';
    if ((isset($opts->routine->command)) && (!$postprocess)) {
        $cmd = $opts->routine->command;
    }
    if ((isset($opts->routine->postprocess)) && ($postprocess)) {
        $cmd = $opts->routine->postprocess;
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
