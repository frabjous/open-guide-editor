
# Open Guide Editor (OGE) Documentation

# Sessions

## Overview

Sessions are the primary means through which OGE grants access to the user to edit files.

Sessions exist as `.json` files in the `/sessions` subdirectory of OGE's data directory. This is typically `$HOME/.local/share/oge/sessions`, but may be located elsewhere if something different is specified in the settings. See the [settings documentation](./settings.md#oge-data-location-setting).

The base name of the json file (e.g., the `2egCVJLd-myproject` part of the session file name `$HOME/.local/share/oge/sessions/2egCVJLd-myproject.json`) is called the **session id**.

If a session exists, it can be accessed at the web path `/oge/[sessionid]` on the server making use of the router (see the [installation instructions](./installation.md)). For example, when running the testing server locally, this might be:

```
http://localhost:12012/oge/2egCVJLd-myproject
```

Accessed through this url, the user can edit any file within the session directory (described [below](#dir-required)).

## Session Properties

A session json file should contain certain keys and values. A typical session json file might look like this:<a id="example"></a>

```json
{
  "dir": "/home/foo/work/myproject",
  "expires": 1748793600000,
  "sessionid": "2egCVJLd-myproject",
  "files": ["README.md", "views/index.html"],
  "user": "foo",
  "font": "Cousine",
  "colorscheme": "Andromeda",
  "ogeoverride" : {
    "rootdocument": "README.md",
    "autoprocess": {
      "delay": 1000
    }
  }
}

```

This session would grant the user accessing it the ability to edit any file within the directory `/home/foo/work/myproject`, but would start up with editor tabs for the files `README.md` and `index.html` from the `views/` subdirectory. It would use Cousine as the editor font and the Andromeda color scheme. `README.md` would be treated as the document to be processed for previewing, and so on. The session would expire on June 1, 2025.

Here is a fuller description of each property.

### dir (*required)

This is perhaps the most important property, as it delimits what files can be opened and what can be changed, as well as where processing commands are run from. All other filenames in both the session file and the `oge-settings.json` file (if it exists; see the [settings documentation](./settings.md)) are interpreted relative to this directory.

This setting cannot be changed by the user.

If a user needs to edit files in different directories, they must make use of multiple sessions. Since each OGE browser instance is tied to a session, they would have to make use of different browser tabs for the different sessions.

The user the server process is running under must have write access to these files, obviously, or it will not be able to save changes or run processes within it.

### expires (*required)

This is a timestamp determining when the session can no longer be used. It is given in milliseconds since the dawn of the computer "epoch" of January 1, 1970. Javascript's Date objects' `.getTime()` method yields timestamps like this. The value `1748793600000` in the example above means the start of the day GMT on June 1, 2025.

This setting cannot be changed by the user.

If the expires value is set to `0`, the session never expires.

### sessionid (*required)

This determines the urls through which the session is accessed, not just as described above, but for all important interactions between the browser and server.

All sessions have session ids, but strictly speaking this does not need to be included in the json file at creation, as the router will determine it from the filename/url path requested.

Session ids should consist only of letters, digits, hyphens, and underscores, to ensure they can be used as parts of urls without the complications of uri encoding or similar issues. Further considerations about session ids are discussed [below](#session-ids-and-security).

This setting cannot be changed by the user.

### files (*recommended)

This value is an array of filenames, interpreted relative to the `"dir"` setting. Editing tabs for each of these files are opened when the session is first accessed in a browser.

Names of non-existing files are ignored and cleaned out when the session is accessed. Absolute paths and relative paths pointing outside the session's `dir` setting will also be ignored.


This value is changed by the user whenever they open or close a tab for editing a file within the session directory. This way, the value is saved between multiple browser sessions for the same session url, and the user can pick up where they left off.

This cannot be used to constrain what files the user can edit, as the user can open additional files or close ones they are no longer editing.

If this is not given, or set as an empty array, the user will find themselves faced with a nearly empty editor screen, and while files can still be opened manually with the open files button or keybinding, this may not be obvious. It is best always to include some initial files, depending how the session was created and for what purpose.

### user (*recommended)

The `user` setting has little effect directly on OGE itself. Strictly speaking, the only use OGE itself makes of this value is to save color-schemes and font preferences for a given user if they change them manually, and then later on start a new session without these set.

If no `"user"` value is set, all that means for OGE itself is that such preferences about fonts and color-schemes will not be saved.

However, if OGE is used as part of a publicly accessible website, there may be a variety of reasons to track the username for whom the session was created for, to make sure they match login credentials, etc. It is also a good idea to tie together user-names and session directories, to avoid allowing different users to edit the same files at once (causing all sorts of chaos).

This setting cannot be changed by the user of the session.

### font (*optional)

This setting determines which monospaced font is used by the editor, the value here matching one of the base names of the `css` files in the `public/style/fonts` subdirectory. This is a purely aesthetic choice.

The user can change this value using OGE's settings panel, and it is saved for later loadings of the same session.

If this setting is absent, the font used will either be whichever the same `"user"` (see above) last set in a different session, or OGE's default (currently `JetBrains_Mono`).

### colorscheme (*optional)

Similar to the `font` option, this setting determines which of the hundreds of colorschemes found in `public/style/colors` is used when the session is loaded. Again, this is purely aesthetic.

The user can change this value using OGE's settings panel, and it is saved for later loadings of the same session.

If this setting is absent, the scheme used will either be whichever the same `"user"` (see above) last set in a different session, or be either "defaultdark" or "defaultlight", depending on what the user has set as their preference between light and dark themes in their browser settings.

### ogeoverride (*optional)

This option can be used to override any of the settings usually specified in the project-specific `oge-settings.json` file (in the session’s base directory set by the `dir` option), or the site-wide configuration file `settings.json` usually found at `$HOME/.config/oge/settings.json`.

Any values here will take precedence over similar settings found elsewhere.

In the [example](#example) above, we find the sub-option `"rootdocument"` set to `"README.md"`. This determines which document is processed when creating previews, and would make it this file even if another file is set by the `oge-settings.json` file for the project.

The purpose of this option is to provide greater flexibility for special use-case sessions that need to handle the files in the session directory differently from what is normal for the project or site.

The values that can be set here and what effects they have are described in the [settings documentation](./settings.md). Any of the settings discussed there can be overridden here.

This can contain many possible settings, but the only one that can be changed directly through the browser is the delay timer for autoprocessing (through the right slide-in settings panel that also deals with fonts and colorschemes).

## Creating sessions

As discussed in the [installation documentation](./installation.md), the OGE server router and browser interface do not provide any means for creating sessions. Since OGE cannot be used without sessions, this means it is left up to the app making use of OGE to implement its own means of creating them.

Any means of creating `.json` files with the properties discussed above and placing them in the sessions directory will work for this. These days, all widely-used programming languages have either built-in capabilities for doing this, or easy-to-install libraries that do.

Different projects will have different use-cases for session-creation and maintenance, and OGE leaves it to the calling-project to implement its own method for creating sessions.

The file `app/sessions.json` exports some functions that may be useful for session creation, and these functions can be imported by parent projects making use of OGE. This script however is not imported by the OGE router itself, or by any scripts it calls, and so there is no way to create sessions through it on its own.

An exception to this overall policy is the CLI tool, which can be used to create sessions locally on the server, discussed below.

### Using the CLI tool

The CLI tool is the script found at `cli/oge.mjs`. This script would ordinarily already be executable if this repo is cloned by the usual means, but if not, it can be made executable with `chmod a+x cli/oge.mjs`. You may wish to make a symbolic link to it from somewhere in your path, or add an alias to it to your shell configuration, so you do not need to specify its full path every time.

This is primarily meant as an easy way to create sessions if OGE is used only on a local machine for personal use. It is probably not appropriate for use as part of a public-facing website or web app.

The tool has various options, but its usual usage involves giving it filenames as command-line arguments. It will then create sessions that allow accessing the specified files.

The `"dir"` setting for the created session may not be the immediate parent directory of the files specified if it finds a parent further up the directory structure containing an `oge-settings.json` file, `package.json` file, or a `.git` subdirectory. In such cases, it assumes these are the base directories for the projects containing the files. (This can be overridden with a command line option, however.)

If multiple files are passed as argument and they are not found within the same project directories, multiple sessions may be created.

The output of the script will be urls through which the sessions can be accessed. The urls include the sessionids for the new sessions at the end. These can be passed to a browser.

As an example, if one were to run:

```sh
./cli/oge.mjs --port 12012 ~/tmp/tempfile.md ~/lib/mylib/index.mjs
```

The output might be something like:

```
http://localhost:12012/oge/9H5c4NHA-tmp
http://localhost:12012/oge/dXEfr405-mylib
```

These are urls which load sessions giving editing access to `~/tmp` and `~/lib/mylib`, respectively.

Since the cli tool is not running under the same process as the server, it may not be able to tell what port or domain to use. These can be specified with command line options, such as `--port` is above.

For more details, including the full list of command line options, see the output of the script run with the `--help` option:

```sh
./cli/oge.mjs --help
```

The [installation instructions for personal use](./installation.md#cli) give more details about how a shell script making use of it can be created to make editing local files easier.

### Session IDs and security

Unless additional security measures are implemented, mere possession of a session id and web access to the server running OGE allows someone to edit any files in the session directory.

For this reason, it is best if session ids are difficult to guess and kept private to a single user.

The CLI tool, for example, adds a random sequence of letters and digits to the start to any session id it creates. If the server is exposed to the internet or even a local network beyond the local workstation, even more difficult-to-guess and randomized session ids are likely a good idea.

Depending on the use case, relying on possession of the session id as the sole means of security, however, is probably not wise. There is a brief discussion of how to implement additional middleware to provide another layer of security in the [installation instructions](./installation.md#additional-security).

## Other Documentation

See also the other documentation files concerning [basic usage, buttons and keybindings](./basic-usage.md), [configuration and settings](./settings.md) and [installation](./installation.md).

## License

Copyright 2023–2024 © Kevin C. Klement. This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).
