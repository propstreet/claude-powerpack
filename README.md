# Claude Powerpack

> Essential productivity tools for Claude Code: deep codebase analysis agent, expert consultation docs, code extraction, PR workflows, and more

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.9.0-green.svg)](https://github.com/propstreet/claude-powerpack/releases)

## Features

### Code Researcher Agent

Deep codebase analysis specialist for answering complex questions about code:

- **Execution Flow Tracing**: Follows call chains across frontend/backend boundaries through every layer
- **Usage Pattern Finding**: Quantified counts with file:line references
- **Architecture Mapping**: Full hierarchies with ASCII diagrams
- **Inconsistency Auditing**: Severity-rated findings across all consumer layers
- **Structural Search**: ast-grep for AST-level pattern matching
- **Git Investigation**: History, blame, evolution tracking

### Debrief Skill

End-of-session learning capture with progressive disclosure:

- **Session Analysis**: Scans conversation for mistakes, corrections, discoveries, and decisions
- **Doc Audit**: Checks CLAUDE.md, .claude/rules/, and project docs to avoid duplicates
- **Progressive Disclosure**: High-signal one-liners to CLAUDE.md, detailed knowledge to .claude/rules/
- **Stale Entry Pruning**: Identifies entries duplicated by docs, enforced by toolchain, outdated, or left as session debris
- **Token Discipline**: Enforces CLAUDE.md under 300 lines, routes domain knowledge to scoped rules
- **User Approval**: Presents all proposed changes before writing anything

### Deep Interview Skill

Structured requirements gathering via interactive interviews:

- **7-Phase Process**: Context → Scope → Approach → Priority → Details → Technical → Timeline
- **GitHub Integration**: Pulls issue context before asking questions
- **PRD Generation**: Auto-generates PRD with decision log and implementation checklist
- **Best Practices**: Multi-select questions, tradeoff presentation, stakeholder probing

### Trim PR Skill

Pre-merge PR cleanup to trim accumulated complexity:

- **Cruft Detection**: Debug logging, commented code, unused imports, TODOs for done work
- **Over-Engineering Check**: Premature abstractions, dead code paths, speculative features
- **Framework-Agnostic**: Auto-detects Node.js, Python, Go, Rust for verification
- **Risk-Rated Output**: Change summary with Low/Medium/High risk assessment

### Update PR Skill

Create comprehensive PR descriptions that document every meaningful change:

- **Systematic Review**: Inventories ALL changed files and commits
- **Multi-Category**: Features, bug fixes, tests, docs, config - nothing missed
- **Structured Output**: Organized sections for user impact and technical details
- **GitHub Integration**: Updates PR via `gh pr edit`

### Analyze Dependencies Skill

Changelog analysis for dependency updates with actionable recommendations:

- **Multi-Mode**: Preflight (before updating), post-update (after), or specific package research
- **Ecosystem Support**: npm and NuGet (auto-detected from project files)
- **Multi-Source Research**: Context7, GitHub Releases API, WebSearch, WebFetch
- **Codebase Cross-Reference**: Greps for actual usage of deprecated/changed APIs
- **Structured Report**: Breaking changes, new features, deprecations, security fixes, recommendations

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

### Code Researcher Agent

The code-researcher agent activates when Claude Code spawns a sub-agent for deep codebase analysis. It's used automatically by the Task tool when research questions match its description. See [Skills Included](#agents--skills-included) for example prompts.

### Debrief Skill

Run at the end of a session to capture learnings. Claude reviews the conversation, identifies what was learned, audits existing docs, and proposes targeted updates. See [Skills Included](#agents--skills-included) for example prompts.

### Deep Interview Skill

Ask Claude to interview you about a feature before implementation. Claude will research context, ask structured questions, and generate a PRD. See [Skills Included](#agents--skills-included) for example prompts.

### Trim PR Skill

Ask Claude to trim your PR before merging. Claude will identify accumulated cruft, over-engineering, and suggest cleanups with risk ratings. See [Skills Included](#agents--skills-included) for example prompts.

### Update PR Skill

Ask Claude to update or prepare a PR description. Claude will systematically inventory all changes, categorize them, and create a structured summary. See [Skills Included](#agents--skills-included) for example prompts.

### Analyze Dependencies Skill

Ask Claude to analyze dependency updates or run a preflight check before upgrading. Claude researches changelogs, cross-references your codebase, and generates a structured report. See [Skills Included](#agents--skills-included) for example prompts.

### Ask Expert Skill

Ask Claude to create consultation documents for external expert review. Claude will structure the problem, extract relevant code with size tracking, and format everything within the 125KB token limit. See [Skills Included](#agents--skills-included) for example prompts.

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

### Code Researcher Agent
- **[Agent Definition](agents/code-researcher.md)** - Full agent prompt with methodology, tool guidance, and output calibration

### Debrief Skill
- **[SKILL.md](skills/debrief/SKILL.md)** - Complete debrief workflow
- **[EXAMPLES.md](skills/debrief/EXAMPLES.md)** - Good vs bad examples, routing decisions
- **[README](skills/debrief/README.md)** - Quick reference

### Deep Interview Skill
- **[SKILL.md](skills/deep-interview/SKILL.md)** - Complete interview workflow

### Trim PR Skill
- **[SKILL.md](skills/trim-pr/SKILL.md)** - Complete cleanup workflow

### Update PR Skill
- **[SKILL.md](skills/update-pr/SKILL.md)** - Complete workflow for Claude
- **[EXAMPLES.md](skills/update-pr/EXAMPLES.md)** - Good vs bad PR examples
- **[README](skills/update-pr/README.md)** - Quick reference

### Analyze Dependencies Skill
- **[SKILL.md](skills/analyze-deps/SKILL.md)** - Complete analysis workflow
- **[README](skills/analyze-deps/README.md)** - Quick reference

### Ask Expert Skill
- **[SKILL.md](skills/ask-expert/SKILL.md)** - Complete workflow for Claude
- **[EXAMPLES.md](skills/ask-expert/EXAMPLES.md)** - Usage patterns and workflows
- **[README](skills/ask-expert/README.md)** - Quick reference

## Agents & Skills Included

### code-researcher (v1.7.0)

**Example prompts:**
```
"Research how the auth flow works end-to-end"
"Find all error handling patterns and check for inconsistencies"
"Map the test infrastructure architecture"
"Trace the execution flow from the API endpoint to the database query"
```

**What it does:**
- Deep codebase analysis using ast-grep, ripgrep, git, and native Claude Code tools
- Traces execution flows across frontend/backend boundaries
- Finds usage patterns with quantified counts
- Audits for inconsistencies with severity-rated findings
- Maps architecture hierarchies with ASCII diagrams

**Model guidance:** Use Sonnet for fast lookups and pattern counting; use Opus for deep architecture mapping and multi-layer flow tracing.

**Allowed tools:** Bash(ast-grep, rg, grep, find, git, jq, wc, head, tail, cat, sort, uniq, cut, tr, xargs, sed, awk, diff), Read, Glob, Grep

### debrief (v1.5.0)

**Example prompts:**
```
"Debrief this session"
"Capture learnings from what we just did"
"Update project knowledge with what we learned"
"What did we learn? Save it."
```

**What it does:**
- Reviews session for mistakes, corrections, discoveries, and decisions
- Audits CLAUDE.md, .claude/rules/, and project docs for existing coverage
- Proposes targeted updates with progressive disclosure
- Enforces CLAUDE.md token discipline (under 300 lines, high-signal only)
- Gets user approval before writing any changes

**Allowed tools:** Bash(git), Read, Edit, Write, Glob, Grep, AskUserQuestion

### deep-interview (v1.4.0)

**Example prompts:**
```
"Interview me about this feature before we start"
"Let's do a deep interview for issue #531"
"Help me gather requirements for the new authentication flow"
"Start a structured interview for this PRD"
```

**What it does:**
- Gathers context from GitHub issues and existing docs
- Asks structured questions through 7 phases
- Generates PRD with decision log and implementation checklist
- Probes for existing patterns and stakeholder knowledge

**Allowed tools:** Bash(git, gh), Read, Glob, Grep, AskUserQuestion, Write, Task

### trim-pr (introduced as simplify in v1.4.0, renamed in v1.8.0)

**Example prompts:**
```
"Trim this PR before merging"
"Clean up the accumulated cruft in this branch"
"Check for over-engineering before I merge"
"Review this PR for unnecessary complexity"
```

**What it does:**
- Identifies debug logging, commented code, unused imports
- Detects over-engineering and premature abstractions
- Auto-detects project type for verification commands
- Outputs risk-rated change summary table

**Allowed tools:** Bash(git, gh), Read, Edit, Glob, Grep

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

### analyze-deps (v1.9.0)

**Example prompts:**
```
"Analyze what changed after the dependency update"
"Run a preflight check before updating packages"
"What breaking changes are in vue 3.5 to 3.6?"
"Analyze deps for frontend only"
```

**What it does:**
- Detects npm and NuGet ecosystems from project files
- Preflight mode: checks what's outdated and researches before you update
- Post-update mode: detects changes via git diff and analyzes changelogs
- Fetches release notes from Context7, GitHub Releases, WebSearch
- Cross-references breaking changes against your actual codebase usage
- Generates structured report with recommendations

**Allowed tools:** Bash(git, ncu, npm, dotnet, gh, ls, find), Read, Glob, Grep, Agent, WebSearch, WebFetch, Context7

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

