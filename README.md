# Claude Powerpack

> Essential productivity tools for Claude Code: expert consultation docs, code extraction, and more

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/propstreet/claude-powerpack/releases)

## Features

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

### Ask Expert Skill

The skill activates automatically when you ask Claude to create consultation documents:

**Example prompts:**
```
"Create an expert consultation document for our authentication refactor"
"Prepare code for expert review about our API design"
"I need to ask an expert about our database schema"
```

Claude will:
1. Help structure the problem context
2. Extract relevant code using the bundled script
3. Add architecture diagrams and context
4. Format everything for expert review

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

- **[SKILL.md](skills/ask-expert/SKILL.md)** - Skill guide for Claude
- **[EXAMPLES.md](skills/ask-expert/EXAMPLES.md)** - Detailed usage patterns
- **[Skill README](skills/ask-expert/README.md)** - Complete skill documentation

## Skills Included

### ask-expert (v1.0.0)

**Activation triggers:**
- "create an expert consultation document"
- "prepare code for expert review"
- "gather architecture context"

**Capabilities:**
- Structures consultation documents
- Extracts code with size tracking
- Organizes content for expert analysis
- Ensures documents stay within LLM token limits

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

