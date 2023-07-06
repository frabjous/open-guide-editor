
# Open Guide Editor (OGE) Documentation

# User Configuration and Settings

## Overview

OGE aims to be very user-configurable. Configuration is done by means of [json files](https://www.json.org/json-en.html). Each time a file is loaded or processed i, the following files are checked for configuration options.

1. The file `oge-settings.json` in the same folder as the file, or any parent folder to which oge has access.
2. The file `settings.json` in the main `open-guide-editor/` folder.
3. The file `default-settings.json` in the main `open-guide-editor/` folder.

Settings from these files are merged, with the settings in (1) overriding those of (2), and with those of (2) overriding those of (3). If you do not wish to change something from the default settings, you need not include it in (1) or (2); the defaults from (3) will then be applied.

**Project-specific settings** should be done in the `oge-settings.json` file for the folder for the project.

**Site or installation-wide settings** should be done in `settings.json`.

**Sane defaults** are provided for you in `default-settings.json`, though there are some [recommendations for alternatives](#recommendations) below.

To create your own `settings.json` you can copy `default-settings.json` to `settings.json`, change what you wish to change, and remove anything you wish to keep at the default setting.

Creating your own settings in many cases requires knowledge of linux/unix command line utilities.

## Project-Specific Settings and Alternative Main Files for Previewing

These can be achieved by creating a `oge-settings.json` file in the same folder as the files you’re working on.

One important use for this is setting an alternative "main" or "root" file: this is the file that will actually be processed for previewing. You might, however, be working on a subsidiary file, e.g., a LaTeX file introduced with `\include{filename}`, or a css file for styling an html or markdown file.

Setting a root document will result in the file set as root being the one previewed, even if you are working on another file in the project's folder. A simple version of `oge-settings.json` could look like this:

```json
{
    "rootdocument": "main.md",
    "bibliographies": ["references.json"]
}
```

You can also provide a list (array) of bibliography files, which should be CSL json files, the keys of which will be used for [citation autocompletion](https://github.com/frabjous/open-guide-editor/blob/main/doc/basic-usage.md#citations) for markdown files. See the example above.

**Important note**: If the file extension of the root document differs from the file being edited, it is the *root document*'s extension that will determine what routine is used, not the extension of the file being edited. See [routines](#routines) below.

However, these options need not be given, and the `oge-settings.json` can be used to override any settings in `settings.json` or `default-settings.json` discussed below. Or if no special options or commands need to be set for the project, an `oge-settings.json` file need not be used at all.

For example, if you wanted to change the autoprocessing delay for one project, and make use of two bibliographies, both for autocompletion, and when processing markdown files to pdf, but without settig an alternative root/main document, one might use an `oge-settings.json` file like this:


```json
{
    "bibliographies": ["references.json", "bib.json"],
    "autoprocess": { "delay": 200 },
    "routines": {
        "md": {
            "pdf": {
                "command": "pandoc -f markdown -t pdf --citeproc --bibliography references.json --bibliography bib.json %rootdocument -o %outputfile%"
            }
        }
    }
}
```

## Routines

In addition to changing the main file processed, the next most likely things users will want to customize are the processing “routines”. These can be customized in the json files, either in the project’s `oge-settings.json` or the site-wide `settings.json`.

Routines are listed in the json by the input file extension, and for each such extension, there is a list of possible output extensions. For example, one might use a configuration like this to use xetex instead of the default pdflatex when producing pdfs from LaTeX or markdown files:

```json
{
    "routines": {
        "tex": {
            "pdf": {
                "command": "xelatex -halt-on-error -interaction=batchmode -synctex=1 %rootdocument%"
            }
        },
        "md": {
            "pdf": {
                "command": "pandoc --pdf-engine xelatex %rootdocument% -o %outputfile%"
            }      
        }
    }
}
```

The following variables are filled in for you when the processing command is executed:

- `%rootdocument%`: The name of the main file being processed; this will be the same as the file edited unless a different root document is specified, as described above.
- `%outputfile%`: The name of the file. This can be explicitly set for the routine, but otherwise will be assumed to be the name of the root document with the extension change to the output extension.
- `%savedfile%`: The file currently being edited, and saved along with the processing job.

Note that quotation marks for the shell are automatically added around these variables. You should not add your own, or they will cancel each other out and possibly break the commands for filenames with spaces, etc.!

In addition to output extensions, the object for a given input extension can also contain a key for `"defaultext"`, i.e., the default output extension the editor will start having set, and `"spellcheck"` which is a boolean that enables or disables the browser’s built-in spell-check capabilites.

For example:

```json
{
    "routines": {
        "html": { 
            "spellcheck": false,
            "defaultext": "pdf",
            "pdf": {
                "command": "wkhtmltopdf --quiet %rootdocument% %outputfile%"
            }
        }
    }
}
```
This would set pdf as the default extension for processing html files, would turn off spellchecking when editing them, and replace weasyprint with wkhtmltopdf for creating the pdfs from the html files.

Routine commands can use any programs installed on the server which the server user can execute, and are passed through a shell, so shell operators such as pipes `|` and combinations with `&&` can be used.

You can use any file extension for the input, even those not already included in the default settings. For example, the following is a totally valid routine for previewing a simple php file that produces html, and will work as is.

```json
{
    "routines": {
        "php": {
            "html": {
                "command": "php %savedfile% > %outputfile%",
                "icon": "public"
            }
        }
    }
}
```

You could similarly create routines for javascript (`js`/`mjs`) files or `css` files, though in such cases this is usually unnecessary, and such files are likely to be used with main or root documents that OGE already has routines for. 

You can also use any file extension for the output. However, for output extensions that OGE doesn’t know how to preview, such as `epub`, OGE will create a download button for the generated file, rather than an option for the previewer. Currently OGE only knows how to preview html and pdf output files. (But pull requests for others are welcome!)

In addition to the `"command"` option, routines can set the following, though they are less likely to need customizing by the average user (except perhaps `"icon"` for new input extensions.

* `"icon"`: The Google Material Symbols icon name to display on the panel button to represent the output format (all lowercase with underscores instead of spaces)
* `"postprocess"`: A command that will be executed after the processing command. Note, however, that the `"postprocess"` option for pdf outputs is expected to output the number of pages to stdout, which the preview window uses for its slider display and buttons. You can include other commands in its postprocessing joined with `;` or `&&`, but they should be configured to be silent.
* `"forwardjump"`: a command that returns the page number corresponding to a line in the editor; this is used, e.g., for SyncTeX forward jumps with LaTeX-produced PDFs. Also respects the variable `%line%` for inserting the line the editor is currently focused on.
* `"reversejump"`: A command that can be executed in the pdf preview window by double-clicking, which should output something similar to what is outputted by `synctex edit`. The variable `%page%`, `%x%` and `%y%` can be used for the coordinates in the pdf clicked on, with 72 points per inch.
* `"getpagedimensions"`: The command used to get the dimensions of the pdf with 72 points per inch; it should print the number for the width on the first line of stdout, and the number for the height on the second line. This is needed before processing a reverse jump.

## Other Settings Options

For other settings, it is useful to compare the contents of `default-settings.json` to see what it contains. Here are the description of the other options you will find can fine-tune.

```json
{
    "accesskeyfile": "/tmp/oge-accesskeys.json"
}
```
This sets the location of the file where OGE saves its access keys. (See the [security documentation](https://github.com/frabjous/open-guide-editor/blob/main/doc/security.md) for more information about this.) This you should probably change in your `settings.json`, as the `/tmp` folder is not ideal if you want these to be persistent.

```json
{
    "autosave": {
        "interval": 300000,
        "directory": "/tmp"
    }
}
```
OGE can be configured to create an auto-save of files being edited to avoid losing work if the browser crashes. The interval sets how often in milliseconds this happens. The default, 300000, is 5 minutes. The directory specifies where the files are saved. This too you likely want to customize. Files are saved with their full path name but with '⁒' replacing the directory separator `/`. Files that haven't been named have autosaves with a name with `⁒autosave-2023-7-4-1688470336511` specifying the date and timestamp they were autosaved. If you set the interval to 0, it will disable auto-saving.

```json
{
    "readaloud": {
        "html" : {
            "command": "flite_cmu_us_slt -t \"$(pandoc -f html -t plain <<< %text%)\" -o /dev/stdout | lame - /tmp/oge-audio.mp3"
        },
        ⋮       
    }
}
```
The `"readaloud"` settings determine, for each input file type, how the mp3 that is read aloud by the loudspeaker button is created. The routine should take the variable `%text%`, which is the text of the line of the document being read, and create a file called `/tmp/oge-audio.mp3`. The default uses [flite](http://cmuflite.org/), or festival lite, which is easy to install on most servers, with a voice I like, along with [lame](https://lame.sourceforge.io/) for converting its output to mp3, but this option allows you to configure any TTS system that can be used to produce mp3s directly or indirectly.

```json
{
    "routines": {
        ⋮
    }
}
```

Routines are discussed [above](#routines), but see also the [recommendations](#recommendations) below.

```json
{
    "viewer": {
        "height": 500,
        "width": 900,
        "pdf": {
            "convertcommand": "mutool draw -F svg -o - %outputfile% %page%",
            "convertextension": "svg",
            "convertmimetype": "image/svg+xml"
        }
    }
}
```

These options determine the height and width of the viewer window when it is created (in pixels), though not every browser or operating system will respect them.

The `"pdf"` suboption determines how the pages that are displayed in the pdf preview are converted into an image file that the browser can display. You could use a different filetype, e.g., `png`, and set its mimetype (`image/png`), and/or use different conversion program. For most pdfs, however, `svg` is ideal, as it is a vector format and thus scalable without pixelation, and converting is usually quicker. In my experience, `mutool`'s svg conversion is faster at rendering pdfs as browser-displayable images than even a browser-native pdf viewer like Mozilla's pdfjs.

Pages are only converted and displayed when requested.

## Recommendations

For html output, only the html file itself can be viewed in the previewer. Separate files like css files and images will not be available (for security reasons). It is therefore useful to actually embed all resources needed into the html file. This is why the default routines for md→html and tex→html use `pandoc` with its `--standalone` and `--embed-resources` option. For viewing html output for html, this can be less than ideal, since it will filter everything through pandoc's conversion and you won’t be prevewing what you had meant to.

You could just use `touch %outputfile%` (which in fact is the default) as your routine to view the html file itself without modification, but then it won’t have the external resources available. An alternative might be to install something like [inliner](https://github.com/remy/inliner) for embedding other resources, but [due to a bug it requires some hacks to get working in scripts](https://github.com/remy/inliner/issues/151).

You could create a shell script entitled `myinliner.sh`. (Make it executable with `chmod a+x` and put it in your `$PATH`.)

```sh
#!/usr/bin/env bash
script --quiet --return --command 'inliner '"$1"' 2>/dev/null' /dev/null > "$2"
```

And then use:

```json
{
    "routines": {
        "html": {
            "html": {
                "command": "myinliner.sh %rootdocument% %outputfile%",
                "outputfile": "inline-file.html"
            }
        }
    }
}
```
Here it is necessary to specify the output filename explicitly to avoid overwriting the edited file.

Consider writing scripts and calling them in other routines if you need to do complex things with your files.

## Other Documentation

See also the other documentation files concerning [basic usage, buttons and keybindings](https://github.com/frabjous/open-guide-editor/blob/main/doc/basic-usage.md), [installation](https://github.com/frabjous/open-guide-editor/blob/main/doc/installation.md), and the [security model](https://github.com/frabjous/open-guide-editor/blob/main/doc/security.md).

## License

Copyright 2023 © Kevin C. Klement. This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).