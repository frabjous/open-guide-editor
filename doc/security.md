
# Open Guide Editor (OGE) Documentation

# Security Model

### Personal use on the same device it is installed

If you merely wish to use OGE on your personal workstation, you do not need to do much to implement any kind of authentication or security mechanism.
OGE is configured to grant access to anyone accessing it over `localhost`, `::1`, or the `127.0.0.1` local ip address access to whatever files to which the user running the server has access.
See the [installation documentation](https://github.com/frabjous/open-guide-editor/blob/main/doc/installation.md) for more information.

### Use as part of a publicly accessible web project

#### Session variable keys

When it is accessed remotely, access to edit files on the server must be granted by an authentication mechanism. The authentication model for OGE is based on [php sessions](https://www.php.net/manual/en/intro.session.php). These are controlled by the php `$_SESSION` variable for the client browser session.

There are two session variable keys that affect OGE’s behavior. They are `$_SESSION["open-guide-editor-poweruser"]` and `$_SESSION["open-guide-editor-access"]`.



## Other Documentation

See also the other documentation files concerning [basic usage, buttons and keybindings](https://github.com/frabjous/open-guide-editor/blob/main/doc/basic-usage.md), [configuration and settings](https://github.com/frabjous/open-guide-editor/blob/main/doc/settings.md) and [installation](https://github.com/frabjous/open-guide-editor/blob/main/doc/installation.md).

## License

Copyright 2023 © Kevin C. Klement. This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).