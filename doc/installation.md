
# Open Guide Editor (OGE) Documentation

# Installation

## Note on Major Version Change

As of version 0.2.0, OGE has changed from using a php server backend to using a router written for an ExpressJS server or compatible javascript runtime server app. In the recent versions, both server-side and browser-side code is all javascript.

You are currently viewing documentation for the older php branch. This branch of the repo retains the php code, and may continue to be used for those making use of php-servers. However, as the code is almost wholly different, new features added to the main branch will not be merged back into this branch (at least not by me).

The documentation below explains the procedure for installing the php version. Please check out the main branch to see its corresponding documentation.

## Overview

OGE has two main use-cases. One is for personal use on one’s own workstation.
A second is as part of a web-based project in which it could be used remotely, such as the [Open Guide Typesetting Framework](https://github.com/frabjous/open-guide-typesetting-framework) it was originally written for, or similar project.

I will cover the former use-case first.

## Installation for Personal Use

#### Steps to install

1. You will need to be running GNU/Linux or another Unix-like operating system. (I have only tested it on linux but it might work on systems like FreeBSD and even MacOS; if you try, let me know your results!)

2. You will need to install any other programs that will be used as part of the routines and other commands you plan to use for processing and previewing.
    Below are the programs used by the default configuration, but you can configure OGE to use other programs instead.
    See the [settings and configuration documentation](./settings.md).

    - [pandoc](https://pandoc.org) for processing markdown files and converting between formats generally

    - [texlive](https://tug.org/texlive/) or another TeX distribution for processing LaTeX files

    - [mutool](https://mupdf.readthedocs.io/en/latest/mupdf-command-line.html?utm_source=mupdf&utm_medium=website&utm_content=cta-header-link#mupdf-command-line-mutool) from the [mupdf project](https://mupdf.com/) for converting pdf pages to images, and other pdf-related tasks

    - [flite](http://cmuflite.org/) for text-to-speech capability, and [lame](https://lame.sourceforge.io/) for converting to mp3

    - [ebook-convert](https://manual.calibre-ebook.com/generated/en/ebook-convert.html) for converting html files to epubs; this is a command line program that ships with the [calibre](https://calibre-ebook.com/) ebook software suite

    - [weasyprint](https://weasyprint.org/) for creating pdfs from html files

    The above can be easily installed with your distribution’s package manager, on any mainstream linux distro.
   You do not need to install them all, however, if you don’t need the [routines](./settings.md#routines) that use them, or want to define your own.
   For example, you might use the (slower, but ubiquitous) [poppler](https://poppler.freedesktop.org/) utilities in place of mutool.

3. You will need the programs used in the installation process.
These include [git](https://git-scm.com/) and [npm](https://www.npmjs.com/).
There’s a good chance that you have these installed already.
They do not need root access.

4. You will need to be able to run a [php](https://www.php.net/)-capable web-server.
For personal use, the [php testing server](https://www.php.net/manual/en/features.commandline.webserver.php) may suffice.
It may work with earlier versions, but I recommend using php version 8.x or above.

   For example, on an [Arch](https://archlinux.org)-based distribution, you can get all you need for the past few steps with:

   ```sh
   sudo pacman --needed -S git npm php texlive-latexrecommended mupdf-tools \
       flite lame calibre haskell-pandoc python-weasyprint
   ```

    The corresponding package names will likely be slightly different on other distros.

5. Clone this repository.
   Starting from the parent directory where you want it installed, run:

    ```sh
    git clone --branch php --recurse-submodules --depth 1 \
        https://github.com/frabjous/open-guide-editor.git
    ```

    This will also install the submodule [open-guide-misc](https://github.com/frabjous/open-guide-misc), which OGE requires.

6. Install codemirror and all the related dependencies with npm:

    ```sh
    cd open-guide-editor && npm install
    ```

7. Run the rollup bundler to create a bundled version of the codemirror libraries:

    ```sh
    node_modules/.bin/rollup js/editor.mjs -f iife -o editor.bundle.js -p @rollup/plugin-node-resolve
    ```

8. Make sure the php-enabled web-server is running.
   For the testing server, you can do (again from the same directory):

    ```sh
    php -S localhost:8181
    ```

    You can then visit `http://localhost:8181` in a browser, and you should see OGE.

Note that when connecting on `localhost`, you can edit any files the user running the server has access to.
See the [security documentation](./security.md) for more detail.

#### Convenience script

Opening the files you want to edit via OGE’s “open” dialog is not very efficient.

For that reason, OGE comes with a script you can run from the command line, `bin/oge.php`.
This takes one or more filenames on the local system as argument, and opens browser tabs for each one.
An access key for each file is also created.

The script will also launch a php testing server if one isn’t already launched.
You can specify the port, host, and browser to use, either from the command line or in the `settings.json` file for your OGE installation.
Details can be found by running the script with the argument `--help`, i.e., `php bin/oge.php --help`.

If you think you may use this often, I recommend making it executable (if git didn’t already preserve the permissions) and creating a symbolic link to it in one of the directories in your `$PATH`, e.g.:

```sh
chmod a+x bin/oge.php
ln -s "$(realpath bin/oge.php)" "$HOME/.local/bin/oge"
```

Naming the link `oge` instead of `oge.php` will allow it to be used in a shorter way, e.g., `oge filename.md`.
An alternative would be to create an alias such as `alias oge="php $HOME/open-guide-editor/bin/oge.php"` in your `.bashrc` or other shell configuration file.
You should not just copy the script into a directory in your `$PATH`, however, as this will interfere with it finding the resources in its parent directory it needs to function properly.

The script will also create files that do not yet exist, and can be passed (or set via `settings.json`) an option for a templates directory.
Templates therein will be copied over to the new files at creation based on their file extensions.
For example, `oge --templates ~/templates newfile.html` will look for a file named `~/templates/html.template` or `~/templates/html1.template` and copy it over to `newfile.html` when it is created.
Again, see `oge --help`.

If anyone wants me to create a `.desktop` file for OGE so it can be put into Desktop Environment menus easily, let me know.

## Installation on a Public-facing Web-server

Installation as part of a web project that allows for remote use is mostly the same as installation for personal use.
You can follow the steps of the procedure described [above](#steps-to-install).
The main exception is that for over-the-web use you will not want to use the php testing server, but instead a full featured web-server with php enabled like [nginx](https://www.nginx.com/) or [apache](https://httpd.apache.org/).

Instructions for setting up a standard php-enabled web-server are beyond the scope of this documentation, but there are many guides and tutorials for doing this online for all major linux distributions.
A MySQL or other database is not needed.

To make use of OGE on such a server, when following the steps above, you merely need to clone the repository into a place under the root directory served by the web-server, e.g., `/var/www`, or whatever the server is configured to use.

If, for example, it is placed as a subdirectory of the server’s document root, it would then be available at `https://yourdomain.com/open-guide-editor/`.
You can rename the `open-guide-editor/` directory if you wish, but the `open-guide-misc/` submodule directory should not be renamed.

When it is not accessed on `localhost` or `127.0.0.1`, the client browser will not automatically have access to editing files on the server.
That would be a huge security hole.
Instead, some mechanism will need to be put into place to grant access through some kind of authentication process.
More information about providing such a mechanism is detailed in the [security documentation](./security.md).

Once that is in place, there are two ways to access a specific file.
One would be to use the “open” button/Ctrl-O shortcut, which will be limited to those directories to which the client has been given access.
The other would be to follow a link to the redirection page `https://yourdomain.com/open-guide-editor/php/redirect.php?dirname=[url-encoded-directory-of file]&basename=[url-encoded-basename-of-file]` where the portions in brackets are replaced by the actual url-encoded names, without brackets.
This will generate an access key if the user should have access to the file and redirect the browser to the editor with the file in question loaded. 

## Other Documentation

See also the other documentation files concerning [basic usage, buttons and keybindings](./basic-usage.md), [configuring the editor’s settings](./settings.md), and the [security model](./security.md).

## License

Copyright 2023 © Kevin C. Klement. This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).
