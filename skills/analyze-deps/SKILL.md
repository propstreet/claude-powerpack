---
name: analyze-deps
description: Analyze dependency updates and generate a changelog report with breaking changes, new features, and actionable recommendations. Use after updating packages, before planned upgrades (preflight), or to research what changed between specific versions. Triggers on "analyze deps", "dependency changelog", "what changed in", "breaking changes in update", "dependency report".
argument-hint: "[preflight] [frontend|backend] or [package from to]"
user-invocable: true
context: fork
allowed-tools:
  # Git: detect what changed
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(git status)
  - Bash(git show:*)
  # npm: check outdated, get repo URLs
  - Bash(ncu:*)
  - Bash(npm view:*)
  - Bash(npm outdated:*)
  # NuGet: check outdated
  - Bash(dotnet list:*)
  # GitHub: fetch release notes
  - Bash(gh api:*)
  - Bash(jq:*)
  # Utilities: ecosystem detection
  - Bash(ls:*)
  - Bash(find:*)
  # File operations
  - Read
  - Glob
  - Grep
  # Research
  - Agent
  - WebSearch
  - WebFetch
  - mcp__context7__*
---

# Dependency Update Analysis

Generate a changelog analysis with breaking changes, new features, and actionable recommendations.

## Supported Ecosystems

This skill currently focuses on **npm** and **NuGet** projects. It detects which ecosystems are present by looking for `package.json` (npm) and `Directory.Packages.props` / `*.csproj` (NuGet).

## Mode

Parse `$ARGUMENTS` to determine mode:

| Input | Mode | Behavior |
|-------|------|----------|
| `preflight` | Preflight | Check what's outdated, research before updating |
| `preflight frontend` | Preflight (npm only) | Preflight for npm packages |
| `preflight backend` | Preflight (NuGet only) | Preflight for NuGet packages |
| *(empty)* | Post-update | Analyze what already changed (git diff) |
| `frontend` / `backend` | Post-update (scoped) | Limit analysis to one ecosystem |
| `vue 3.5 to 3.6` | Specific | Research a specific package version range |

$ARGUMENTS

## Step 1: Detect Ecosystems and Changes

### Auto-detect project type

```bash
# npm project?
ls package.json 2>/dev/null

# NuGet project?
ls Directory.Packages.props 2>/dev/null || find . -maxdepth 3 -name "*.csproj" 2>/dev/null | head -1
```

### Preflight mode — check what would be updated

**npm:**
```bash
# ncu if available, otherwise npm outdated
ncu --packageFile package.json 2>/dev/null || npm outdated 2>/dev/null
```

**NuGet:**
```bash
# Find solution or project file
TARGET=$(find . -maxdepth 2 -name "*.sln" -print -quit 2>/dev/null)
[ -z "$TARGET" ] && TARGET=$(find . -maxdepth 3 -name "*.csproj" -print -quit 2>/dev/null)
[ -n "$TARGET" ] && dotnet list "$TARGET" package --outdated
```

Build change list: `{package, currentVersion, latestVersion, ecosystem}`.

### Post-update mode — detect what already changed

```bash
# Check uncommitted changes (npm + NuGet)
git diff HEAD -- '**/package.json' ':!node_modules'
git diff HEAD -- '**/Directory.Packages.props' '**/*.csproj'
```

If no uncommitted changes, check recent commits:

```bash
git log --oneline -10 --diff-filter=M -- '**/package.json' '**/Directory.Packages.props' '**/*.csproj'
```

### Specific package mode

Use the package name and version range from arguments directly.

## Step 2: Research Each Dependency

For each changed dependency, fetch release notes using these sources **in priority order**:

1. **Context7 MCP** (if available) — `resolve-library-id` → `query-docs` with topics: `"what's new in {version}"`, `"breaking changes"`, `"migration guide"`
2. **GitHub Releases API** — for npm packages, get repo URL from `npm view {package} repository.url` (strip `git+` prefix and `.git` suffix), then try tag variants:
   ```bash
   # Try exact tag first, then with v prefix
   gh api repos/{owner}/{repo}/releases/tags/{version} --jq '.body' 2>/dev/null || \
   gh api repos/{owner}/{repo}/releases/tags/v{version} --jq '.body' 2>/dev/null || \
   gh api repos/{owner}/{repo}/releases --jq '.[0:5] | .[] | .tag_name + ": " + ((.body // "") | split("\n")[0])'
   ```
3. **WebSearch** — `"{package} {newVersion} release notes changelog"`
4. **WebFetch** — CHANGELOG.md or release page from search results

**Parallelization:** When >5 packages changed, use Agent tool to dispatch parallel research subagents (batch 3-5 packages per agent). Each subagent returns structured findings.

### What to extract per dependency

- **Breaking changes** — removed/renamed APIs, changed defaults, required migrations
- **Deprecations** — APIs marked deprecated, removal timeline
- **New features** — new capabilities, APIs, configuration options
- **Performance improvements** — speed, memory, bundle size
- **Security fixes** — CVEs, vulnerability patches

**Skip packages with only patch-level changes** unless they contain security fixes.

## Step 3: Cross-Reference with Codebase

For breaking changes and deprecations, grep the codebase to check actual impact:

```bash
grep -rn "deprecatedApiName" . --include="*.cs" --include="*.ts" --include="*.vue" --include="*.js" --include="*.tsx" --include="*.jsx" --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=bin --exclude-dir=obj --exclude-dir=dist --exclude-dir=build
```

For new features, identify where in the project they could apply and estimate impact.

## Step 4: Generate Report

```markdown
# Dependency Update Report — {YYYY-MM-DD}
## Mode: {Preflight / Post-update / Specific}

## Summary
{Preflight: "N packages have updates available" / Post-update: "Updated N packages"}
({npm_count} npm, {nuget_count} NuGet)
{one-line highlight of most impactful change}

## Breaking Changes
| Package | From → To | Change | Affected Code | Action Required |
|---------|-----------|--------|---------------|-----------------|
(Only if the project is actually affected. Include file paths.)

## New Features Worth Adopting
| Package | Feature | Potential Use | Impact Area |
|---------|---------|---------------|-------------|
(Concrete improvements: UX, DX, performance)

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

### Report quality rules

- **Be specific to the project** — grep for actual usage, reference real file paths
- **Link to docs** — include URLs to migration guides or feature docs
- **Preflight risk assessment** — rate each package: safe (patch), review (minor), research (major)
- **Skip noise** — don't list every patch bump, focus on what matters

---
