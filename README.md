# Claude Powerpack

> Essential productivity tools for Claude Code: expert consultation docs, code extraction, and more

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.3.0-green.svg)](https://github.com/propstreet/claude-powerpack/releases)

## Features

### Update PR Skill

Create comprehensive PR descriptions that document every meaningful change:

- **Systematic Review**: Inventories ALL changed files and commits
- **Multi-Category**: Features, bug fixes, tests, docs, config - nothing missed
- **Structured Output**: Organized sections for user impact and technical details
- **GitHub Integration**: Updates PR via `gh pr edit`

### Ask Expert Skill

Create comprehensive technical consultation documents for external expert review:

- **Code Extraction**: Full files, line ranges, or git diffs
- **Size Tracking**: Real-time progress with 125KB limit warnings
- **Multi-file Support**: Batch multiple files in single command
- **Section Organization**: Structured markdown headers
- **Git Integration**: Extract changes between branches/commits
- **Config Files**: Reusable extraction plans via JSON

## Installation

### Quick Install

1. **Add the marketplace**:
```shell
/plugin marketplace add propstreet/claude-powerpack
```

2. **Install the plugin**:
```shell
/plugin install claude-powerpack@propstreet
```

Or use the interactive menu:
```shell
/plugin
```
Then browse and select `claude-powerpack` from the available plugins.

After installation, restart Claude Code to activate the plugin.

### Verify Installation

Check that the plugin is installed:

```shell
/plugin
```

You should see `claude-powerpack` in the list of installed plugins.

## Usage

### Update PR Skill

Ask Claude to update or prepare a PR description. Claude will systematically inventory all changes, categorize them, and create a structured summary. See [Skills Included](#skills-included) for example prompts.

### Ask Expert Skill

Ask Claude to create consultation documents for external expert review. Claude will structure the problem, extract relevant code with size tracking, and format everything within the 125KB token limit. See [Skills Included](#skills-included) for example prompts.

### Manual Code Extraction

You can also use the extraction script directly:

**Basic extraction:**
```bash
node scripts/extract-code.js \
  --track-size --output=doc.md \
  src/Component.vue tests/Component.test.ts
```

**With sections:**
```bash
node scripts/extract-code.js \
  --track-size --output=doc.md \
  --section="What Changed" \
  src/Service.cs:diff \
  --section="Implementation" \
  src/Service.cs src/Model.cs
```

**Git diffs:**
```bash
node scripts/extract-code.js \
  --track-size --output=doc.md \
  src/Service.cs:diff=master..feature-branch
```

**Using config file:**
```bash
node scripts/extract-code.js \
  --config=extraction-plan.json
```

See [skills/ask-expert/EXAMPLES.md](skills/ask-expert/EXAMPLES.md) for complete usage examples.

## Requirements

- **Claude Code** with plugin support
- **Node.js** 18+ (for code extraction script)
- **Git** (for diff functionality)
- **gh CLI** (for update-pr skill) - [Install](https://cli.github.com/)

## Team Setup

Configure repository-level plugin installation by adding to your project's `.claude/settings.json`:

```json
{
  "plugins": [
    "propstreet/claude-powerpack"
  ]
}
```

Team members who trust the repository folder will automatically have the plugin installed.

## Documentation

### Update PR Skill
- **[SKILL.md](skills/update-pr/SKILL.md)** - Complete workflow for Claude
- **[EXAMPLES.md](skills/update-pr/EXAMPLES.md)** - Good vs bad PR examples
- **[README](skills/update-pr/README.md)** - Quick reference

### Ask Expert Skill
- **[SKILL.md](skills/ask-expert/SKILL.md)** - Complete workflow for Claude
- **[EXAMPLES.md](skills/ask-expert/EXAMPLES.md)** - Usage patterns and workflows
- **[README](skills/ask-expert/README.md)** - Quick reference

## Skills Included

### update-pr (v1.1.0)

**Example prompts:**
```
"Update the PR description"
"Prepare this PR for review"
"Document the changes in this branch"
"Write a comprehensive PR summary"
```

**What it does:**
- Inventories ALL changed files and commits systematically
- Categorizes changes: features, bug fixes, tests, docs, config
- Creates structured PR description with user impact section
- Saves to `/tmp/pr-summary.md` and updates PR via `gh pr edit`

**Allowed tools:** Bash, Read, Write, Edit, Glob, Grep

### ask-expert (v1.0.0)

**Example prompts:**
```
"Create an expert consultation document for our authentication refactor"
"Prepare code for expert review about our API design"
"I need to ask an expert about our database schema"
```

**What it does:**
- Structures consultation documents with problem context
- Extracts code with real-time size tracking (125KB limit)
- Supports full files, line ranges, and git diffs
- Formats everything for external expert review

**Allowed tools:** Bash, Read, Write, Edit

## Troubleshooting

### Plugin not activating

1. Verify installation: `/plugin`
2. Restart Claude Code after installing
3. Try explicit activation phrases: "create an expert consultation document"

### Script not found

```bash
# Verify script exists
ls scripts/extract-code.js

# Check Node.js version
node --version  # Should be 18+
```

### File not found errors

```bash
# Check current directory
pwd

# Use absolute paths for files in your repo
node scripts/extract-code.js \
  /absolute/path/to/file.cs
```

See [skills/ask-expert/README.md](skills/ask-expert/README.md#troubleshooting) for complete troubleshooting guide.

## Support

- **Issues**: [GitHub Issues](https://github.com/propstreet/claude-powerpack/issues)
- **Discussions**: [GitHub Discussions](https://github.com/propstreet/claude-powerpack/discussions)

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](LICENSE) for details.

## Credits

Created by [Propstreet](https://github.com/propstreet) for the Claude Code community.

Inspired by the need to effectively communicate complex technical context to external experts and AI consultants while respecting token limits.

