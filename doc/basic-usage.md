
# Open Guide Editor (OGE) Documentation

# Basic Usage, Buttons and Keybindings

For the most part, use of the editor as a text editor, should be straightforward, as it is based on [codemirror's basic setup](https://codemirror.net/docs/ref/#codemirror.basicSetup), which provides sane defaults for regular text editing.

OGE builds upon by providing a back-end for saving, processing and previewing.

These functions can be invoked either by clicking on buttons on the toolbar, or

## Buttons

![oge-buttons.png]()

The top panel, when full, looks like the above. They do the following:

1. (disk) Saves the current file, without any processing.

2. (checkmark and seal) Commits the current state of the file's git folder, assuming it has one, with a message provided to a prompt.

3. (open folder) Opens a new file, usually in another tab, unless the current document is unnamed and empty.

4. (wrapped lines) Toggles line wrapping on or off.

5. (random characters) Brings up a panel for inserting special characters, mostly logical and mathematical symbols and Greek letters.

6. (looking glass) Brings up a dialog for search/replace.

7. (terminal prompt) Pipes either the selected text, or the whole file if nothing is selected, through a Unix command on the server, and changes it for the result. Useful for things like [sort](), [grep]() or [column]().

8. (pdf/globe icon) Toggles between the available output formats for processing and preview, if more than one routine is set for the type of file being edited. The globe represents HTML output, and the PDF icon, obviously, represents PDF output.

9. (play) Processes the current document one time, and updates the preview if it is open.

10. (play with surrounding circle) Toggles on/off automatic processing and previewing; when on, the file will be saved after typing is paused, and processed, and the preview updates.

11. (eye) Toggles the preview window open or closed.

12. (mobile device with down arrow) Converts the file to epub format (if a routine for it is set), and downloads the resulting epub.

13. (loudspeaker) Uses a TTS system to read the file being edited out loud, line by line, starting with the line the cursor is on. (This is primarily meant to help with proofreading, but could also be used for accessibility purposes.)
