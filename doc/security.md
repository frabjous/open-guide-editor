
# Open Guide Editor (OGE) PHP Branch Documentation

# Security Model

## Note on Major Version Change

As of version 0.2.0, OGE has changed from using a php server backend to using a router written for an ExpressJS server or compatible javascript runtime server app. In the recent versions, both server-side and browser-side code is all javascript.

You are currently viewing documentation for the older php branch. This branch of the repo retains the php code, and may continue to be used for those making use of php-servers. However, as the code is almost wholly different, new features added to the main branch will not be merged back into this branch (at least not by me).

The documentation below only applies to the php branch. Please check out the main branch to see its corresponding documentation.

## Local usage

If you merely wish to use OGE running on your personal workstation or other device, you do not need to implement any kind of authentication or security mechanism.
OGE is configured to grant access to anyone accessing it over `localhost`, `::1`, or the `127.0.0.1`, local ip address, to whatever files to which the user running the server has access.
See the [installation documentation](./installation.md) for more information.

## Use as part of a publicly accessible web project with `$_SESSION` keys

When it is accessed remotely, access to editing files on the server must be granted by an authentication mechanism.
The authentication model for OGE is based on [php sessions](https://www.php.net/manual/en/intro.session.php).
These are controlled by the php `$_SESSION` variable, which is stored on the server for each client browser session.

There are two session variable keys that affect OGE’s behavior.
They are:

```php
$_SESSION["open-guide-editor-poweruser"] // a boolean value, and
$_SESSION["open-guide-editor-access"] // an array of directory names
```

If the first is set, and set to true, the user will have access to any file on the server the user running the server can access.

There is nothing in the code of this repository that would set these to true. It is up to the system administrator to determine under what conditions they should be set. The first should never be set to true unless the user is very trusted, such as one of the maintainers of the project.

For most use cases, setting `$_SESSION["open-guide-editor-access"]` is more appropriate.
This can be set to an array of names of directories the user should be able to edit files within.
The user will also be able to access subdirectories of the directories in this array.

OGE itself does not provide a way to set these variable keys.
It is assumed that each project making use of OGE would have its own mechanisms, as the [Open Guide Typesetting Framework](https://github.com/frabjous/open-guide-typesetting-framework) does. (See the source of its [libauthentication.php](https://github.com/frabjous/open-guide-typesetting-framework/blob/main/php/libauthentication.php) script and the `function grant_oge_access(…)`.)

Such a mechanism should be implemented by another php script running on the same server.
The basic form of such a script could be something like the following, which could respond to an http POST request, or similar:

```php
<?php
// start the session so the $_SESSION variable will be available and
// will persist through different pages/redirections on the same site
session_start();

// implement some logic here that will determine if the user
// should be given access, and to what, e.g.,
// $goodlogin = password_verify($_POST["password"],
//     get_pwd_hash_for($_POST["username"]));
// $desired_file = $_POST["filename"];

$file_dirname = dirname($desired_file);
$file_basename = basename($desired_file);

$redirect_url = '/open-guide-editor/php/redirect.php' .
    '?dirname=' . rawurlencode($file_dirname) .
    '&basename=' . rawurlencode($file_basename);

if ($goodlogin && user_is_really_trusted()) {
    $_SESSION["open-guide-editor-poweruser"] = true;
    header('Location: ' . $redirect_url);
    exit();
}

if ($goodlogin && user_is_kinda_trusted()) {
    if (!isset($_SESSION["open-guide-editor-access"])) {
        $_SESSION["open-guide-editor-access"] = array();
    }
    array_push($_SESSION["open-guide-editor-access"], $file_dirname);
    header('Location: ' . $redirect_url);
    exit();
}

// if we haven’t exited yet, the user should be denied access

header("HTTP/1.1 403 Forbidden");
session_unset();
echo "Authentication unsuccessful.";
exit();

// It’s up to the project how to define such things as
// the user_is_really_trusted(), user_is_kinda_trusted()
// and get_pwd_hash_for() functions, or implement a different
// means for setting these $_SESSION variable keys.

```

## Access keys

Normally, when used as part of a web project, you would not want to directly load the `index.php` page in the main oge directory.
Instead, you would want to redirect to this page through the `php/redirect.php` page.
The redirection page takes the url parameters `dirname=` and `basename=` to set the requested file.
See the sample code above for a way to construct a proper url with these parameters within php.

The redirection page checks whether or not the user should have access based on the php session variable keys described above.
If either the user is considered a poweruser, or has access to the directory of the file or one of its parent directories, the redirection will be successful.

Moreover, in the process of redirecting, the page will create an “access key”.
Access keys provide a faster way to gain direct access to editing a file, and allow the editor to be bookmarked with a url specific to a given file.

You will see the accesskey, which is a random string of characters, in the address bar after redirection. The url shown might be something like:

`http://localhost/open-guide-editor/?accesskey=8oQNEvf7I3b1VOQg3Bi7yNQE`

Access keys can be reused even in different browser sessions without reauthentication, which allows bookmarking to work smoothly.

Access keys and what files they give access to are saved in a json file on the server in a specified location.
This file should not be in one of the directories served by the web-server for security reasons.
You can set the file’s location in your site-specific `settings.json`, as described in the [configuration and settings  documentation](./settings.md).
You can clear out old access keys by deleting or editing this json file.

## Other Documentation

See also the other documentation files concerning [basic usage, buttons and keybindings](./basic-usage.md), [configuration and settings](./settings.md) and [installation](./installation.md).

## License

Copyright 2023 © Kevin C. Klement. This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).
