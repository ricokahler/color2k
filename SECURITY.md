# Security Policy

## Supported Versions

Security fixes are released for the latest version published on npm.

## Reporting a Vulnerability

Please report security issues privately through GitHub Security Advisories for
this repository:

https://github.com/ricokahler/color2k/security/advisories/new

If GitHub Security Advisories are not available, email the maintainer listed in
`package.json`.

Please include:

- A short description of the issue.
- The affected version or commit.
- A minimal reproduction when possible.
- Any known impact on package consumers.

## Release Security

color2k is configured to publish through npm trusted publishing with provenance.
Release builds should use GitHub-hosted runners, least-privilege workflow
permissions, and the release checklist in `docs/release-checklist.md`.
