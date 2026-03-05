---
name: trim-pr
description: Trim a PR before merging - remove complexity that accumulated during development. Use when preparing to merge, cleaning up code, trimming unnecessary complexity, or asked to simplify a PR.
user-invocable: true
context: fork
allowed-tools:
  # Git: read-only operations
  - Bash(git log:*)
  - Bash(git diff:*)
  - Bash(git status)
  - Bash(git show:*)
  - Bash(git ls-files:*)
  # GitHub CLI: read-only operations
  - Bash(gh pr view:*)
  - Bash(gh pr diff:*)
  # Build/lint tools (for verification step)
  - Bash(npm run lint:*)
  - Bash(npm run build:*)
  - Bash(npm run test:*)
  - Bash(ruff check:*)
  - Bash(pylint:*)
  - Bash(go build:*)
  - Bash(go vet:*)
  - Bash(go test:*)
  - Bash(cargo check:*)
  - Bash(cargo test:*)
  # .NET
  - Bash(dotnet build:*)
  - Bash(dotnet test:*)
  - Bash(dotnet format --verify-no-changes:*)
  # File operations
  - Read
  - Edit
  - Glob
  - Grep
---

# PR Simplification

Trim complexity that accumulated during development. This is NOT a code review - focus on removing cruft, not evaluating design decisions.

## When to Use This Skill

- Before merging a PR that went through multiple iterations
- When you suspect accumulated complexity from debugging/experimentation
- After receiving "simplify" or "clean up" feedback from reviewers
- Self-review before requesting PR review

## 1. Understand the Changes

Determine base branch and review scope:

```bash
# Get base branch from PR, or fall back to default branch
BASE_BRANCH=$(gh pr view --json baseRefName -q '.baseRefName' 2>/dev/null || \
  git rev-parse --abbrev-ref origin/HEAD 2>/dev/null | sed 's#origin/##' || echo 'main')

git diff "$BASE_BRANCH"...HEAD --stat
```

Read key changed files to understand what was built.

## 2. Look for Accumulated Cruft

During development, code often accumulates:

| Cruft                                            | Fix                                  |
| ------------------------------------------------ | ------------------------------------ |
| Repeated code blocks                             | Extract helper function              |
| Debug logging left behind                        | Remove or convert to proper logging  |
| Commented-out code                               | Delete it (git has history)          |
| TODO comments for things already done            | Remove them                          |
| Unused imports/variables                         | Delete them                          |
| Overly defensive null checks                     | Remove if caller guarantees non-null |
| Type casts that worked around WIP types          | Fix upstream types now               |
| Console.log / print statements                   | Remove or use proper logger          |
| Temporary variable names (temp, foo, xxx)        | Use descriptive names                |
| Comments referencing PR/PRD/review context       | Rewrite for future maintainers       |

**Note:** Named booleans like `isStarting` are often MORE readable than inlining conditions. Prefer clarity over minimal code.

## 3. Check for Over-Engineering

Look for complexity added "just in case" that isn't actually needed:

- **Unused flexibility**: Config options, parameters, or generics that only have one value/type
- **Premature abstraction**: Interfaces/base classes with single implementation
- **Dead code paths**: Branches that can never execute given current callers
- **Wrapper functions**: Functions that just call another function (inline them)
- **Speculative generality**: "We might need this later" code with no current use

Ask: "Is this complexity earning its keep, or was it added speculatively?"

## 4. Check for Common Anti-Patterns

### Backwards Compatibility Hacks

If you're not shipping a public API, remove:
- Renamed unused `_vars` kept for "compatibility"
- Re-exported types that nothing imports
- `// removed` comments marking deleted code
- Deprecated function wrappers

### Error Handling Theater

Remove defensive code that can't actually help:
- Try/catch that just re-throws
- Null checks after operations that guarantee non-null
- Type assertions immediately after type guards
- Validation of values from trusted internal sources

### Copy-Paste Artifacts

Look for:
- Duplicate logic that should be a shared function
- Similar but slightly different implementations
- Code comments that describe a different function

## 5. Clean Up Development-Context Comments

Comments written during development often reference context that won't exist for future maintainers. Review and rewrite comments that:

### Reference PR/Review Context

| Development Comment | Better For Maintainers |
| ------------------- | ---------------------- |
| `// P2 finding: add null check` | `// Guard against null from legacy API` |
| `// Per review feedback` | `// Explicit type conversion for clarity` |
| `// Addressing P3 concern about perf` | `// Cached to avoid repeated DB calls` |
| `// Fixed in response to CI failure` | `// Handle edge case where X is empty` |

### Reference PRD/Issue Context

| Development Comment | Better For Maintainers |
| ------------------- | ---------------------- |
| `// PRD Phase 2 scope` | `// Extended validation for enterprise users` |
| `// Part of #531 quick win` | `// Simplified flow for common case` |
| `// Out of scope for this PR` | (delete - git history has this) |
| `// MVP implementation, see PRD for full spec` | `// Basic implementation - see [doc] for extension points` |

### Temporal References

| Development Comment | Better For Maintainers |
| ------------------- | ---------------------- |
| `// TODO: revisit after merge` | (either do it now or delete) |
| `// Temporary workaround until X ships` | `// Workaround for [issue] in [dependency]` |
| `// New approach as of this PR` | (delete - all code was "new" once) |
| `// Changed from previous implementation` | (delete - git diff shows this) |

**Rule of thumb**: If a comment only makes sense to someone who read the PR, rewrite it or delete it.

## 6. Address PR Review Comments

If there are review comments from GitHub Actions, reviewers, or automated tools:

- Address substantive findings
- Verify the finding is still valid (reviewers see old commits)
- Explain trade-offs if not implementing a suggestion

## 7. Verify

After changes, run the project's standard checks based on project type:

**Node.js:**
```bash
[ -f package.json ] && npm run lint && npm run build
```

**Python:**
```bash
# Prefer ruff if available, fall back to pylint
if [ -f pyproject.toml ] || [ -f setup.py ]; then
  command -v ruff >/dev/null && ruff check .
  command -v pylint >/dev/null && pylint $(git ls-files '*.py')
fi
```

**Go:**
```bash
[ -f go.mod ] && go build ./... && go vet ./...
```

**Rust:**
```bash
[ -f Cargo.toml ] && cargo check
```

**.NET:**
```bash
ls *.sln >/dev/null 2>&1 && dotnet build && dotnet test
```

Or use project-specific commands if documented (check README, CONTRIBUTING, or CLAUDE.md).

Run relevant tests to ensure nothing broke.

## Output

Summary table of changes made:

| Issue | Fix | Risk |
| ----- | --- | ---- |
| Duplicate null check in `handleSubmit` | Removed redundant check | Low |
| Debug console.log in `api.ts` | Removed | Low |
| Unused `IFutureFeature` interface | Deleted | Low |
| ... | ... | ... |

**Risk levels:**
- **Low**: Removed dead code, comments, or unused imports
- **Medium**: Simplified logic, removed defensive code
- **High**: Changed behavior, removed "defensive" error handling

If no changes needed, state that the code is already clean and why.

---

## Quick Checklist

Before marking complete:

- [ ] No commented-out code remaining
- [ ] No TODO comments for completed work
- [ ] No debug logging/print statements
- [ ] No unused imports or variables
- [ ] No single-use abstractions
- [ ] No duplicate code blocks
- [ ] No PR/PRD/review-context comments (rewritten for maintainers)
- [ ] All tests pass
- [ ] Linting passes

---

$ARGUMENTS
