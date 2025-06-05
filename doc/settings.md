
# Open Guide Editor (OGE) Documentation

# User Configuration and Settings

## Overview

OGE aims to be very user-configurable. Configuration is done by means of [json files](https://www.json.org/json-en.html). A given instance of OGE running in a browser, or most server-side transactions, make use of settings that can be defined in any one of three places.

1. Overrides for the settings in the current session file. See the [sessions](./sessions.md) documentation for more info on overrides.
2. A file named `oge-settings.json` in either the same directory as the files being edited, or one of their parent directories.
3. The site-wide settings found when the server starts. These are usually taken from the file `$HOME/.config/oge/settings.json` (where `$HOME` is the home directory of the user running the server app).

The settings are merged, with the settings in (1) overriding those of (2), and with those of (2) overriding those of (3).

**Session setting-overrides** (1) should be used sparingly, for temporary changes not suitable every time the project is worked on. They might also be used if the server administrator wishes to override settings for individual users or use cases.

**Project-specific settings** should be done in the `oge-settings.json` file for the directory for the project (2).

**Site or installation-wide settings** should be done in `settings.json` in the base configuration directory (3).

If the `settings.json` file (3) is not found when the server starts, it will be created by copying the file `default-settings.json` in this repo's main directory. This provides you with sane defaults which can later be tweaked. Things can be removed if features are undesired or the necessary external applications are unavailable.

After the file is created, it can be customized to suit the needs and resources of the site making use of OGE. If changes are made to (3), the server app will need to be restarted in order for them to apply. For this reason, it is usually better to modify project specific `oge-settings.json` files (2) for routine or on-the-fly changes, rather than changing the site-wide settings in (3).

Typically the settings for (3) are looked for (or created) in `$HOME/.config/oge/settings.json`. However, the environmental variable OGESETTINGS can be used to change it. E.g., `OGESETTINGS=altsettings.json` will cause the router to look for `$HOME/.config/oge/altsettings.json` instead. To place it in a completely different location, one can use something like `OGESETTINGS=/path/somewhere/else/settings.json` to use the settings found in `/path/somewhere/else/settings.json`.

Changes made to the `oge-settings.json` file in the project directory will take place immediately after it is saved *if* this file is edited and saved from within OGE itself. Otherwise, the page needs to be reloaded for them to take effect.

It is not necessary to copy `settings.json` or `default-settings.json` to create an `oge-sessions.json` file. One needs to include only those things that need to be changed from the site-wide defaults.

Creating your own settings requires some knowledge of linux/unix command line utilities.

## Project-Specific Settings and Alternative Main Files for Previewing

These can be achieved by creating an `oge-settings.json` file in the directory for the project or session.

One important use for this is setting an alternative “main” or “root” file: this is the file that will actually be processed for previewing. You might be working on a subsidiary file, e.g., a LaTeX file introduced with `\include{filename}`, or a css file for styling an html or markdown file. In such cases, it is necessary to specify which file is the one that needs to be processed to create the actual preview. This can be specified using the `"rootdocument"` setting. The filename should be relative to the session directory, i.e., where `oge-settings.json` is located.

A simple version of `oge-settings.json` could look like this:

```json
{
  "rootdocument": "main.md",
  "bibliographies": ["references.json"]
}
```

For markdown, you can provide a list (array) of bibliography files, which should be [CSL json](https://citeproc-js.readthedocs.io/en/latest/csl-json/markup.html) files, the keys of which will be used for [citation autocompletion](./basic-usage.md#citations) when editing the markdown. See the example above.

**Important note**: If the file extension of the root document differs from the file being edited, it is the *root document*’s extension that will determine what routine is used, not the extension of the file being edited. See [routines](#routines) below.

However, OGE works perfectly well without an `oge-settings.json` file if no special options or commands need to be set for the project, and the site-wide defaults suffice on their own. If no root document is set, OGE will treat whichever file is being edited when processing is first triggered as the root document.

If you wanted to change the autoprocessing delay for one project, and make use of two bibliographies for autocompletion, but without setting an alternative root/main document, you might use an `oge-settings.json` file like this:

```json
{
  "bibliographies": ["references.json", "bib.json"],
  "autoprocess": { "delay": 200 },
  "routines": {
    "md": {
      "pdf": {
        "command": "pandoc -f markdown -t pdf --citeproc --bibliography references.json --bibliography bib.json %rootdocument% -o %outputfile%"
      }
    }
  }
}
```

## Routines

In addition to changing the main file processed, the next most likely things users will want to customize are the processing “routines”. These can be customized in a project’s `oge-settings.json`, or else will fall back to what is set in the site-wide `settings.json`.

Routines are listed in the json by the input file extension, and for each such extension, there is a list of possible output extensions. For example, one might use a configuration like this to use xelatex instead of pdflatex when producing pdfs from LaTeX or markdown files:

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

One use for customizing routines would be to make use of other pandoc options or filters. For example, to enable the [Fregeifier](https://github.com/frabjous/fregeifier) pandoc filter to allow Frege’s logical notation (or other complex mathematics) to be supported when converting md to html, one might include something like this:

```json
{
  "routines": {
    "md": {
      "html": {
        "command": "pandoc --standalone --embed-resources --filter /path/to/fregeifier/fregeifier_pandoc_filter.php  %rootdocument% -o %outputfile%"
      }
    }
  }
}
```

The following variables are filled in when the processing command is executed:

- `%rootdocument%`: The name of the main file being processed, as described above.
- `%outputfile%`: The name of the output file. This can be explicitly set for the routine, but otherwise will be assumed to be the name of the root document with the extension changed to the output extension.
- `%savedfile%`: The file currently being edited. As it is possible to edit multiple files at once, it is possible the wrong one may be identified in some cases, so it is best not to rely on this.

Note that quotation marks for the shell are automatically added around these variables. You should not add your own, or they will cancel each other out and possibly break the commands for filenames with spaces, etc.

In addition to output extensions, the object for a given input extension can also contain a key for `"defaultext"`, i.e., the default output extension the editor will start out having set, and `"spellcheck"`, which is a boolean that, if true, enables the browser’s built-in spell-check capabilities.

For example:

```json
{
  "routines": {
    "html": {
      "spellcheck": true,
      "defaultext": "pdf",
      "pdf": {
        "command": "wkhtmltopdf --quiet %rootdocument% %outputfile%"
      }
    }
  }
}
```

This would set pdf as the default extension for processing html files, would turn on spellchecking when editing them, and replace weasyprint with wkhtmltopdf for creating pdfs from html files.

Routine commands can use any programs installed on the server which the server user can execute, and are passed through a shell, so shell operators such as pipes `|` and combinations with `&&` can be used.

You can use any file extension for the input, even those not already included in the default settings. For example, the following is a totally valid routine for previewing a simple php file that produces html, and will work as is.

```json
{
  "routines": {
    "php": {
      "html": {
        "command": "php %savedfile% > %outputfile%"
      }
    }
  }
}
```

You could similarly create routines for javascript (`js`/`mjs`) files or `css` files, though this is usually unnecessary. Such files are likely to be used with html main or root documents, which OGE already has routines for.

You can also use any file extension for the output. However, for output extensions that OGE cannot preview in a browser window, such as `epub`, OGE will create a download button for the generated file, rather than a preview.

In addition to the `"command"` option, routines can set the following, though they are less likely to need customizing by the average user (except perhaps `"icon"` for new output extensions).

* `"icon"`: The [Google Material Symbols](https://fonts.google.com/icons) icon name to display on the panel button to represent the output format (all lowercase with underscores instead of spaces).
* `"postprocess"`: A command that will be executed after the processing command. Note, however, that the `"postprocess"` option for pdf outputs is expected to output the number of pages to stdout, which the preview window uses for its slider display and buttons. You can include other commands in its postprocessing joined with `;` or `&&`, but they should be configured to be silent.
* `"forwardjump"`: a command that returns the page number corresponding to a line in the editor; this is used, e.g., for SyncTeX forward jumps with LaTeX-produced PDFs. Also respects the variable `%line%` for inserting the line the editor is currently focused on.
* `"reversejump"`: A command that can be executed in the pdf preview window by double-clicking, which should output something similar to what is outputted by `synctex edit`. The variables `%page%`, `%x%` and `%y%` can be used for the coordinates in the pdf clicked on, with 72 points per inch.
* `"getpagedimensions"`: The command used to get the dimensions of the pdf page in 72 points per inch as the unit; it should print the number for the width on the first line of stdout, and the number for the height on the second line. This is needed before processing a reverse jump.

In addition to regular output extensions, there is a special pseudo-output-extension `ogeurl` that can be used if the output is best viewed not as a single file, but as changes made to a site accessible with a url. The previewer can be set to show this page in a frame, and reload it whenever processing finishes. This makes use of an additional `"url"` setting in the routine.

```json
{
  "rootdocument": "faq.md",
  "routines": {
    "md": {
      "ogeurl": {
        "command": "pandoc -f markdown -t html --standalone %rootdocument% -o public_html/faq/index.html",
        "url": "https://localhost:8181/faq/"
      }
    }
  }
}
```

## Checking Files on Save

It is often useful to check the syntax of a file when it is saved to ensure it does not contain errors. This can be done using a syntax checker or linter for the file type in question.

This can be done by adding a`"checkonsave"` option to the settings. Each key should either be the exact base-name of a file, or something of the form `*.ext`, where "ext" is replaced by a file extension. Each saved file will be checked by the command given if its file name or extension matches the pattern.

If the check results in an error (non-zero exit-code), the stderr output of the command is sent back to the browser and an error message is displayed post-save. If OGE is able to parse the output well-enough to determine the line containing the error, it will automatically move to it.

```json
{
  "checkonsave": {
    "*.json": "jq < %savedfile%",
    "*.js": "node -c %savedfile%",
    "*.css": "csslint %savedfile% 1>&2",
    "*.html": "tidy -q -e %savedfile%",
    "messy.html": "true"
  }
}
```

With these settings, json files will be checked with `jq`, javascript files with `node`'s syntax check (`-c`) option, css files with `csslint`, and most html files with `tidy`, except files named `messy.html`. If a file has both an exact match and just an extension match, the exact match command will be run. For `messy.html`, this will run the command named `true` (note `"true"` is in quotation marks; this is not a boolean), which never yields an error, so it will be given a free pass.

This supports only the variable `%savedfile%`. Note that this currently does not support full globbing but only file extensions with options such as `*.mjs`.

The default settings file copied over at first run does not contain any such options, so they need to be explicitly added.

## Templates

```json
{
  "templates": "/path/to/templates"
}
```

Templates are files that can be inserted into the currently edited file with the Alt-1 through Alt-4 keybindings. This option determines where they are looked for. If the value does not being with a slash, it will be resolved relative to the configuration directory `$HOME/.config/oge`. If the option is not set at all, OGE will look in `$HOME/.config/oge/templates` if it exists.

Templates have the extension `.template` and begin with the file extension they are for, following by a digit 1–4. When editing a `.html` file, Alt-1 would insert `html1.template`, Alt-2 would insert `html2.template` and so on. When editing a `.tex`, Alt-1 would insert `tex1.template`, and so on.

Templates can also be used when creating files or sessions via the cli tool discussed in the [sessions documentation](./sessions.md#using-the-cli-tool).

## Other Settings Options

For other settings, it is useful to compare the contents of `default-settings.json` to see what it contains. Here are descriptions of other options you can fine-tune. These are in addition to the `"routines"`, `"checkonsave"`, and other options discussed above.

### OGE data location setting

```json
{
  "datalocation": "."
}
```

This sets the location of where OGE stores files for its internal use, such as sessions data, temporary audio files, and others, relative to the typical location `$HOME/.local/share/oge`. Here `"."` tells it to use precisely that directory. However, if the value starts with `/`, it can point anywhere on the file system the server can write to. `"datalocation": "/tmp/oge"` would have it store its files in `/tmp/oge` instead.


### Autoprocessing delay

```json
{
 "autoprocess": {
    "delay": 800
  }
}
```

The `delay` value of the `autoprocess` setting determines how much time (in milliseconds) passes between when the user finishes typing or makes other changes, and the processing begins, when autoprocessing is turned on. The timer is reset with each change to the file, so that processing only takes place during pauses. If this is set to a lower value, typically the live-updating is faster. However, if the process is relatively slow, it can actually delay things to set a low value, as the earlier process may not be completed by the time the next would be triggered, and the second process can only begin after the first finishes. This value should be tweaked according to whether OGE is used remotely (where more updates require more bandwidth), or on a local machine (where this is not an issue), and according to how long the processing takes.

The delay can also be set for the current session from OGE's own setting panel.

### Autosave settings

```json
{
  "autosave": {
    "interval": 300000,
    "directory": "autosave"
  }
}
```

OGE can be configured to create an auto-save of files being edited to avoid losing work if the browser crashes. The interval sets how often in milliseconds this happens. The default, 300000, is 5 minutes. The directory specifies where the files are saved. This is relative to the `"datalocation"` directory, so using the default value `autosave`, the default location would be `$HOME/.local/share/oge/autosave`. Files are saved there with their full path name but with `⁒` replacing the directory separator `/`.

### TTS settings

```json
{
  "readaloud": {
    "html": {
      "command": "pandoc -f html -t plain --wrap=none | gtts-cli -f - -o %audiofile%"
    },
    "md": {
      "command": "pandoc -f markdown -t plain --wrap=none | gtts-cli -f - -o %audiofile%"
    },
    "playbackrate": 1.5,
    "substitutions": {
      "Frege": "Freyga",
      "Wittgenstein": "Vittgenstein",
      "Gödel": "Guhrdel",
      "↔": " if and only if "
    }
  }
}
```

The `"readaloud"` settings determine, for each input file type, how the mp3 that is read aloud by the loudspeaker TTS button is created. The text to be read will be sent as stdin to this command, line by line, and the command should contain the variable `%audiofile%` for the output. In the examples above, the text is filtered through pandoc (to remove html tags and markup) and then an mp3 is created using the cli tool for Google's tts system ([gtts](https://gtts.readthedocs.io)).

The option `"playbackrate"` can be used to speed up or slow down how the mp3 is played in the browser. Google's tts speaks rather slowly, so here it is sped up by a factor of 1.5 (or 50\%). If this is unset, it defaults to normal playback (1).

The optional `"substitutions"` value may contain things to be replaced, and what they are replaced by, in the text before it is piped to the tts command. This can be used, e.g., to tweak pronunciation or have it read special symbols a certain way.

Changing the `"readaloud"` settings could allow other methods for producing the mp3s, using other TTS systems.

```json
{
  "readaloud": {
    "txt": {
      "command": "flite_cmu_us_slt -t \"$(cat /dev/stdin)\" - -o /dev/stdout | lame - %audiofile%"
    }
  }
}
```

This alternative uses [flite](http://cmuflite.org/), or festival lite, along with [lame](https://lame.sourceforge.io/) for converting its output to mp3.

### Preview window settings

```json
{
  "viewer": {
    "height": 500,
    "width": 900,
    "pdf": {
      "convertcommand": "mutool draw -F svg %outputfile% %page%"
    }
  }
}
```

These options determine the height and width of the viewer window when it is created (in pixels), though not every browser or operating system will respect them.

The `"pdf"` suboption determines how the pages that are displayed in the pdf preview are converted into image files the browser can display. In the`"convertcommand"` value, the `%outputfile%` is replaced with the name of the PDF (here used as input) and `%page%` the page number to be converted. The command should send the contents of the image to stdout. (Note that `%outputfile%` here is not the name of the output of the conversion!) It is best to create svg files, as they are vector-based, like pdfs, and will scale properly when zoomed in. They are also usually quicker to create. In my experience, `mutool`’s svg conversion is faster at rendering pdf pages as browser-displayable svg images than even a browser-native pdf viewer like Mozilla’s pdfjs.

Pages are only converted and displayed when requested.

Note that as of version 0.2.0 the `"accesskeyfile"` setting used by previous versions of OGE is no longer used, as OGE no longer uses access keys, but [sessions](./sessions.md) instead. It is harmless to keep it there if you have an older settings file, but it does nothing.

## HTML to HTML recommendations

For html output, the preview window will only have access to external resources used by the page if they are within the session directory, or publicly available. If you are viewing html output that requires additional resources, it may be useful to embed all resources needed into the html file itself with the processing command. This is why the default routines for md→html and tex→html use `pandoc` with its `--standalone` and `--embed-resources` options.

For viewing html output for html, this can be less than ideal, since it will filter everything through pandoc’s conversion and you won’t be previewing what you had meant to. You could just use `touch %outputfile%` (which in fact is the default) as your routine to view the html file itself without modification, but then it won’t necessarily have the external resources available.

One alternative might be to use the `ogeurl` pseudo-output-extension, as described above, especially if a local testing webserver is able to serve both the output file and its additional resources.

Another alternative might be to install something like [inliner](https://github.com/remy/inliner) for embedding other resources, but [due to a bug it requires some hacks to get working in scripts](https://github.com/remy/inliner/issues/151). Create a shell script entitled `myinliner.sh`. (Make it executable with `chmod a+x` and put it in your `$PATH`.)

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

See also the other documentation files concerning [basic usage, buttons and keybindings](./basic-usage.md), [installation](./installation.md), and creating [sessions](./sessions.md) for providing access locally or over a server.

## License

Copyright 2023–2024 © Kevin C. Klement. This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).
