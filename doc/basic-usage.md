
# Open Guide Editor (OGE) Documentation

# Basic Usage, Buttons and Keybindings

For the most part, use of the editor as a text editor, should be straightforward, as it is based on [codemirror's basic setup](https://codemirror.net/docs/ref/#codemirror.basicSetup), which provides sane defaults for regular text editing.

OGE builds upon by providing a back-end for saving, processing and previewing. You will need to **enable pop-ups** for the site serving the editor to see the preview window.

These functions can be invoked either by clicking on buttons on the toolbar, or invoked via keybindings.

## Buttons

![oge-buttons.png]()

The top panel, when full, looks like the above. They do the following:

1. (disk) Saves the current file, without any processing.

2. (checkmark and seal) Commits the current state of the file's git folder, assuming it has one, with a message provided to a prompt.

3. (open folder) Opens a new file, usually in another tab, unless the current document is unnamed and empty.

4. (wrapped lines) Toggles line wrapping on or off.

5. (random characters) Brings up a panel for inserting special characters, mostly logical and mathematical symbols and Greek letters.

6. (looking glass) Brings up a dialog for search/replace.

7. (terminal prompt) Pipes either the selected text, or the whole file if nothing is selected, through a Unix command on the server, and changes it for the result. Useful for things like [sort](https://www.commandlinux.com/man-page/man1/sort.1.html), [grep](https://www.commandlinux.com/man-page/man1/grep.1.html) or [column](https://www.commandlinux.com/man-page/man1/column.1.html).

8. (pdf/globe icon) Toggles between the available output formats for processing and preview, if more than one routine is set for the type of file being edited. The globe represents HTML output, and the PDF icon, obviously, represents PDF output.

9. (play) Processes the current document one time, and updates the preview if it is open.

10. (play with surrounding circle) Toggles on/off automatic processing and previewing; when on, the file will be saved after typing is paused, and processed, and the preview updates.

11. (eye) Toggles the preview window open or closed.

12. (mobile device with down arrow) Converts the file to epub format (if a routine for it is set), and downloads the resulting epub.

13. (loudspeaker) Uses a TTS system to read the file being edited out loud, line by line, starting with the line the cursor is on. (This is primarily meant to help with proofreading, but could also be used for accessibility purposes.)

The preview window also has buttons. For html, it currently only has a download button for the html file. For PDF, it has buttons for moving from page to page (as well as a slider), and for zooming in and out, and resetting the zoom.

## Keybindings

Here is a partial list of the keybindings for various functions.

| 
| **Alt-5**: Move cursor to matching bracket/parenthesis
| **Alt-j**: Jump to last line marked with Alt-m
| **Alt-l**: Select current line
| **Alt-m**: Mark line as jump-to position
| **Alt-n**: Go to specific line
| **Alt-t**: Toggle fold/unfold on current block
| **Alt-w**: Toggle line wrapping
| **Alt-/**: Toggle selected text or current line as a comment
| **Alt-|**: Pipe text to unix command
| **Alt-↑**: Move current line up
| **Alt-↓**: Move current line down
| **Alt-<**: Indent less
| **Alt->**: Indent more
| **Ctrl-a**: Select all
| **Ctrl-c**: Copy
| **Ctrl-d**: Duplicate current line
| **Ctrl-f**: Open find/replace panel
| **Ctrl-g**: Find next
| **Ctrl-Shift-g**: Find previous
| **Ctrl-k**: Delete to end of line
| **Ctrl-j**: Join the currently selected lines into one line
| **Ctrl-r**: Open find/replace panel
| **Ctrl-s**: Save
| **Ctrl-v**: Paste
| **Ctrl-x**: Cut, or cut whole line if nothing selected
| **Ctrl-y**: Redo
| **Ctrl-z**: Undo
| **Ctrl-/**: Toggle comment
| **Ctrl-|**: Pipe text to unix command
| **Ctrl-[**: Indent less
| **Ctrl-]**: Indent more
| **Ctrl-↑**: Insert line above
| **Ctrl-↓**: Insert line below
| **Ctrl-Alt-[**: Fold all foldable blocks
| **Ctrl-Alt-]**: Unfold all foldable blocks
| **Ctrl-Shift-[**: Fold current line’s block

Things like Home and End also behave as they should, etc.