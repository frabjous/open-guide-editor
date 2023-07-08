
# Open Guide Editor (OGE) Documentation

# Security Model

## Personal use on the same device on which it is installed

If you merely wish to use OGE on your personal workstation, you do not need to do much to implement any kind of authentication or security mechanism.
OGE is configured to grant access to anyone accessing it over `localhost`, `::1`, or the `127.0.0.1` local ip address to whatever files to which the user running the server has access.
See the [installation documentation](https://github.com/frabjous/open-guide-editor/blob/main/doc/installation.md) for more information.

## Use as part of a publicly accessible web project

### Session variable keys

When it is accessed remotely, access to edit files on the server must be granted by an authentication mechanism. The authentication model for OGE is based on [php sessions](https://www.php.net/manual/en/intro.session.php). These are controlled by the php `$_SESSION` variable for the client browser session.

There are two session variable keys that affect OGE’s behavior. 
They are:

```php
$_SESSION["open-guide-editor-poweruser"] // a boolean value, and
$_SESSION["open-guide-editor-access"] // an array of directory names
```

If `$_SESSION["open-guide-editor-poweruser"]` is set, and set to true, the user will have access to any file on the server the user running the server can access. This is always set to true when accessing OGE through `localhost`. Otherwise, it should not be set unless the user is very trusted, such as one of the maintainers of the project.

For most use cases, setting `$_SESSION["open-guide-editor-access"]` is more appropriate.
This should be set to an array of names of directories the user should be able to access.
The user will also be able to access subdirectories of directories in this array.

OGE itself does not provide a way to set this variable key. It is assumed that each project making use of OGE would have its open mechanisms, as the Open Guide Typesetting Framework will when finished.<!-- TODO: change this when ogst is in place --> Such a mechanism could be implemented by another php script running on the same server. The basic form of such a script could be something like the following, which could take a post request or similar as input:

```php
<?php
// start the session so the $_SESSION variable will be available
// and will persist through different pages on the same site
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
echo "Authentication unsuccesful.";
exit();

// it’s up to the project how to define such things as the user_is_really_trusted(),
// user_is_partly_trusted() and get_pwd_hash_for() functions, or implement a different
// means for setting these $_SESSION variable keys 

```

### Access keys

Normally, when used as part of a web project, you will not want to directly load the `index.php` page in the main oge directory. Instead, you want to redirect to this page through the `php/redirect.php` page. The redirection page takes the url parameters `dirname=` and `basename=` to set the requested file. See the sample code above for a way to construct a proper url with these parameters within php.

The redirection page checks whether or not the user should have access based on the php session variable keys described above. If either the user is considered a poweruser, or has the directory or one of its parent directories specified in the `"open-guide-editor-access"` session key, the redirection will be successful.

Moreover, in the process of redirecting, the page will 

## Other Documentation

See also the other documentation files concerning [basic usage, buttons and keybindings](https://github.com/frabjous/open-guide-editor/blob/main/doc/basic-usage.md), [configuration and settings](https://github.com/frabjous/open-guide-editor/blob/main/doc/settings.md) and [installation](https://github.com/frabjous/open-guide-editor/blob/main/doc/installation.md).

## License

Copyright 2023 © Kevin C. Klement. This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).