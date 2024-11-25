
# Open Guide Editor (OGE) Documentation

# Installation

## Note on Major Version Change

As of version 0.2.0, OGE takes the form of a router that can be added to an [ExpressJS](https://expressjs.com) or compatible webserver, and now both browser-side code and server-side code is written in javascript. Earlier versions used php on the backend and could be used on a php-based webserver. That version is still available in this repo in the `php` branch. See [the corresponding installation documentation](../../php/doc/installation.md) for installing it.

## Overview

OGE has two main use-cases. One is for personal use on one’s own workstation. A second is as part of a web-based project in which it could be used remotely, such as the [Open Guide Typesetting Framework](https://github.com/frabjous/open-guide-typesetting-framework) it was originally written for, or similar project.

I will cover the former use-case first.

## Local Installation for Personal Use

### Steps to install

1. You will need to be running GNU/Linux or another unix-like operating system. (I have only tested it on linux but it might work on systems like FreeBSD and even MacOS; if you try, let me know your results!)

2. You will need to install any other programs that will be used as part of the routines and other commands you plan to use for processing and previewing. Below are the programs used by the default configuration, but you can configure OGE to use other programs instead. See the [settings and configuration documentation](./settings.md).

  - [pandoc](https://pandoc.org) for processing markdown files and converting between formats generally

  - [texlive](https://tug.org/texlive/) or another TeX distribution for processing LaTeX files

  - [mutool](https://mupdf.readthedocs.io/en/latest/mupdf-command-line.html#mupdf-command-line-mutool) from the [mupdf project](https://mupdf.com/) for converting pdf pages to images, and other pdf-related tasks

  - [gTTS](https://gtts.readthedocs.io) and its [cli tool](https://gtts.readthedocs.io/en/latest/cli.html) for text-to-speech capability

  - [ebook-convert](https://manual.calibre-ebook.com/generated/en/ebook-convert.html) for converting html files to epubs; this is a command line program that ships with the [calibre](https://calibre-ebook.com/) ebook software suite

  - [weasyprint](https://weasyprint.org/) for creating pdfs from html files

  The above can likely be installed with your distribution’s package manager, on any mainstream linux distro. You do not need to install them all, however, if you don’t need the [routines](https://github.com/frabjous/open-guide-editor/blob/main/doc/settings.md#routines) that use them, or want to define your own. For example, you might use the (slower, but ubiquitous) [poppler](https://poppler.freedesktop.org/) utilities in place of mutool.

  On an [Arch](https://archlinux.org)-based distribution, you can get all you need with:

   ```sh
   sudo pacman --needed -S git npm php texlive-latexrecommended mupdf-tools \
     python-gtts lame calibre haskell-pandoc python-weasyprint
   ```

  The exact package names will differ between distros.

3. You will need [nodejs](https://nodejs.org) for running the server, [npm](https://www.npmjs.com/) or another js package manager, and [git](https://git-scm.com/) for installation. They may be installed already. They do not need root access. Again, on Arch, this would be:

  ```sh
  sudo pacman --needed -S git nodejs npm
  ```

  It is possible that the OGE router and testing server are compatible with other javascript runtimes besides nodejs (e.g., [bun](https://bun.sh/)), but I have not tested this.

4. Clone this repository. Starting from the parent directory where you want it installed, run:

  ```sh
  git clone --depth 1 https://github.com/frabjous/open-guide-editor.git
  ```

5. Install codemirror and related dependencies with npm:

  ```sh
  cd open-guide-editor && npm install
  ```

6. Run the build script to make the codemirror libraries loadable by the browser.

  ```sh
  npm run build
  ```

7. If you do not wish to run OGE as part of another project, or over the web, you can now run OGE locally through its testing server.

  ```sh
  npm run production &
  ```

  This will run the server on port 12012. If "develop" is used instead of "production", it will run on port 11011, and it assumes [nodemon](https://nodemon.io/)] is installed (`sudo npm install -g nodemon`) to reload on changes.


8. To actually use OGE to edit any files, sessions must be created. (See the [sessions](./sessions.md) documentation.) For local use, this can be done with the <a id="cli">cli tool</a>. For example, to edit this file, you could now create a session with:

  ```sh
  ./cli/oge.mjs --port 12012 doc/installation.md
  ```

  This should output a URL to the terminal, something like: `http://localhost:12012/oge/2egCVJLd-ogen-guide-editor`. You should now be able to open that URL in a browser and begin editing. You could do both steps at once with this (replacing "firefox" with the executable for whatever browser you wish to use):


  ```sh
  firefox "$(./cli/oge.mjs --port 12012 doc/installation.md)"
  ```

9. If you plan on using oge regularly on your local machine, starting the server and creating sessions in the manner just described may become tedious. Here are some recommendations to make it less so.

  The first recommendation is to create a service file to start the server at boot. On a standard linux system using systemd, you can create a file `$HOME/.config/systemd/user/oge.service` (creating those directories if need be) with contents such as this:

  ```ini
  [Unit]
  Description=OGE server
  After=network.target
  StartLimitIntervalSec=0

  [Service]
  Type=simple
  Restart=always
  RestartSec=1
  WorkingDirectory=/home/foo/path/to/open-guide-editor
  ExecStart=/usr/bin/npm run production

  [Install]
  WantedBy=default.target
  ```

  Start and enable the service with:

  ```sh
  loginctl enable-linger
  systemctl --user enable oge.service
  systemctl --user start oge.service
  ```

  A second recommendation would be to create a shell script for creating and launching sessions for various files. Something like (e.g., `$HOME/.local/bin/oge.sh` or anywhere in your `$PATH`, made executable with `chmod a+x $HOME/.local/bin/oge.sh`):

  ```bash
  #!/usr/bin/env bash

  while read url ; do
    firefox "$url" &
  done < <(node $HOME/path/to/open-guide-editor/cli/oge.mjs --port 12012 "$@")

  ```

  You can then start editing files by name with `oge.sh file1.txt /path/to/file2.txt`. If the files are not in the same directories, multiple sessions may be created, and multiple browser tabs will be opened.

  More sophisticated scripts are also possible. Consult the [sessions documentation](./sessions.md#using-the-cli-tool) and the help output for the cli tool (`node ./cli/oge.mjs --help`) for additional relevant information.

## Installation as Part of a Public-facing Web-server App

Begin by following steps 1–6 above, as they are the same.

### Mounting the router

If you intend to use OGE as part of another ExpressJS (or compatible) app, it can be mounted as a middleware router.


```javascript

import express from 'express';
// this assumes this repo is installed as a submodule or subdirectory of the app
import ogeRouter from './open-guide-editor/ogeRouter.mjs';

const app = express();

// pre-oge routes here

// mount router
app.use(ogeRouter);

// post-oge routes here

// …
```

All routes handled by the router begin with `/oge…`, and so you will likely want to avoid routes beginning with `/oge…` elsewhere in your app.

The test server (`test-server.mjs` in the main repo directory) provides a full example of how the router could be used within an ExpressJS app, except with no other features.

General instructions for creating ExpressJS server apps are outside the scope of this documentation, but Express’s [own documentation](https://expressjs.com/) may be useful.

### Sessions

To allow actual editing, your app will need a mechanism for creating sessions. Using the cli tool discussed above is generally not appropriate for public facing apps.

The router itself does not include any means for creating sessions through the browser. This is by design. For security reasons, the calling app itself needs to decide how and under what conditions a session is created, and the user given access to editing files on the server.

A session is created by placing an appropriately structued `.json` file in the sessions directory, generally `$HOME/.local/share/oge/sessions`, unless another data directory is specified in the [settings](./settings.md). The base name of the file is the "sessionid". For more information on sessions, what a session file should and can contain, see the [sessions documentation](./sessions.md).

If an appropriate session file exists, it can be accessed at the URL (replacing `yourdomain` by your actual domain, and adding a port if needed):

```
https://yourdomain/oge/[sessionid]
```

Apart from the contents of the `public/` subdirectory of this repo (server under `/ogepublic`), all urls used by oge contain the sessionid. For example, downloads of preview files are accessed as `https://yourdomain/ogedownload/[sessionid]/filename`, and json requests (which handle most interactions between server and browser, including saving files) are accessed through `https://yourdomain/ogejson/[sessionid]`.

### Additional security

If no additional security precautions are taken, these will be accessible to anyone who knows the sessionid. Using randomly created and secret sessionids will increase security, but it may be a good idea to create additional middleware, mounted prior to the OGE router, that checks the sessionid against, e.g., cookies or other conditions.

```javascript
function currentRequestAllows(req, ogesessionid) {
  let goodrequest = false;
  // your custom logic here, changing goodrequest to true if everything OK
  return goodrequest;
}

app.use('/oge/:sessionid', async function(req, res, next) {
  if (currentRequestAllows(req, req.params.ogesessionid)) {
    next();
    return;
  }
  res.status(401).type('txt').send('Error 401 Unauthorized');
});

app.use(ogeRouter);

```

OGE does not itself provide this additional security layer and it is up to you to ensure your security requirements are met. Otherwise use at your own risk!

Anyone making use of OGE as part of a larger project should be very familiar with sessions and how they work. See the [sessions documentation](./sessions.md).

## Use Within a Different Kind of Web app

If you want to use OGE as part of a different kind of web app, not using ExpressJS, you might run its test-server and have the other parts of your app access it through its port (12012 or whatever the environmental variable OGETESTSERVERPORT is set to). Run the server as discussed above.

For example, with nginx one could point a subdomain to the OGE port with a reverse proxy:

```

server {
  listen 80;
  listen [::]:80;
  server_name oge.mydomain.net;
  location / {
    proxy_pass http://localhost:12012;
  }
}
```
Experienced sysadmins can no doubt think of other solutions tailored to the individual use case.

Additional security steps similar to those [discussed above](#additional-security) should also be considered if OGE is used in his way.

## Other Documentation

See also the other documentation files concerning [basic usage, buttons and keybindings](./basic-usage.md), [configuring the editor’s settings](./settings.md), and [creating and making use of sessions](./sessopms.md).

## License

Copyright 2023–2024 © Kevin C. Klement. This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).
