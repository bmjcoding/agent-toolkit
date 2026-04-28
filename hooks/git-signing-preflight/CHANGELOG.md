# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-27

### Added

- PreToolUse hook for `Bash(git commit*)` and `Bash(git tag*)` that verifies a
  signing key is available before the command runs. Eliminates the recurring
  1Password / GPG signing failure mode that previously cost multiple
  release-engineer dispatch cycles per pipeline (including a 4h 7m human-wait
  gap on 2026-04-21).
- Detects signing intent from explicit `-S` / `--gpg-sign` flags (commit),
  `-s` / `--sign` flags (tag), `commit.gpgsign` / `tag.gpgsign` config, and
  inline `-c <key>=value` overrides.
- Verifies signing keys via `ssh-add -l` (ssh format) or `gpg --list-secret-keys`
  (openpgp format) based on `git config gpg.format`.
- Denies with structured guidance pointing at the unlock step or a one-time
  bypass via `git -c <key>=false ...`.

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/hook/git-signing-preflight-v1.0.0...HEAD
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/hook/git-signing-preflight-v1.0.0
