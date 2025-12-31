# SpiceDB for Visual Studio Code

<a href="https://marketplace.visualstudio.com/items?itemName=authzed.spicedb-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/authzed.spicedb-vscode?style=flat-square" alt="Visual Studio Marketplace"></a>
<a href="https://discord.gg/spicedb"><img alt="discord badge" src="https://img.shields.io/badge/discord-spicedb-7289da?style=flat-square"></a>
<a href="https://twitter.com/authzed"><img alt="twitter badge" src="https://img.shields.io/badge/twitter-@authzed-1d9bf0.svg?style=flat-square"></a>
<a href="https://www.linkedin.com/company/authzed/"><img alt="linkedin badge" src="https://img.shields.io/badge/linkedin-+authzed-2D65BC.svg?style=flat-square"></a>

Official VS Code extension providing syntax highlighting, semantic information, and additional UI components for working with [SpiceDB] [schema] and [relationships data].

This extension brings the [SpiceDB Playground] experience natively to VS Code.

[SpiceDB]: https://spicedb.io
[schema]: https://authzed.com/docs/spicedb/concepts/schema
[relationships data]: https://authzed.com/docs/spicedb/concepts/relationships
[SpiceDB Playground]: https://play.authzed.com

## Installation

The SpiceDB VS Code Extension can be installed from the [VS Code Extension Marketplace].

[VS Code Extension Marketplace]: https://marketplace.visualstudio.com/items?itemName=authzed.spicedb-vscode

### Updating SpiceDB

This extension uses SpiceDB's language server which is a part of the SpiceDB binary. You're prompted to install
SpiceDB if you haven't already the first time you run the extension. If there's a new language feature, you'll
need to update the installed SpiceDB binary to the most recent version to use that feature, according to whatever
installation mechanism you originally used.

## Features

### Syntax and Semantic Highlighting for SpiceDB Schema

<img src="assets/semantic-highlighting.gif" height="450">

### Real time validation and diagnostics

<img src="assets/errors.gif" height="450">

### Automatic formatting for SpiceDB Schema

<img src="assets/formatting.gif" height="450">

### Built-in check watch

<img src="assets/check-watches.gif" height="450">

## Acknowledgments

The syntax for the CEL language (used in caveats) was copied from [vscode-cel](https://github.com/hmarr/vscode-cel).
