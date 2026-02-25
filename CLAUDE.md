# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Powerpack is a Claude Code plugin that provides productivity tools for developers. Skills (alphabetical):

- **[ask-expert](skills/ask-expert/SKILL.md)** - Extracts code with size tracking for external expert consultation
- **[debrief](skills/debrief/SKILL.md)** - Captures session learnings and updates project docs with progressive disclosure
- **[deep-interview](skills/deep-interview/SKILL.md)** - Structured requirements gathering via AskUserQuestion
- **[mine-history](skills/mine-history/SKILL.md)** - Extracts learnings from all past session transcripts via pattern-based correction detection
- **[simplify](skills/simplify/SKILL.md)** - Pre-merge PR cleanup: trims accumulated cruft and over-engineering
- **[update-pr](skills/update-pr/SKILL.md)** - Creates comprehensive PR descriptions by systematically reviewing all changes

## Repository Structure

- `.claude-plugin/plugin.json` - Plugin metadata and configuration
- `skills/mine-history/` - Session history mining skill
  - `SKILL.md` - 5-phase workflow for extracting and synthesizing learnings
  - `scripts/extract-learnings.js` - Node.js extraction script (zero deps, ESM)
- `skills/debrief/` - The debrief skill (session learning capture)
  - `SKILL.md` - 4-phase debrief workflow with CLAUDE.md token discipline rules
  - `EXAMPLES.md` - Good vs bad examples, routing decision guide
  - `README.md` - User-facing documentation
- `skills/update-pr/` - The update-pr skill implementation
  - `SKILL.md` - Multi-phase workflow for comprehensive PR descriptions
  - `EXAMPLES.md` - Good vs bad PR description examples
  - `README.md` - User-facing documentation
- `skills/ask-expert/` - The ask-expert skill implementation
  - `SKILL.md` - Skill definition loaded by Claude Code (with YAML frontmatter)
  - `EXAMPLES.md` - Detailed usage examples and patterns
  - `README.md` - User-facing documentation
  - `scripts/extract-code.js` - Node.js script for code extraction with size tracking

## Development Commands

This is a plugin repository with no build process. Testing is done by installing the plugin in Claude Code.

### Testing the Plugin Locally

```bash
# Install from your fork/branch
/plugin install YOUR-USERNAME/claude-powerpack

# Verify installation
/plugin

# Uninstall and reinstall after changes
/plugin uninstall claude-powerpack
/plugin install YOUR-USERNAME/claude-powerpack
```

**Test skill activation** by typing these prompts in Claude Code chat:
- `Update the PR description` → update-pr skill
- `Create an expert consultation document for...` → ask-expert skill
- `Debrief this session` → debrief skill

### Testing the Extraction Script

The extraction script is Node.js (ESM) and can be tested directly:

```bash
# Requires Node.js 18+
node --version

# Show help
node skills/ask-expert/scripts/extract-code.js --help

# Test basic extraction
node skills/ask-expert/scripts/extract-code.js \
  --track-size --output=/tmp/test.md \
  README.md

# Verify output
wc -c /tmp/test.md
```

## Architecture

### Plugin System Integration

The plugin follows Claude Code's plugin specification:
- `plugin.json` defines metadata (name, version, description, repository)
- Skills are placed in `skills/{skill-name}/` directories
- Each skill has `SKILL.md` with YAML frontmatter defining activation criteria

### Skill Activation

Skills activate based on their `description` field in SKILL.md frontmatter. Claude matches user requests against these descriptions to determine which skill to invoke.

See [README.md - Skills Included](README.md#skills-included) for example prompts that trigger each skill.

### Code Extraction Script

`skills/ask-expert/scripts/extract-code.js` is a standalone Node.js script that:
- Extracts full files, line ranges, or git diffs
- Formats output as markdown code blocks
- Tracks cumulative size to stay within 125KB limit
- Supports batch processing multiple files
- Validates all files before writing output (atomic operations)
- Can be used via CLI or config file

**Key design patterns:**
- Validation happens before any file writes (prevents partial output on errors)
- Appends to existing files (allows incremental building)
- Size tracking with warnings at 100KB and 115KB thresholds
- Supports both `--output` flag and traditional shell redirection

## Skill Development Guidelines

When modifying the ask-expert skill or creating new skills:

### SKILL.md Requirements (Claude Code 2.1.x)

```yaml
---
name: skill-name
description: Clear description with trigger phrases. Use when user asks to "do X", "perform Y", or needs Z.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash(git:*)
  - Bash(node:*)
user-invocable: true
context: fork
---
```

- **description** must include activation trigger phrases in quotes for auto-discovery
- **allowed-tools** use YAML array format with Bash wildcard patterns (e.g., `Bash(git:*)`) for security
- **user-invocable** is the correct spelling (`user-invocable` with c, NOT `user-invokable` with k — VS Code extension has a known bug [#23723](https://github.com/anthropics/claude-code/issues/23723))
- **context: fork** runs skill in isolated sub-agent — but forked skills have NO conversation history and CANNOT use AskUserQuestion. Skills needing either must omit `context: fork`.
- **Additional frontmatter fields**: `argument-hint` (autocomplete hint), `model` (per-skill model override), `hooks` (scoped hooks), `agent` (subagent type for forked skills)
- **Glob tool** does not support brace expansion `{A,B}*.md` — use separate Glob patterns instead
- Keep SKILL.md under 500 lines (move detailed examples to EXAMPLES.md)

### Progressive Disclosure Pattern

The skill uses a three-tier documentation structure:
1. **SKILL.md** - Loaded by Claude, contains workflow and critical rules
2. **EXAMPLES.md** - Detailed usage patterns and complete workflows
3. **README.md** - User-facing documentation (not loaded by Claude)

This keeps Claude's context focused while providing comprehensive documentation.

### File Path Patterns

The extraction script is accessed via **relative path** following official Claude Code conventions:

```bash
# Correct (works regardless of installation method):
node scripts/extract-code.js

# Why: Skills execute with their directory as the working directory
# This works for personal skills, project skills, and plugin-installed skills
```

**Key principle**: Use relative paths for all script and file references within skills, as documented in the official Anthropic skills repository.

## Code Quality Standards

From CONTRIBUTING.md:

### JavaScript/Node.js
- Use ESLint with project settings
- Run Prettier for formatting
- Add JSDoc comments for all functions
- Use clear, descriptive variable names

### Skills Checklist
- ✅ Clear activation criteria in SKILL.md description
- ✅ Proper YAML frontmatter with allowed-tools
- ✅ Progressive disclosure (keep SKILL.md concise)
- ✅ Version documented in plugin.json

## Important Constraints

### Size Limits
Expert consultation documents target **125KB maximum** to stay within LLM context limits. The extraction script enforces this with:
- `MAX_SIZE_BYTES = 125 * 1024`
- Warning at 100KB
- Warning at 115KB
- Error and exit at 125KB

### Git Integration
Diff functionality requires:
- Valid git repository
- Valid git references (branches, commits, ranges)
- File must exist in git history

The script validates git refs before attempting diffs (`skills/ask-expert/scripts/extract-code.js:117-149`).

## Testing Checklist

Before submitting changes:

1. ✅ Test locally using `/plugin install YOUR-USERNAME/claude-powerpack`
2. ✅ Verify skill activation with trigger phrases (both skills)
3. ✅ Test update-pr skill on a branch with multiple commits
4. ✅ Test extraction script with various file patterns
5. ✅ Verify git diff functionality (if changed)
6. ✅ Check size tracking accuracy
7. ✅ Test error handling (missing files, invalid ranges, no PR, etc.)
8. ✅ Update version in `plugin.json` if needed

## Version Management

The plugin uses semantic versioning. **When bumping versions, update ALL of these files:**

| File | Field/Location |
|------|----------------|
| `.claude-plugin/plugin.json` | `"version": "x.y.z"` |
| `.claude-plugin/marketplace.json` | `"version"` in **both** top-level and `plugins[0]` |
| `package.json` | `"version": "x.y.z"` |
| `README.md` | Version badge URL |
| `CHANGELOG.md` | New `## [x.y.z]` section + footer link |

**marketplace.json is what Claude Code settings displays** — forgetting it shows stale versions to users.

### Git Workflow

**Never amend pushed commits.** Once a commit is pushed to a remote branch:
- Create a new commit for fixes instead of amending
- Amending requires force push, which rewrites public history
- Force push can cause issues for collaborators and breaks PR review flow

**When amend is acceptable:**
- Local commits not yet pushed
- Explicitly requested by the user

**Prefer separate commits for:**
- Security fixes (creates audit trail)
- Review feedback (shows the review process)
- Distinct logical changes

### Creating a Release

After merging version bump to main:

```bash
# Switch to main and pull
git checkout main && git pull

# Create GitHub release (uses CHANGELOG content for notes)
gh release create v1.1.1 --title "v1.1.1" --notes "$(cat <<'EOF'
## Fixed

- Description of fixes...

See [CHANGELOG.md](https://github.com/propstreet/claude-powerpack/blob/main/CHANGELOG.md) for full details.
EOF
)"
```

