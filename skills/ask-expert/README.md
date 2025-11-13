# Ask Expert Skill

> Creates expert consultation documents with automated code extraction, git diffs, and size tracking

## Overview

This skill helps Claude create comprehensive technical consultation documents for external expert review. It automatically activates when you ask Claude to prepare code for expert analysis.

**For complete plugin documentation, see the [main README](../../README.md).**

## Quick Reference

### Activation Triggers

- "Create an expert consultation document"
- "Prepare code for expert review"
- "Gather architecture context for external analysis"

### What It Does

- Guides you through structuring consultation documents
- Extracts code with size tracking (125KB limit)
- Organizes content with markdown sections
- Supports full files, line ranges, and git diffs

### Allowed Tools

Bash, Read, Write, Edit

## Script Usage

The skill uses a bundled extraction script. For manual usage:

**Basic extraction:**
```bash
node scripts/extract-code.js \
  --track-size --output=doc.md \
  src/file1.ts src/file2.ts
```

**With sections:**
```bash
node scripts/extract-code.js \
  --track-size --output=doc.md \
  --section="What Changed" src/Service.cs:diff \
  --section="Implementation" src/Service.cs
```

**Git diffs:**
```bash
node scripts/extract-code.js \
  src/Service.cs:diff=master..feature-branch
```

## Documentation

- **[SKILL.md](SKILL.md)** - Skill definition for Claude
- **[EXAMPLES.md](EXAMPLES.md)** - Detailed usage examples with complete workflows
- **[Script Reference](scripts/extract-code.js)** - Run with `--help` for all options

## Requirements

- Node.js 18+
- Git (for diff functionality)

## License

MIT - See [LICENSE](LICENSE)
