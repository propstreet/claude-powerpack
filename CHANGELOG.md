# Changelog

All notable changes to Claude Powerpack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.1] - 2026-02-03

### Fixed

#### Ask Expert Skill
- Fixed allowed-tools pattern to support absolute paths for extraction script
- Simplified from three patterns to single hardened pattern: `Bash(node:*scripts/extract-code.js*)`

## [1.4.0] - 2026-02-02

### Added

#### Deep Interview Skill
- New skill for structured requirements gathering via AskUserQuestion
- 7-phase interview process: Context → Scope → Approach → Priority → Details → Technical → Timeline
- Automatic PRD generation with decision log and implementation checklist
- GitHub issue integration for context gathering
- Best practices for stakeholder interviews

#### Simplify Skill
- New skill for pre-merge PR cleanup
- Identifies accumulated cruft: debug logging, commented code, unused imports
- Detects over-engineering: premature abstractions, dead code paths, speculative features
- Framework-agnostic verification (auto-detects Node.js, Python, Go, Rust)
- Risk-rated change summary table

## [1.3.0] - 2026-01-31

### Added

#### Ask Expert Skill
- New `--staged` option to include all staged changes (`git diff --cached`)
- New `--commit` option to include specific commit changes (`git show`)
- Multiple commits supported with repeated `--commit` flags
- Can combine git options with file extraction in a single command

### Changed

#### Ask Expert Skill
- Files are now optional when using `--staged` or `--commit`
- Updated messaging from "files" to "items" for clarity
- Enhanced documentation in SKILL.md with new examples

## [1.2.0] - 2026-01-12

### Changed

#### Claude Code 2.1.x Compatibility
- Updated skill frontmatter to use YAML array format for `allowed-tools`
- Restricted Bash permissions with wildcard patterns (e.g., `Bash(git:*)`, `Bash(node:*)`) for improved security
- Added `user-invocable: true` explicitly to both skills
- Added `context: fork` to run skills in isolated sub-agent contexts (keeps main conversation clean)
- Enhanced trigger phrases in skill descriptions for better auto-discovery

#### Plugin Manifest
- Added `license`, `homepage`, and explicit `skills` path to plugin.json
- Added `pr-description` keyword

## [1.1.1] - 2025-11-28

### Fixed

#### Update PR Skill
- Fixed base branch detection command syntax that failed when passed as command string
- Replaced multi-line `$(...)` with backslash continuations with separate commands
- Changed `git symbolic-ref` to `git rev-parse --abbrev-ref` for simpler branch name extraction

## [1.1.0] - 2025-11-26

### Added

#### Update PR Skill
- New skill for creating comprehensive PR descriptions
- 5-phase workflow: inventory, categorization, analysis, documentation, update
- Multi-category documentation (features, fixes, tests, docs, config, build)
- Structured output with user impact and technical notes sections
- GitHub integration via `gh pr edit`
- Smart base branch detection (uses PR's actual base, falls back to default)
- Good vs bad examples in EXAMPLES.md

#### Requirements
- Added gh CLI as a requirement (for update-pr skill)

### Changed

#### Documentation
- Streamlined skill READMEs with consistent structure
- Standardized terminology ("Example prompts" instead of "Activation triggers")
- Removed redundant "When to Use" sections from SKILL.md files (DRY)
- Condensed CHANGELOG entries for conciseness
- Updated CLAUDE.md with both skills and version management guidance
- Fixed broken license link in ask-expert/README.md

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

[1.4.1]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.4.1
[1.4.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.4.0
[1.3.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.3.0
[1.2.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.2.0
[1.1.1]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.1.1
[1.1.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.1.0
[1.0.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.0.0
