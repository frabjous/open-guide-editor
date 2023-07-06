
# Open Guide Editor (OGE) Documentation

# User Configuration and Settings

## Overview

OGE aims to be very user-configurable. Configuration is done by means of json files. Each time a file is loaded or processed, the following files are checked for configuration options.

1. The file `oge-settings.json` in the same folder as the file, or any parent folder to which oge has access.
2. The file `settings.json` in the main `open-guide-editor` folder.
3. The file `default-settings.json` in the main `open-guide-editor` folder.

Settings from these files are merged, with the settings in (1) overriding those of (2), and with those of (2) overriding those of (3). If you do not wish to change something from the default settings, you need not include it in (1) or (2); the defaults from (3) will then be applied.

**Project-specific settings** should be done in the `oge-settings.json` file for the folder for the project.

**Site or installation-wide settings** should be done in `settings.json`.

**Sane defaults** are provided for you in `default-settings.json`, though there are some recommendations for alternatives below.

To create your own `settings.json` you can copy `default-settings.json` to `settings.json`, change what you wish to change, and remove anything you wish to keep at the default setting.

## Project-Specific Settings and Alternative Main Files for Previewing

These can be achieved by creating a `oge-settings.json` file in the same folder as the files you're working on.

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

```json
{

}

## Other Documentation

See also the other documentation files concerning [basic usage, buttons and keybindings](https://github.com/frabjous/open-guide-editor/blob/main/doc/basic-usage.md), [installation](https://github.com/frabjous/open-guide-editor/blob/main/doc/installation.md), and the [security model](https://github.com/frabjous/open-guide-editor/blob/main/doc/security.md).

## License

Copyright 2023 © Kevin C. Klement. This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).