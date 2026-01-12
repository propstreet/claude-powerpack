# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Powerpack is a Claude Code plugin that provides productivity tools for developers. It includes:

- **update-pr skill** - Creates comprehensive PR descriptions by systematically reviewing all changes
- **ask-expert skill** - Extracts code with size tracking for external expert consultation

## Repository Structure

- `.claude-plugin/plugin.json` - Plugin metadata and configuration
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
- **user-invocable** explicitly declare if skill appears in slash menu
- **context: fork** runs skill in isolated sub-agent (keeps main conversation clean)
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
| `package.json` | `"version": "x.y.z"` |
| `README.md` | Version badge URL |
| `CHANGELOG.md` | New `## [x.y.z]` section + footer link |

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

