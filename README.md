# Open Guide Editor (OGE)

## Overview

Highly configurable web-based text editor based on [codemirror](https://codemirror.net).
It is especially suited for editing markdown, LaTeX and html files with its built-in mechanism for viewing live-updating-as-you-type html and pdf previews.
(It is also a capable editor for coding and other tasks.)

It can also be used for editing subsidiary files (css, javascript, xml, json, pandoc templates, etc.) and see their effects in the live-updating preview for their root markdown/LaTeX/html document.
The default configuration uses [pandoc](https://pandoc.org) for markdown conversions, but it can be configured to use other tools.
In fact, it can be configured for creating live-previews of the output of *any arbitrary kind of file*, if the necessary processing commands are added to the settings.

It was created to be used for the [Open Guide Typesetting Framework](https://github.com/frabjous/open-guide-typesetting-framework), though could be used independently.

# Supported Platforms and Older Versions

Since version 0.2.0, the server-side backend for OGE takes the form of a router that can be added to [ExpressJS](https://expressjs.com) or compatible server apps, running on [NodeJS](https://nodejs.org) (or possibly another server-side JavaScript runtime). An earlier version took the form of php scripts for php-based websites. The older version is still available in this repo in the php branch.

See the [installation documentation](./doc/installation.md) for information on how to use the router (or the [corresponding document](../php/doc/installation.md)) in the php branch for it).

# Demonstration

Here is a short video showing what OGE looks like and how it works overall.

https://github.com/user-attachments/assets/a701d540-e125-4150-90e2-b6d68fc7460b

## Documentation

Documentation for the project is broken down into four separate files. They independently cover:

* [Basic editor usage, including panel buttons and key-bindings](./doc/basic-usage.md)

* [Configuring the editor’s settings and the commands used for processing and previewing](./doc/settings.md)

* [Installation, either locally or on a public webserver](./doc/installation.md)

* [Creating sessions and granting access locally or on a server](./doc/sessions.md)

These are available in the `doc/` subdirectory, or by clicking the links above.

## Roadmap / TODO

- [x] implement session control and session configuration files
  - [x] reload settings on save
- [x] implement codemirror v6 editor with top panel
  - [x] syntax highlighting
  - [x] code folding
  - [x] saving
  - [x] open new files
  - [x] create new files
  - [x] project tree
  - [x] allow toggling wrap/no-wrap
  - [x] find/replace panel
  - [x] piping selection to unix tools on server
  - [x] good keybindings
  - [x] auto-comment/uncomment
- [x] generic autopreview mechanism for input/output file-type
  - [x] select type of output from panel
  - [x] allow downloading unpreviewable output
- [x] support markdown as input
  - [x] preview html
  - [x] preview pdf
  - [x] download ePub
  - [x] citation auto-completion for pandoc-style citations/bibliographies
- [x] support LaTeX as input (other things require [this problem](https://github.com/mathematic-inc/codemirror-tex/issues/4) be fixed)
  - [x] smart quotes
  - [x] error reports
  - [x] preview pdf
  - [x] synctex support (both directions)
- [x] support html as input
  - [x] preview (itself)
- [x] edit supplementary files with same preview
  - [x] css/svg for html/markdown
  - [x] latex packages, bibtex databases or included files
  - [x] edit multiple files at once
- [x] implement text-to-speech system for reading file out loud
- [x] implement autosaving with configurable timer
- [x] symbol picker
- [x] “[Fregeifier](https://github.com/frabjous/fregeifier)” integration
- [x] spellcheck through browser’s native spellcheck
- [x] simple jump marks
- [x] templates
- [x] custom dialogs with codemirror panels
- [x] documentation
  - [x] initial to-do on readme
  - [x] basic usage, buttons and keybindings
  - [x] custom settings
  - [x] installation locally
  - [x] server installation
  - [x] handling sessions
- [x] git integration
  - [x] doing a commit
  - [ ] revert to earlier commit
  - [ ] more?
- [x] additional features
  - [x] multiple file at once
  - [x] split panels
  - [x] linting (partial through "checkonsave")
  - [x] support other color schemes (now supports over 300!)
  - [x] support other fonts in the editor
  - [x] settings panel for colors and fonts
- [ ] long term pipe dreams (?)
  - [ ] LSP integration
  - [ ] collaborative editing

## Trivia

This is a sequel to, and supersedes, my earlier [K(ev)E(dit)](https://bitbucket.org/frabjous/ke) editor.
I have also written a lua neovim plugin that provides similar functionality, [KNAP](https://github.com/frabjous/knap) (Kevin’s Neovim Auto-Previewer).

## License

Copyright 2023–2024 © Kevin C. Klement.
This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).
