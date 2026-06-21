# Changelog

All notable changes to Claude Powerpack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2026-06-19

### Added

#### PR Audit Angles Skill
- New `pr-audit-angles` skill — multi-angle parallel audit of a large PR or branch before merge. Splits the change into independent angles (matched to the changed surface), dispatches one capable subagent per angle anchored to the repo's *own* conventions, and has the orchestrator verify every candidate finding against current code before synthesizing a single merge-readiness verdict.
- Repo-agnostic by design: angles, hard rules, and the lint/build/test commands are discovered from the host repo's docs, configs, and CI rather than hardcoded.
- Each angle returns a uniform Blockers / Important / New-concepts-verdict / Verified-clean report; a subagent claim is treated as a lead, not a verdict, until the orchestrator confirms it with a file:line citation.
- Includes `EXAMPLES.md` with ready-to-adapt structured schemas and a parallel-orchestration script (plus a find→adversarially-verify variant).

#### PR Fix Angles Skill
- New `pr-fix-angles` skill — the execution companion to `pr-audit-angles`. Takes a set of verified findings and fixes them all by partitioning into lanes of **exclusive file ownership**, so multiple subagents edit in parallel without merge conflicts. A lane whose findings share a hot file runs as sequential stages; independent lanes run concurrently.
- The orchestrator owns the single final lint→build→test gate and never commits without you; agents leave changes in the working tree and defer any out-of-lane edits.
- Emphasizes hand-writing the failing-test design into each fix prompt, freezing shared wire contracts for the campaign, and a skeptical find→verify pre-step so agents never fix phantom or already-closed findings.
- Includes `EXAMPLES.md` with the per-lane fix schema and a disjoint-lane orchestration script (with one lane staged on a shared file).

### Changed

#### Capability-based model guidance (no hardcoded model names)
- Replaced hardcoded model names in live guidance with capability-based phrasing so the plugin doesn't go stale as model lineups change. The `code-researcher` agent description and its README entry now say "a faster, lower-cost model" / "your most capable model" instead of naming specific tiers. (Historical CHANGELOG entries are left as-is.)

## [2.1.0] - 2026-04-01

### Added

#### Ask Expert Skill
- New `--branch-diff <base>` option to extract all changes between merge-base of a branch and HEAD — ideal for PR consultations that need the full picture in one command
- New `--new-files-from <base>` option to include full syntax-highlighted source of files added since a base branch (complements `--branch-diff` for new file review)
- Both options auto-resolve merge base, so merged upstream commits don't pollute the diff
- Updated SKILL.md and EXAMPLES.md with branch-level patterns and a complete PR consultation example

## [2.0.1] - 2026-03-23

### Fixed

#### Ask Expert Skill
- Restored explicit structure for Step 3 (Expert Request) — the 2.0 rewrite condensed the questions template to a single abstract sentence, causing Claude to skip appending the expert questions section at the end of documents

## [2.0.0] - 2026-03-20

### Changed

#### All Skills — Intent-Based Rewrite
- **Breaking**: Rewrote all 7 skills to describe intent instead of prescribing exact commands, following Anthropic's "Avoid Railroading Claude" best practice
- Removed prescriptive bash code blocks that taught Claude things it already knows (git, gh, npm, linting, file detection)
- Replaced step-by-step shell commands with goal-oriented instructions, giving Claude flexibility to adapt to each project
- Added Gotchas sections to each skill, collecting non-obvious failure points and constraints in one place
- Broadened `allowed-tools` from overly-specific patterns (`Bash(git log:*)`) to per-binary wildcards (`Bash(git:*)`) — eliminates permission prompts for valid commands
- Total reduction: ~500 lines of prescriptive instructions removed across all skills

#### trim-pr
- Step 1 (base branch detection): 12 lines with 3 code blocks → 1 sentence of intent
- Step 7 (verification): 5 language-specific code blocks → 1 sentence ("run the project's linter, build, and tests")
- Kept: cruft patterns table, over-engineering checklist, comment rewriting examples — the actual non-obvious value

#### update-pr
- Phase 1 (change inventory): 35 lines of git/gh commands with `$BASE_BRANCH` variables → 2 sentences of intent
- Removed troubleshooting section (basic gh commands Claude already knows)
- Kept: change categorization table, PR template structure, quality checklist

#### deep-interview
- Phase 1 (context gathering): removed code blocks for `gh issue view`, Glob, Grep examples
- Phases 5-6: condensed prescriptive question templates to intent descriptions
- Kept: interview flow structure, question format examples, PRD output template

#### analyze-deps
- Step 1 (ecosystem detection): removed all shell code blocks for ls, find, ncu, npm, dotnet
- Step 2 (research): removed GitHub API code blocks with complex jq
- Kept: mode table, research priority order, report template, cross-reference step

#### ask-expert
- Removed `cat > file << 'EOF'` heredoc examples — Claude knows how to create files
- Removed basic troubleshooting section
- Kept: extraction script examples (custom tool with non-obvious flags), document structure, config format

#### debrief
- Phase 2: removed Glob/Grep usage examples
- Kept essentially everything else — this skill is already knowledge-heavy, not command-heavy

#### mine-history
- Fixed `$(pwd)` → `.` in script invocation (was triggering permission prompts)
- Otherwise minimal changes — already well-structured

## [1.9.0] - 2026-03-16

### Added

#### Analyze Dependencies Skill
- New skill for dependency update changelog analysis with actionable recommendations
- **Multi-mode operation**: preflight (research before updating), post-update (analyze git diff), or specific package version research
- **Ecosystem support**: npm (via `package.json`) and NuGet (via `Directory.Packages.props` / `*.csproj`) with auto-detection
- **Multi-source research pipeline**: Context7 MCP → GitHub Releases API → WebSearch → WebFetch, with parallel subagent dispatch for >5 packages
- **Codebase cross-referencing**: greps for actual usage of deprecated/changed APIs, identifies files affected by breaking changes
- **Structured report**: breaking changes, new features worth adopting, performance improvements, deprecation warnings, security fixes, and prioritized recommendations (quick wins / planned work / watch list)
- **Scoped analysis**: `frontend` or `backend` argument to limit to one ecosystem

## [1.8.1] - 2026-03-13

### Added

#### Debrief Skill
- **Stale entry pruning** (Phase 2.5): When CLAUDE.md exceeds 250 lines and high-signal learnings need adding, scans for stale entries and proposes removals alongside additions
- Phase 3 proposals now show removals with evidence and net line delta
- Updated 300+ line edge case to attempt pruning before routing to .claude/rules/

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

[2.2.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v2.2.0
[2.1.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v2.1.0
[2.0.1]: https://github.com/propstreet/claude-powerpack/releases/tag/v2.0.1
[2.0.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v2.0.0
[1.9.0]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.9.0
[1.8.1]: https://github.com/propstreet/claude-powerpack/releases/tag/v1.8.1
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
