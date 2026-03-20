---
name: analyze-deps
description: Analyze dependency updates and generate a changelog report with breaking changes, new features, and actionable recommendations. Use after updating packages, before planned upgrades (preflight), or to research what changed between specific versions. Triggers on "analyze deps", "analyze dependencies", "dependency update report", "breaking changes in update", "what changed in dependency update".
argument-hint: "[preflight] [frontend|backend] or [package from to]"
user-invocable: true
context: fork
allowed-tools:
  - Bash(git:*)
  - Bash(gh:*)
  - Bash(ncu:*)
  - Bash(npm:*)
  - Bash(dotnet:*)
  - Bash(ls:*)
  - Bash(find:*)
  - Read
  - Glob
  - Grep
  - Agent
  - WebSearch
  - WebFetch
  - mcp__context7__*
---

# Dependency Update Analysis

Generate a changelog analysis with breaking changes, new features, and actionable recommendations.

**User arguments:** $ARGUMENTS

## Mode

Parse the user's arguments to determine mode:

| Input | Mode | Behavior |
|-------|------|----------|
| `preflight` | Preflight | Check what's outdated, research before updating |
| `preflight frontend` | Preflight (npm only) | Preflight for npm packages |
| `preflight backend` | Preflight (NuGet only) | Preflight for NuGet packages |
| *(empty)* | Post-update | Analyze what already changed (git diff) |
| `frontend` / `backend` | Post-update (scoped) | Limit analysis to one ecosystem |
| `vue 3.5 to 3.6` | Specific | Research a specific package version range |

## Step 1: Detect Ecosystems and Changes

Detect which ecosystems are present (look for `package.json` for npm, `Directory.Packages.props` / `*.csproj` for NuGet).

- **Preflight mode**: Check what packages are outdated using ecosystem-appropriate tools (`ncu`, `npm outdated`, `dotnet list --outdated`)
- **Post-update mode**: Check git diff for changes to package files. If no uncommitted changes, check recent commits
- **Specific package mode**: Use the package name and version range from arguments directly

Build a change list: `{package, currentVersion, newVersion, ecosystem}`.

## Step 2: Research Each Dependency

For each changed dependency, fetch release notes using these sources **in priority order**:

1. **Context7 MCP** (if available) — `resolve-library-id` → `query-docs` with topics like "what's new", "breaking changes", "migration guide"
2. **GitHub Releases API** — get repo URL from `npm view`, then fetch releases
3. **WebSearch** — search for release notes and changelogs
4. **WebFetch** — CHANGELOG.md or release page from search results

**Parallelization:** When >5 packages changed, use Agent tool to dispatch parallel research subagents (batch 3-5 packages per agent).

### What to extract per dependency

- **Breaking changes** — removed/renamed APIs, changed defaults, required migrations
- **Deprecations** — APIs marked deprecated, removal timeline
- **New features** — new capabilities, APIs, configuration options
- **Performance improvements** — speed, memory, bundle size
- **Security fixes** — CVEs, vulnerability patches

**Skip packages with only patch-level changes** unless they contain security fixes.

## Step 3: Cross-Reference with Codebase

For breaking changes and deprecations, grep the codebase for actual usage of affected APIs. Note file paths and line numbers for the report.

For new features, identify where in the project they could apply.

## Step 4: Generate Report

```markdown
# Dependency Update Report — {YYYY-MM-DD}
## Mode: {Preflight / Post-update / Specific}

## Summary
{one-line highlight of most impactful change}
({npm_count} npm, {nuget_count} NuGet)

## Breaking Changes
| Package | From → To | Change | Affected Code | Action Required |
|---------|-----------|--------|---------------|-----------------|
(Only if the project is actually affected. Include file paths.)

## New Features Worth Adopting
| Package | Feature | Potential Use | Impact Area |
|---------|---------|---------------|-------------|

## Performance Improvements
| Package | Improvement | Estimated Impact |
|---------|-------------|------------------|

## Deprecation Warnings
| Package | Deprecated API | Our Usage | Replacement | Deadline |
|---------|---------------|-----------|-------------|----------|
(Only if the project actually uses the deprecated API)

## Security Fixes
| Package | CVE/Advisory | Severity | Details |
|---------|-------------|----------|---------|

## Recommendations

### Quick Wins (adopt now, minimal effort)
- ...

### Worth Planning (feature-sized work)
- ...

### Watch List (upcoming changes to prepare for)
- ...
```

## Gotchas

- Be specific to the project — grep for actual usage, reference real file paths
- Link to docs — include URLs to migration guides or feature docs
- For preflight, rate each package: safe (patch), review (minor), research (major)
- Skip noise — don't list every patch bump, focus on what matters
- Shell constructs like `$()`, `&&`, and variable assignments in Bash calls can trigger permission prompts. Prefer simple, single-command calls when possible.

---
