# Update PR Skill

> Creates comprehensive PR descriptions by systematically reviewing all changes

## Overview

This skill helps Claude create thorough PR descriptions that document every meaningful change in a branch - not just the headline feature, but also bug fixes, test improvements, configuration changes, and documentation updates.

**For complete plugin documentation, see the [main README](../../README.md).**

## Quick Reference

**Example prompts:**
```
"Update the PR description"
"Prepare this PR for review"
"Document the changes in this branch"
"Write a comprehensive PR summary"
```

**What it does:**
- Systematically inventories ALL changed files and commits
- Categorizes changes (features, fixes, tests, docs, config)
- Creates structured PR descriptions with user impact section
- Saves to `/tmp/pr-summary.md` and updates PR via `gh pr edit`

**Allowed tools:** Bash, Read, Write, Edit, Glob, Grep

## How It Works

The skill runs a 5-phase workflow:

1. **Inventory** - Detects base branch (from PR or default), runs git diff/log commands
2. **Categorization** - Groups files by type (core, fixes, tests, docs, config)
3. **Analysis** - Reviews each commit to understand what/why/impact
4. **Documentation** - Creates structured PR description
5. **Update** - Saves to temp file, optionally updates PR

See [SKILL.md](SKILL.md) for the complete workflow details.

## Tips for Best Results

1. **Let it run all phases** - Don't interrupt the systematic review
2. **Review before updating** - Claude will show you the summary first
3. **Provide context** - Mention important context Claude can't see in the code
4. **Base branch detection** - Uses PR's actual base branch (supports release backports, non-default targets)

## Requirements

- **gh CLI** - GitHub's official CLI, authenticated
- **Git** - For diff and log commands

## Documentation

- **[SKILL.md](SKILL.md)** - Complete workflow for Claude
- **[EXAMPLES.md](EXAMPLES.md)** - Good vs bad PR description examples

## License

MIT - See [LICENSE](../../LICENSE)
