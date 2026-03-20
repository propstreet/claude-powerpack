---
name: update-pr
description: Creates comprehensive PR descriptions by systematically reviewing ALL changes - features, bug fixes, tests, docs, and infrastructure. Use when user asks to "update the PR", "prepare PR for review", "write PR description", or "document branch changes". Requires gh CLI.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash(git:*)
  - Bash(gh:*)
user-invocable: true
context: fork
---

# Comprehensive PR Description Creator

Create thorough PR descriptions that document EVERY meaningful change, not just the headline feature.

## Phase 1: Complete Change Inventory

Determine the PR's base branch, then review the full diff, changed files, and all commits since branching.

**NEVER assume you know what's in the PR based on branch name or first glance.** PRs often contain secondary bug fixes, performance optimizations, test infrastructure improvements, documentation updates, dependency changes, and configuration adjustments alongside the main feature.

## Phase 2: Categorize Changes

Using the diff output, create a categorized inventory of EVERY changed file:

| Category | What to look for |
|----------|-----------------|
| **Core application** | New methods, refactoring, bug fixes, performance improvements |
| **Bug fixes** | Scan commit messages for "fix", "bug", "correct", "resolve" |
| **Infrastructure** | Interceptors, middleware, base classes, test fixtures |
| **Configuration** | Config files, constants, environment settings, package files |
| **Tests** | New test files vs modified, test patterns, coverage improvements |
| **Documentation** | README, docs folders, inline documentation |
| **Build & tooling** | package.json, build configs, CI/CD, scripts |
| **UI/Frontend** | Components, styles, state management |

For each commit, identify the category (feature, bugfix, test, docs, refactor, perf, chore) and understand WHY the change was made, not just WHAT changed.

## Phase 3: Write Comprehensive Summary

Structure the PR description to cover all categories:

```markdown
## Summary

[One sentence covering the MAIN change, plus brief mention of other significant improvements]

## User Impact

**[Main Feature Category]:**
- [Specific user-facing improvements]

**[Secondary Categories if applicable — e.g., Reliability, Performance]:**
- [Bug fixes with impact]
- [Performance improvements]

## Technical Notes

### 1. [Main Feature Name]
[Detailed explanation with file references]

### 2. [Bug Fixes / Corrections]
[Each bug fix: location, what was wrong, impact, fix]

### 3. [Infrastructure / Performance]
[Test improvements, framework changes, optimizations]

### 4. [Configuration & Dependencies]
[Constants, config changes, dependency updates]

### 5. [Documentation]
[README updates, new docs, removed obsolete content]

## Testing

[Comprehensive test results with specific numbers]

## Implementation Approach

[List ALL commits with brief explanation of each]

---

Generated with [Claude Code](https://claude.com/claude-code)
```

## Phase 4: Update the PR

Show the summary to the user and ask if they want to update the PR. Only update with `gh pr edit` after approval.

## Quality Checklist

Before finalizing, verify:

- **Completeness**: Every commit is represented in the summary
- **Accuracy**: All bug fixes are documented with impact
- **Context**: WHY changes were made, not just WHAT changed
- **Organization**: Changes grouped logically
- **Specificity**: File paths for critical changes
- **Impact**: User-facing vs internal changes clearly separated
- **Testing**: Actual test results reported, not assumptions

## Gotchas

- PRs often contain a week's worth of work across multiple areas. The biggest mistake is focusing only on the main feature and skipping "small" changes like constants, config, docs, and especially bug fixes.
- If no PR exists yet, create one first before running the update process.
- Shell constructs like `$()`, `&&`, and variable assignments in Bash calls can trigger permission prompts. Prefer simple, single-command calls when possible.
