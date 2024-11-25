# Open Guide Editor (OGE): PHP Branch

## Note on Major Version Change

As of version 0.2.0, OGE has changed from using a php server backend to using a router written for an ExpressJS server or compatible javascript runtime server app. In the recent versions, both server-side and browser-side code is all javascript.

You are currently viewing documentation for the older php branch. This branch of the repo retains the php code, and may continue to be used for those making use of php-servers. However, as the code is almost wholly different, new features added to the main branch will not be merged back into this branch (at least not by me).

Please check out the main branch to see its corresponding documentation.

## Overview

Highly configurable web-based text editor based on [codemirror](https://codemirror.net/) primarily designed for editing markdown, LaTeX, and html files with live-updating html and pdf previews.

However, it can be used to edit other plain text files as well, including subsidiary files (css, javascript, csv, json, pandoc templates, etc.) and see their effects live-update in their chosen root markdown/LaTeX/html document.
The default configuration uses [pandoc](https://pandoc.org) for markdown conversions, but it can be configured to use other tools.

It was created to be used for the [Open Guide Typesetting Framework](https://github.com/frabjous/open-guide-typesetting-framework), though could be used independently.

# Demonstration

Here is a short video showing what OGE looks like and how it works overall.

https://github.com/frabjous/open-guide-editor/assets/305948/e26b0c8c-f84b-4b21-83fc-2aa2b3ed0555

## Documentation

Documentation for the project is broken down into four separate files. They independently cover:

* [Basic editor usage, including panel buttons and key-bindings](./basic-usage.md)

* [Configuring the editor’s settings and the commands used for processing and previewing](./settings.md)

* [Installation, either locally or on a public webserver](./installation.md)

* [The security model for granting or denying access to editing files remotely](./security.md)

These are available in the `doc/` subdirectory, or by clicking the links above.

## TODO (as of when the PHP branch was abandoned)

- [x] implement authentication model for who is allowed to edit which files
- [x] implement basic codemirror v6 editor with top panel
    - [x] allow saving
    - [x] allow opening new files
    - [x] allow toggling wrap/nowrap
    - [x] find/replace panel
    - [x] piping selection to unix tools on server
    - [x] good keybindings
    - [x] auto-comment/uncomment
- [x] implement autosaving with configurable timer
- [x] provide generic mechanisms for autopreview depending on input filetype
- [x] support markdown as input
    - [x] preview html
    - [x] preview pdf
    - [x] speak aloud
    - [x] download ePub
- [x] implement api for adding citations
- [x] good documentation
    - [x] initial todo on readme
    - [x] basic usage, buttons and keybindings
    - [x] custom settings
    - [x] installation locally
    - [x] server installation
    - [x] security model
- [x] support LaTeX as input (other things require [this problem](https://github.com/mathematic-inc/codemirror-tex/issues/4) be fixed)
    - [ ] smart quotes
    - [ ] error reports
    - [x] preview pdf
    - [x] synctex support
- [x] support html as input
    - [x] preview (itself)
- [x] templates (through CLI script only at present)
- [x] edit supplementary files with preview
    - [ ] proper syntax highlighting for type of file (partial)
    - [x] css/svg for html/markdown
    - [x] latex package, bibtex database or included file
- [x] provide git integration
    - [x] doing a commit
    - [ ] revert to earlier commit
    - [ ] more?
- [x] symbol picker
- [x] “[Fregeifier](https://github.com/frabjous/fregeifier)” integration
- [x] spellcheck through browser’s native spellcheck
- [x] simple jump marks
- [x] swap out custom dialogs with codemirror panels (mostly done, could do more)
- [ ] probably unimportant things
    - [ ] support other color schemes
    - [ ] make find button grayed out when search panel inactive
    - [ ] word-processor-like interface for bold, italics, quotes, etc.
- [ ] long term pipe dreams (?)
    - [ ] split panels
    - [ ] linting
    - [ ] LSP integration
    - [ ] collaborative editing

## Trivia

This is a sequel to, and supersedes, my earlier [K(ev)E(dit)](https://bitbucket.org/frabjous/ke) editor.
I have also written a lua neovim plugin that provides similar functionality, [KNAP](https://github.com/frabjous/knap) (Kevin’s Neovim Auto-Previewer).

## License

Copyright 2023 © Kevin C. Klement.
This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).
