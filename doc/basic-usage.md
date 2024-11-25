# Open Guide Editor (OGE) Documentation

# Basic Usage, Buttons and Keybindings

For the most part, use of OGE as a text editor, should be straightforward, as it is based on [codemirror’s basic setup](https://codemirror.net/docs/ref/#codemirror.basicSetup), which provides sane defaults for regular text editing.

OGE builds upon this by providing a back-end for saving, processing and previewing. You will need to **enable pop-ups** for the site serving the editor to see the preview window.

These functions can be invoked either by clicking on buttons on the top or bottom panels, or via keybindings.

## Panels and Buttons

There is a panel at the top and a panel at the bottom. By and large, the buttons on the *top* panel apply to all open files in the session together. The ones at the *bottom* are specific to the file or even specific to a split (if split view is enabled).

The panels have these components.

![oge top panel](https://github.com/user-attachments/assets/c69a4f05-773b-4272-8cf9-1507efd3e8a7)

1. (open folder) This button opens the side panel where you can open (or create) additional files within the session directory.

2. (disk) Saves all unsaved files, without doing any processing.

3. (globe) Toggles between output types. This button may not be present if OGE does not yet know what the root document is, or if there is only one (or zero) possible output types for the root document. What icon is shown can be determined in the settings, but otherwise a globe is shown for html, a square with "PDF" written in it for pdf output, etc.

4. (play) Processes the current file one time, and updates the preview if it is open.

5. (play with surrounding circle) Toggles on/off automatic processing and previewing; when on, the file will be saved after typing is paused, and processed, and the preview will update.

6. (eye) Toggles the preview window open or closed.

7. (tab/oval) Each open file resides in an editor "tab", and can be switched to by clicking the oval with its filename. The filename shown is relative to the base session directory.

8. (tab/disk) The disk next to the filename indicates whether or not the file in the tab is saved. If unsaved, the disk will pulse a magenta color.

9. (tab/eye) Indicates whether a given tab is currently shown. If shown, clicking the eye will hide the tab. If not, clicking the eye will open the tab on the right side of screen, while the current tab is still shown. See [editing multiple files](#user-content-editing-multiple-files) below.

10. (tab/x) Closes the tab.

11. (speaker) Activates text to speech for certain file types. The current line will be read aloud, and it will then move on to the next, etc., until it is  turned off (by clicking again).

12. (cog) Opens the settings panel for configuring color scheme, editor font and autoprocessing delay.

  ![oge bottom left panel](https://github.com/user-attachments/assets/393b0838-9157-42ed-b21a-638989bb3c96)

13. (notch) Opens a field in which a git commit message can be entered. If the session directory has a `.git` subdirectory, a git commit with that message will be created, and in the background, pushed upstream. Clicking again will restore the find/replace fields.

14. (filter) Opens a field in which a unix command can be entered, which the current selection in the editor will be piped through. Useful for things like [sort](https://www.commandlinux.com/man-page/man1/sort.1.html), [grep](https://www.commandlinux.com/man-page/man1/grep.1.html) or [column](https://www.commandlinux.com/man-page/man1/column.1.html). For example, entering `sort` will sort the selection, or `grep -v hello` will remove all selected lines containing "hello". Clicking again restores the find/replace fields.

15. (find) The input field for the find function. What is entered is treated as a [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions). (Do not enter the slashes.)

16. (left/right chevrons) Buttons for "find next" and "find previous".

17. (find/double checkmarks) Finds everything matching the find field and selects each match multi-cursor-style, so that all can be manipulated at once.

18. (replace) The input field for replacing. Back-references to parts of the find field enclosed in parentheses can be done with `\1`, `\2`, etc.

19. (right chevron) Find next: replaces the next text matching the find field with what is in the replace field.

20. (replace/double checkmarks) Replace all: Replaces all instances matching the find field with the replacement. If part of the document is selected, it will be applied only within the selection.

    ![btmright1](https://github.com/user-attachments/assets/ced26e36-7378-406f-a140-60c5fd96031b)

21. (split panes) Toggles split view between single pane, vertical panes, and horizontal panes, for the same file/tab.

22. (glyphs) Toggles a panel for inserting special symbols or glyphs, mostly logical and mathematical symbols and Greek letters.

23. (info box) Toggles the dialog panel at the top of the editor tab used for things like reporting errors open (or closed). This can be used, for example, to see an error message again after it has been closed.

24. (wrapped lines) Toggles line wrapping for long lines of text on or off.

25. (arrow and box) Forward jump: Moves the preview for pdfs to the page corresponding to the current line in the editor. This is only available for pdf output with those input formats that support it (i.e., LaTeX files using SyncTeX). Otherwise, this button will not appear.

26. (line number input) Shows the current line number of the cursor. Manually entering a value here can be used to go to a specific line.

27. (column number input) Like the line number indicator but for columns.

The preview window also has buttons. For html and other files viewable in a browser, it currently only has a download button for the previewed file. For pdf, it has buttons for moving from page to page (as well as a slider), and for zooming in and out, and resetting the zoom. Hopefully it is obvious which one is which.

## Keybindings

Here is a partial list of the keybindings for various functions.

| Key                   | Function                                                                  |
| --------------------- | ------------------------------------------------------------------------- |
| **End**               | Go to end of line                                                         |
| **Escape**            | Close left/right panel, clear search highlights or selection              |
| **Home**              | Go to start of line                                                       |
| **Tab**               | Indent more                                                               |
| **Enter**             | Accept autocompletion or new line                                         |
| **Shift-Tab**         | Auto-reindent selection                                                   |
| **Alt-F5/Ctrl-F5**    | Save/process files and update preview                                     |
| **ALt-F6/Ctrl-F6**    | Open or close the preview window                                          |
| **Alt-F7/Ctrl-F7**    | Toggle auto-process/auto-preview                                          |
| **Alt-F8/Ctrl-F8**    | Synctex forward jump from current line number (currently tex→pdf only)    |
| **Alt-1**             | Insert template 1 (see [templates](./settings.md#templates))              |
| **Alt-2**             | Insert template 2                                                         |
| **Alt-3**             | Insert template 3                                                         |
| **Alt-4**             | Insert template 4                                                         |
| **Alt-5**             | Move cursor to matching bracket/parenthesis                               |
| **Alt-a**             | Toggle auto-process/auto-preview                                          |
| **Alt-b**             | Unhighlight search matches                                                |
| **Alt-c**             | Insert special character                                                  |
| **Alt-d**             | Toggle dialog/error panel                                                 |
| **Alt-f**             | Toggle fold/unfold on current block                                       |
| **Alt-g**             | Go to specific line                                                       |
| **Alt-h**             | Toggle no split view/vertical split/horizontal split                      |
| **Alt-j**             | Jump to last line marked with Alt-m                                       |
| **Alt-l**             | Select current line                                                       |
| **Alt-m**             | Mark line as jump-to position                                             |
| **Alt-n**             | Go to specific line                                                       |
| **Alt-o**             | Toggle preview/process output format                                      |
| **Alt-p**             | Open or close the preview window                                          |
| **Alt-q**             | Close editor tab                                                          |
| **Alt-r**             | Rotate tabs clockwise                                                     |
| **Alt-Shift-r**       | Rotate tabs counterclockwise                                              |
| **Alt-s**             | Save/process files and update preview                                     |
| **Alt-t**             | Toggle fold/unfold on current block                                       |
| **Alt-u**             | Insert special character                                                  |
| **Alt-v**             | Toggle current tab visibility                                             |
| **Alt-w**             | Toggle line wrapping                                                      |
| **Alt-x**             | Center cursor vertically                                                  |
| **Alt-z**             | Toggle tab in master or stack                                             |
| **Alt-/**             | Toggle selected text or current line as a comment                         |
| **Alt-\|**            | Pipe text to unix command                                                 |
| **Alt-↑**             | Move current line up                                                      |
| **Alt-↓**             | Move current line down                                                    |
| **Alt-←**             | Move to previous sentence                                                 |
| **Alt-→**             | Move to next sentence                                                     |
| **Alt-minus**         | Toggle no split view/vertical split/horizontal split                      |
| **Alt-Tab**           | Switch to next editor tab                                                 |
| **Alt-Shift-Tab**     | Switch to previous editor tab                                             |
| **Ctrl-a**            | Select all                                                                |
| **Ctrl-b**            | Unhighlight search matches                                                |
| **Ctrl-c**            | Copy                                                                      |
| **Ctrl-d**            | Duplicate current line                                                    |
| **Ctrl-f**            | Focus find/replace panel                                                  |
| **Ctrl-g**            | Find next                                                                 |
| **Ctrl-Shift-g**      | Find previous                                                             |
| **Ctrl-h**            | Toggle no split view/vertical split/horizontal split                      |
| **Ctrl-i**            | Select current paragraph or block                                         |
| **Ctrl-j**            | Join the currently selected lines into one line                           |
| **Ctrl-k**            | Delete to end of line                                                     |
| **Ctrl-m**            | Make git commit                                                           |
| **Ctrl-o**            | Open file tree panel                                                      |
| **Ctrl-p**            | Open settings panel                                                       |
| **Ctrl-r**            | Focus find/replace panel                                                  |
| **Ctrl-s**            | Save all files                                                            |
| **Ctrl-u**            | Delete to start of line                                                   |
| **Ctrl-v**            | Paste                                                                     |
| **Ctrl-x**            | Cut, or cut whole line if nothing selected                                |
| **Ctrl-y**            | Redo                                                                      |
| **Ctrl-z**            | Undo                                                                      |
| **Ctrl-/**            | Toggle selected text or current line as a comment                         |
| **Ctrl-\|**           | Pipe text through unix command                                            |
| **Ctrl-[/Alt-[**      | Indent less                                                               |
| **Ctrl-]/Alt-]**      | Indent more                                                               |
| **Ctrl-</Alt-<**      | Indent less                                                               |
| **Ctrl->/Alt->**      | Indent more                                                               |
| **Ctrl-→**            | Move to next word                                                         |
| **Ctrl-←**            | Move to previous word                                                     |
| **Ctrl-↑**            | Insert line above                                                         |
| **Ctrl-↓**            | Insert line below                                                         |
| **Ctrl-End**          | Go to end of file                                                         |
| **Ctrl-Home**         | Go to start of file                                                       |
| **Ctrl-Alt-t**        | Toggle current tab visibility                                             |
| **Ctrl-Alt-j**        | Synctex forward jump from current line number (currently tex→pdf only)    |
| **Ctrl-Alt-[**        | Fold all foldable blocks                                                  |
| **Ctrl-Alt-]**        | Unfold all foldable blocks                                                |
| **Ctrl-Shift-[**      | Fold current line’s block                                                 |
| **Ctrl-Shift-]**      | Unfold current line’s block                                               |
| **Ctrl-Alt-→**        | Move tab clockwise                                                        |
| **Ctrl-Alt-↓**        | Move tab clockwise                                                        |
| **Ctrl-Alt-←**        | Move tab counterclockwise                                                 |
| **Ctrl-Alt-↑**        | Move tab counterclockwise                                                 |


## Additional User Interface Niceties

**Ctrl-mouse click**: Creates another cursor instead of moving the current one. This allows you to type the same thing at multiple places. Similarly, ctrl-click and selecting can be used to create multiple selections, which you can change together. The double checkmark button on the find panel similarly creates multiple selections. (Close the panel using the x on the right to return focus to the editor without moving the cursors.)

**Alt-mouse click + drag**: Creates a “rectangular” selection, useful for working with, e.g., columns of a table.

**Code folding**: If there are little arrow markers next to a line number of the left, these can be used to fold (hide) or unfold (show) parts of a file. This is not particularly useful in markdown except in yaml blocks, code blocks, and quotations, though it is possible to hide whole sections of a document as well.

## Citations

For markdown files, if a bibliography is (or multiple bibliographies are) set for the project in the [settings](./settings.md), if a `@` is typed to begin a [pandoc-style citation](https://pandoc.org/MANUAL.html#citation-syntax), an autocomplete list of keys from the bibliography should pop up. It should filter down as you type. Use the arrow keys to select, and press enter to insert one of the autocompletions.

## Sessions and Root Files

Each browser tab of OGE is related to a given *session*, which is tied to a given directory. All files that can be edited in that session must be within this directory or one of its subdirectories. It is assumed they are parts of the same project. See the [sessions documentation](./sessions.md) for more details.

One of these files is considered the "root" file. This is the file that is targeted for processing to create the live previews. You might be simultaneously editing an html file and a css file it uses. The html file should be considered the root file, or root document, as it is what you want to preview. The css file is subsidiary, and changes to it are previewed through the html file. Or you might be editing a LaTeX file, as well as a file included with it by `\include` or `\input`. The file doing the including would be the root file, and the included one a subsidiary file.

The root file can be configured in the settings for the directory or session. (See the [settings documentation](./settings.md).) If left unset, whichever file is active when processing is first initiated will be treated as the root.

## Aesthetic Options

Opening the right settings panel (by clicking on the cog or the Ctrl-p keybinding) allows the user to change the colorscheme, or editor font. These choices will be remembered if the same session is opened again.

## Editing Multiple Files

The same browser tab of OGE can be used to edit more than one file at once. When files are opened normally, they appear in separate tabs, and all tabs are listed on the top panel. Tabs can be switched between by clicking on their listing in the top panel, or with the Alt-tab keybinding.

If the "eye" in the list item for a tab is clicked, instead of switching to that tab and showing only it, the tab will appear in a smaller pane on the right of the current tab. Both files stay visible and can be edited together. The layout is akin to the "master-stack" layout of some tiling window managers. The main file being edited appears on the left, in a full size font. Any additional viewed files appear in a vertical stack on the right.

You can switch which tab is in the "master" position and which appear on the "stack" by using the Alt-z keybinding, or the keybindings for moving or rotating tabs.

The sizes are optimized for both master and stack to show around 80 character columns when the browser window fills a 1920×1080 screen. Unfortunately, at present, the relative size of the editing panes cannot be changed. Perhaps this feature will be added in the future.

## Split Panes

Within a given tab for an individual file, it is possible to have split panes showing different parts of the same file at once. This is enabled by clicking the split pane button at the bottom of the tab, or the Alt-h/Alt-minus keybindings. These alternate between no split, a vertical split, and a horizontal split. The two panes should keep in sync with one another as changes are made.

## Other Documentation

See also the other documentation files concerning [configuring the editor’s settings](./settings.md), working with [sessions](./sessions.md), and [installation](./installation.md).

## License

Copyright 2023–2024 © Kevin C. Klement. This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).
