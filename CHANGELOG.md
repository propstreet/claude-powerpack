# Changelog

All notable changes to Claude Powerpack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.0] - 2026-03-04

### Changed
- **Renamed simplify skill to trim-pr** to avoid conflict with Claude Code's built-in `/simplify` command.

## [1.7.2] - 2026-02-27

### Added
- **ask-expert**: New `--max-size <KB>` CLI flag for configurable size limit (default: 125KB). Also supported as `maxSize` in config files. Warning thresholds scale proportionally (80% and 92% of limit).

## [1.7.1] - 2026-02-26

### Fixed
- **Plugin manifest**: Changed `agents` field from directory string (`"./agents/"`) to array of file paths (`["./agents/code-researcher.md"]`). Claude Code 1.7.0 validates agents as an array, causing plugin load failure with "agents: Invalid input".

## [1.7.0] - 2026-02-26

### Added
- **code-researcher agent** — Deep codebase analysis specialist for tracing execution flows, finding usage patterns, mapping architectures, and auditing for inconsistencies. Supports ast-grep structural search, git history investigation, and quantitative data pipelines. Includes model selection guidance in description field — orchestrating agents know when to use Sonnet (fast lookups) vs Opus (deep analysis).
- **Agent distribution support** — Plugin now distributes agents via `agents/` directory alongside existing skills

## [1.6.1] - 2026-02-25

### Fixed

#### Mine History Skill
- Fixed 3 double-scoring overlaps in correction patterns that inflated scores for certain phrases
  - Removed redundant `/^dont\s/i` (already covered by `/^don'?t\s/i`)
  - Merged overlapping learning/pattern signal patterns into single `/^(read|check|follow|see)\s(our|the)\s/i`
  - Removed unanchored `/use\s.+not\s/i` (subset of anchored `/^use\s.+\s(instead|not)\s/i`)
- Fixed noise filter gap: "no, that's fine" and other comma-separated dismissals were scored as corrections
  - Changed all `^no\s+` noise patterns to `^no[,.\s]\s*` to match comma/period after "no"
  - Consolidated duplicate "no worries/problem/rush" noise patterns into single location
- Added missing correction patterns: `you cannot`, `wait,`, `hold on`
- Added missing `<local-command-caveat>` and `<user-prompt-submit-hook>` to `stripTags()`
- Removed redundant `\s*$` noise pattern (strict subset of `[,.!\s]*$` variant)

### Added
- Version check script (`npm run check-versions`) to verify all version strings are in sync before release
- Added check step to release instructions in CLAUDE.md

### Fixed (non-skill)
- README.md version badge was stuck at 1.5.0 (now tracks release version)

## [1.6.0] - 2026-02-25

### Added

#### Mine History Skill
- New skill to extract and synthesize learnings from all past Claude Code session transcripts
- Pattern-based correction detection: identifies user corrections, mandates, and redirections
- Signal scoring with brevity weighting: short, direct corrections ranked highest (0-5 scale)
- Noise filtering: strips agent team messages, task notifications, expert consultation pastes, skill headers, XML tags
- Lead-text extraction: scores only the first sentence/paragraph to avoid false positives from long messages
- Deduplication with recurring-pattern boost: corrections seen across multiple sessions get score bonus
- Topic classification: auto-categorizes by testing, frontend, database, api, tools, services, git, etc.
- Batch processing support: `--batch-size` and `--batch-offset` for iterative extraction on large histories
- 5-phase synthesis workflow: Extract → Audit existing docs → Deduplicate → Present proposals → Apply with approval
- Standalone Node.js extraction script (zero dependencies, ESM, Node 18+)

## [1.5.0] - 2026-02-23

### Added

#### Debrief Skill
- New skill for end-of-session learning capture and project documentation updates
- 4-phase workflow: Review Session → Audit Docs → Propose Updates → Apply with Approval
- Progressive disclosure: high-signal one-liners to CLAUDE.md, detailed knowledge to .claude/rules/
- CLAUDE.md token discipline: enforces 300-line budget, earn-its-place test, no inline code blocks
- Supports .claude/rules/ path-scoped rule files for domain-specific learnings
- Updates project docs (CONTRIBUTING.md, ARCHITECTURE.md, docs/) when learnings affect processes
- Structured learning categories: mistakes, decisions, gotchas, patterns, process improvements, debugging
- User approval via AskUserQuestion before any writes
- Handles edge cases: missing CLAUDE.md, bloated CLAUDE.md, contradictory information, no learnings

## [1.4.3] - 2026-02-11

### Fixed

#### Update PR Skill
- Simplified output instructions: removed unnecessary temp file step and inline bash snippet
- Skill now directly instructs self-review, user approval, and `gh pr edit` — less prescriptive

## [1.4.2] - 2026-02-04

### Fixed

#### Ask Expert Skill
- Fixed size limit enforcement to validate total size BEFORE writing any output
- Previously, files were written incrementally and partial content remained after limit exceeded
- Now uses atomic validation: calculates total size upfront and only writes if everything fits
- Clear error output shows which items would fit vs. which would exceed the limit

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

[1.8.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.8.0
[1.7.2]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.7.2
[1.7.1]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.7.1
[1.7.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.7.0
[1.6.1]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.6.1
[1.6.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.6.0
[1.5.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.5.0
[1.4.3]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.4.3
[1.4.2]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.4.2
[1.4.1]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.4.1
[1.4.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.4.0
[1.3.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.3.0
[1.2.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.2.0
[1.1.1]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.1.1
[1.1.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.1.0
[1.0.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.0.0
