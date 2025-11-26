# Changelog

All notable changes to Claude Powerpack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-26

### Added

#### Update PR Skill
- New skill for creating comprehensive PR descriptions
- 5-phase workflow: inventory, categorization, analysis, documentation, update
- Multi-category documentation (features, fixes, tests, docs, config, build)
- Structured output with user impact and technical notes sections
- GitHub integration via `gh pr edit`
- Auto-detection of default branch (main vs master)
- Good vs bad examples in EXAMPLES.md

## [1.0.0] - 2025-01-13

### Added

#### Ask Expert Skill
- Expert consultation document creation with guided workflow
- Code extraction script supporting full files, line ranges, and git diffs
- Real-time size tracking with 125KB limit (warnings at 100KB, 115KB)
- Multi-file batch processing and section organization
- Config file support for reusable extraction plans (JSON)

#### Plugin Infrastructure
- Claude Code plugin integration with marketplace support
- Relative path handling for cross-installation compatibility
- Node.js 18+ with ESM module support

#### Documentation
- CLAUDE.md, CONTRIBUTING.md, and comprehensive skill documentation
- Installation instructions and troubleshooting guide

[1.1.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.1.0
[1.0.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.0.0
