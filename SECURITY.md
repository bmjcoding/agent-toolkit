# Security Policy

## Supported Versions

Security fixes are applied to the active `main` branch.

## Reporting a Vulnerability

Do not open a public issue for an unpatched vulnerability.

Report security issues by contacting the maintainer through GitHub security reporting
or a private channel associated with the repository owner. Include:

- A short description of the issue and affected paths.
- Reproduction steps or a proof of concept.
- The impact you expect in real usage.
- Any suggested remediation if you already have one.

You should receive an acknowledgment within a reasonable maintainer response window.
If the report is confirmed, remediation will land on `main` first and public disclosure
will wait until a fix is available.

## Security Checks

The repository ships local hook-based guardrails for branch protection, changelog
policy, and secret scanning. CI also runs the repository secret scan on pull requests
and protected-branch pushes so forked contributions do not rely only on locally
installed hooks.
