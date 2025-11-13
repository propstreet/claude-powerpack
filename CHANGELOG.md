# Changelog

All notable changes to Claude Powerpack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-13

### Added

#### Ask Expert Skill
- Expert consultation document creation with automated workflow
- Code extraction script with multiple input formats:
  - Full file extraction
  - Line range extraction (single and multiple ranges)
  - Git diff extraction (branch comparisons, commit ranges)
- Real-time size tracking with warnings:
  - 100KB warning threshold
  - 115KB warning threshold
  - 125KB hard limit
- Multi-file batch processing in single command
- Section organization with custom markdown headers
- Config file support for reusable extraction plans (JSON)
- Comprehensive documentation:
  - SKILL.md with workflow guidance
  - EXAMPLES.md with complete usage patterns
  - README.md with quick reference

#### Plugin Infrastructure
- Claude Code plugin integration following official conventions
- Marketplace support with proper plugin.json and marketplace.json
- Relative path handling for cross-installation compatibility
- Node.js script with ESM module support
- Git integration for diff functionality

#### Documentation
- CLAUDE.md for development guidance
- CONTRIBUTING.md with contribution guidelines
- Complete installation instructions
- Troubleshooting guide
- MIT License

### Technical Details
- Requires: Claude Code with plugin support
- Requires: Node.js 18+
- Requires: Git (for diff functionality)
- Atomic file operations (validation before writes)
- Append-mode support for incremental document building

[1.0.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.0.0
