<h1 align="center">
    <a href="https://authzed.com#gh-dark-mode-only" target="_blank">
        <img width="300" src="https://github.com/authzed/spicedb/assets/343539/82234426-468b-4297-8b5c-f06a44fe2278" alt="spicedb logo">
    </a>
    <a href="https://authzed.com#gh-light-mode-only" target="_blank">
        <img width="300" src="https://github.com/authzed/spicedb/assets/343539/312ff046-7076-4c30-afd4-2e3d86c06f51" alt="spicedb Logo">
    </a>
</h1>

<h3 align="center">
  SpiceDB sets the standard for authorization that <i>scales</i>.
  <br/><br/>Scale with<br/>
  Traffic • Dev Velocity • Functionality • Geography
</h3>

<p align="center">
  <a href="https://discord.gg/spicedb"><img alt="discord badge" src="https://img.shields.io/discord/844600078504951838?color=7289da&label=discord&style=flat-square"></a>
	&nbsp;
    <a href="https://twitter.com/authzed"><img alt="twitter badge" src="https://img.shields.io/badge/twitter-@authzed-1d9bf0.svg?style=flat-square"></a>
    &nbsp;
    <a href="https://www.linkedin.com/company/authzed/"><img alt="linkedin badge" src="https://img.shields.io/badge/linkedin-+authzed-2D65BC.svg?style=flat-square"></a>
</p>

# SpiceDB Extension for VS Code

VS Code extension that provides syntax highlighting, semantic information and addition UI for working with [SpiceDB] [schema] and [relationships data].

Brings [SpiceDB Playground] functionality into VS Code.

[SpiceDB]: https://spicedb.io
[schema]: https://authzed.com/docs/spicedb/concepts/schema
[relationships data]: https://authzed.com/docs/spicedb/concepts/relationships
[SpiceDB Playground]: https://play.authzed.com

<p align="center">
<a href="https://marketplace.visualstudio.com/items?itemName=authzed.spicedb-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/authzed.spicedb-vscode" alt="Visual Studio Marketplace"></a>
<a href="https://github.com/authzed/spicedb-vscode/releases"><img src="https://img.shields.io/github/v/release/authzed/spicedb-vscode?sort=semver&amp;color=green" alt="Release"></a>
<a href="https://github.com/authzed/spicedb-vscode/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License"></a>
</p>

## What is SpiceDB?

SpiceDB is a graph database purpose-built for storing and evaluating access control data.

As of 2021, [broken access control became the #1 threat to the web][owasp]. With SpiceDB, developers finally have the solution to stopping this threat the same way as the hyperscalers.

[owasp]: https://owasp.org/Top10/A01_2021-Broken_Access_Control/

### Why SpiceDB?

- [**World-class engineering**][about]: painstakingly built by experts that pioneered the cloud-native ecosystem
- [**Authentic design**][zanzibar]: mature and feature-complete implementation of Google's Zanzibar paper
- [**Proven in production**][1M]: 5ms p95 when scaled to millions of queries/s, billions of relationships
- [**Global consistency**][consistency]: consistency configured per-request unlocks correctness while maintaining performance
- [**Multi-paradigm**][caveats]: caveated relationships combine the best concepts in authorization: ABAC & ReBAC
- [**Safety in tooling**][tooling]: designs schemas with real-time validation or validate in your CI/CD workflow
- [**Reverse Indexes**][reverse-indexes]: queries for "What can `subject` do?", "Who can access `resource`?"

[about]: https://authzed.com/why-authzed
[zanzibar]: https://authzed.com/zanzibar
[1M]: https://authzed.com/blog/google-scale-authorization
[caveats]: https://netflixtechblog.com/abac-on-spicedb-enabling-netflixs-complex-identity-types-c118f374fa89
[tooling]: https://authzed.com/docs/spicedb/modeling/validation-testing-debugging
[reverse-indexes]: https://authzed.com/docs/spicedb/getting-started/faq#what-is-a-reverse-index
[consistency]: https://authzed.com/docs/spicedb/concepts/consistency

## Installation

The SpiceDB VS Code Extension can be installed from the [VS Code Extension Marketplace].

[VS Code Extension Marketplace]: https://marketplace.visualstudio.com/items?itemName=authzed.spicedb-vscode

## Features

### Syntax and Semantic Highlighting for SpiceDB Schema

<img src="assets/semantic-highlighting.gif" height="450">

### Real time validation and diagnotics

<img src="assets/errors.gif" height="450">

### Automatic formatting for SpiceDB Schema

<img src="assets/formatting.gif" height="450">

### Built-in check watch

<img src="assets/check-watches.gif" height="450">
