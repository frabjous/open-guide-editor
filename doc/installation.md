
# Open Guide Editor (OGE) Documentation

# Basic Usage, Buttons and Keybindings


OGE has two main use-cases. One is for personal use on one's own workstation.
A second is as part of a larger web-based project in which it will be used remotely, such as the [Open Guide Typesetting Framework](https://github.com/frabjous/open-guide-typesetting-framework) it was originally written for.
However, it could be used for other projects.

I will cover the first use-case first.

## Installation for Personal Use

1. You will need to be running GNU/Linux or other Unix-like operating system. (I have only tested it on Linux but it might work on systems like FreeBSD and even MacOS; if you try, let me know your results!)

2. You will need to install any other programs that will be used as part of the routines and other commands you plan to use for processing and previewing.
    Below are the programs used by the default configuration, but you can configure OGE to use other programs instead.
    See the [settings and configuration documentation](https://github.com/frabjous/open-guide-editor/blob/main/doc/settings.md).

    - [pandoc](https://pandoc.org) for processing markdown files and converting between formats generally

    - [texlive](https://tug.org/texlive/) or another TeX distribution for processing LaTeX files

    - [mutool](https://mupdf.readthedocs.io/en/latest/mupdf-command-line.html?utm_source=mupdf&utm_medium=website&utm_content=cta-header-link#mupdf-command-line-mutool) from the [mupdf project](https://mupdf.com/) for converting pdf pages to images, and other pdf-related tasks.

    - [flite](http://cmuflite.org/) for text-to-speech capability

    - [ebook-convert](https://manual.calibre-ebook.com/generated/en/ebook-convert.html), a command line program that ships with the [calibre](https://calibre-ebook.com/) ebook software suite, for converting html files to epubs.

    - [weasyprint](https://weasyprint.org/) for creating pdfs from html files

    The above can probably be easily installed with your distribution's package manager, on any mainstream Linux distro. You do not need to install them all, however, if you don’t need the [routines](https://github.com/frabjous/open-guide-editor/blob/main/doc/settings.md) that use them, or want to define your own using alternative tools such as, for example, the (slower but ubiquitous) [poppler](https://poppler.freedesktop.org/) utilities in place of mutool.

   For example, on an Arch-based distribution, you can get all you need with:

   ```sh
   sudo pacman -S git npm python-weasyprint
   ```

4. You will need to have installed the programs used in the installation process, which includes [git](https://git-scm.com/) and [npm](https://www.npmjs.com/), but there's a good chance that you'll have these installed already.

5. You will need to be able to run a [PHP](https://www.php.net/)-capable webserver. For personal use, the [php testing server](https://www.php.net/manual/en/features.commandline.webserver.php) may suffice. It may work with earlier versions, but I recommend using PHP version 8.x or above.

6. Clone this repository.

    ```sh
    git clone --recurse-submodules --depth 1 \
        https://github.com/frabjous/open-guide-editor.git
    ```