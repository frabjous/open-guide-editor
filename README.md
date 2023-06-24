# open-guide-editor

Web based editor based on [codemirror](https://codemirror.net/) for editing markdown and LaTeX files with live updating HTML and PDF previews.

This is a sequel to, and will supersede, my earlier [K(ev)E(dit)](https://bitbucket.org/frabjous/ke) editor. It is meant for use with the [open-guide-typesetting-framework](https://github.com/frabjous/open-guide-typesetting-framework), though could be used independently.

The project is in early development. More documentation to come.



<!--
# Installation

1. Clone the repository.
2. Run `npm install` to install codemirror.
3. Create bundle script: node_modules/.bin/rollup js/editor.mjs -f iife -o editor.bundle.js -p @rollup/plugin-node-resolve

Note: Since tab it captured by the editor and not passed to the browser or OS, if you need to use tab to avoid the “no keyboard trap”, you can press Escape, then tab.
=i

#####################3
# KE = k(ev)e(dit) = Kevin’s editor

KE is a PHP backend for the [codemirror](https://codemirror.net) browser based text editor, along with helper scripts, allowing files to be saved and post-processed. Although you can use it to edit any text file, it can provide for live-updating-as-you-type previews of the output of LaTeX, Markdown and HTML documents. It can also do text-to-speech on such files, which is useful for proofreading.

It can be integrated with other web apps, and was designed with the [Journal Tools](https://bitbucket.org/frabjous/journal-tools/) typesetting framework, used by the *Journal for the History of Analytical Philosophy*.

## Requirements and Installation

KE requires the following external programs:

* A PHP-enabled web server, using PHP 7+. (The PHP testing server suffices for use on localhost.)
* The following programs, accessible in the `$PATH` of the server PHP user: [flite](http://www.festvox.org/flite/) and [lame](http://lame.sourceforge.net/) (for the text-to-speech features), the core binaries from [TeXlive](https://www.tug.org/texlive/) (for processing LaTeX files), [rubber](https://launchpad.net/rubber/) (for processing LaTeX errors),  [pandoc](https://pandoc.org/) (for processing Markdown files), and the mupdf project’s [mutool](https://mupdf.com/index.html) (for converting PDF pages to images that can be displayed in a browser).
* Two helper libraries of mine, [KCKlib](https://bitbucket.org/frabjous/kcklib) and [KCK Icons](https://bitbucket.org/frabjous/icons), which are expected be installed in folders named `kcklib/` and `icons/` in immediate subfolders of the web server root directory.
* Clone this git repo with `git clone https://bitbucket.org/frabjous/ke.git`; the resulting folder, placed on your webserver, should work as is; you may delete the hidden `.git` subfolder after installation if you wish.
* [codemirror](https://codemirror.net), should be installed in a subfolder of the `ke/` folder named `codemirror/`; e.g., if `ke` is installed at `https://your.server/ke/`, then `https://your.server/ke/codemirror/lib/codemirror.js` when called from the `ke/` folder should find the file in question.
* Works best with up-to-date Firefox and Chromium.

## Configuration

Because this runs on a webserver, and files on the server may be edited, it is important to control  what web users can edit. Read and write access is controlled by two PHP session variables:

 * `$_SESSION["_ke_poweruser"]`: if set to `true`, the session user can read and edit any file that the webserver user can. (It would be best not to run the server as root!)
 * `$_SESSION["_ke_allowed_folders"]` is an array of folders on the server a non-power-user can access and edit, including all subfolders of these folders.
 
The *default* behavior is to to make a user on `localhost` a poweruser, but allow no access to remote users. However, the variables above can be set differently by other scripts on the server, in the usual way, and you can override the default behavior by placing a PHP file called `authenticate.php` in the KE subfolder or webserver root, which will be read prior to any write-commands on the server. This should be a standard PHP script that makes the appropriate modifications to the variables above, perhaps by redirection to a login page, which then sets the variables appropriately before redirecting back.

For markdown, if the file `ftplugin/markdown/pandoc-preview-options.json` exists, taking the form:
 
```json
{
    "pandoc_css": "/path/to/my_stylesheet.css",
    "pandoc_resource_path": "/path/to/resource/folder/"
}
```

Then the specified css file will be added to all pandoc output, and the specified folder will be used as a resource folder (containing common images, for example, such as a signature).

Additional filetype plugins can be created by creating subfolders of the ftplugin folder, with folder and filenames `type/type.js` matching codemirror mode names, and will be automatically loaded.

## Usage

If the scripts are installed, for example, in the `ke/` subfolder of the webserver root, then visit `http(s)://yourserver/ke/`. To open a file, use the open button, or else provide its filename using the `file=` query string parameter, with the filename, urlencoded, e.g., `http(s)://yourserver/ke/?file=%2Fhome%2Fmyfolder%2Ffilename.txt` to open `/home/myfolder/filename.txt`. Many file types will be automatically detected, and the appropriate syntax highlighting, etc., applied. Additions can be added by changing `libke.php`.

The standard codemirror key bindings should work. (E.g., Ctrl-F to find, Ctrl-S to save, etc.)

The following buttons are available for every file type:

![](https://logic.umasscreate.net/icons/mono/save.svg)  Save file (Ctrl-S)

![](https://logic.umasscreate.net/icons/mono/folder_open.svg)  Open file (in new window)

![](https://logic.umasscreate.net/icons/mono/font.svg)  Change UI font (Local host only)

![](https://logic.umasscreate.net/icons/mono/wrap.svg) Toggle wrapping long lines

![](https://logic.umasscreate.net/icons/mono/find.svg) Find (Ctrl-F)

![](https://logic.umasscreate.net/icons/mono/findnext.svg) Find Next (Ctrl-G)

![](https://logic.umasscreate.net/icons/mono/replace.svg) Replace (Ctrl-R)

![](https://logic.umasscreate.net/icons/mono/terminal.svg) Pipe selected text (or all text) through UNIX command; replace with result Ctrl-\|)

![](https://logic.umasscreate.net/icons/mono/exitapp.svg) Insert another file and replace selected text (or all text)

The following buttons are only available for some file types, depending on what has been set up as a file type plugin.

![](https://logic.umasscreate.net/icons/mono/braces.svg) Replace document or selection with LaTeX template 

![](https://logic.umasscreate.net/icons/mono/code.svg) Replace document or selection with HTML/PHP template 

![](https://logic.umasscreate.net/icons/mono/play.svg) Compile or build document and update preview 

![](https://logic.umasscreate.net/icons/mono/playcircle.svg) Toggle auto-compilation/auto-update-preview

![](https://logic.umasscreate.net/icons/mono/volup.svg) Toggle on/off text-to-speech player

![](https://logic.umasscreate.net/icons/mono/globe.svg) Toggle preview for HTML/Markdown files

![](https://logic.umasscreate.net/icons/mono/pdf.svg) Toggle preview of PDF for LaTeX files

![](https://logic.umasscreate.net/icons/mono/alert.svg) View errors in previous compilation

![](https://logic.umasscreate.net/icons/mono/jump.svg) SyncTeX forward search (Jump to corresponding place in PDF)


Keep in mind that with auto-compilation turned on, the document is also auto-saved when edited; keep a backup if needed.

To conduct a SyncTeX reverse search, double click the place on the PDF preview you wish to view in the source. 
-->
## License

© 2018–2023 Kevin C. Klement. This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).
