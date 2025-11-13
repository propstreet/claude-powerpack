# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Powerpack is a Claude Code plugin that provides productivity tools for creating expert consultation documents. The main component is the **ask-expert skill**, which helps extract code, track document size, and organize technical context for external review.

## Repository Structure

- `.claude-plugin/plugin.json` - Plugin metadata and configuration
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

# Test skill activation (in Claude Code)
"Create an expert consultation document for..."

# Uninstall and reinstall after changes
/plugin uninstall claude-powerpack
/plugin install YOUR-USERNAME/claude-powerpack
```

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

The ask-expert skill activates when users request:
- "create an expert consultation document"
- "prepare code for expert review"
- "gather architecture context"

Activation is defined in `skills/ask-expert/SKILL.md:2-3` (the `description` field).

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

### SKILL.md Requirements

```yaml
---
name: skill-name
description: Clear description with trigger phrases. Mention when to use.
allowed-tools: [Bash, Read, Write, Edit]
---
```

- **description** must include activation trigger phrases
- **allowed-tools** restricts which Claude Code tools the skill can use
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
2. ✅ Verify skill activation with trigger phrases
3. ✅ Test extraction script with various file patterns
4. ✅ Verify git diff functionality (if changed)
5. ✅ Check size tracking accuracy
6. ✅ Test error handling (missing files, invalid ranges, etc.)
7. ✅ Update version in `plugin.json` if needed

## Version Management

The plugin uses semantic versioning in `.claude-plugin/plugin.json`:
```json
{
  "version": "1.0.0"
}
```

Skills document their version compatibility in their description field.
