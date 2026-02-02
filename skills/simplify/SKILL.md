---
name: simplify
description: Simplify a PR before merging - trim complexity that accumulated during development. Use when preparing to merge, cleaning up code, or reviewing for unnecessary complexity.
user-invocable: true
allowed-tools:
  - Bash(git:*)
  - Bash(gh:*)
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
gh pr view --json baseRefName -q '.baseRefName' 2>/dev/null || \
  git rev-parse --abbrev-ref origin/HEAD 2>/dev/null | sed 's#origin/##' || echo 'main'
```

```bash
git diff <base-branch>...HEAD --stat
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

## 5. Address PR Review Comments

If there are review comments from GitHub Actions, reviewers, or automated tools:

- Address substantive findings
- Verify the finding is still valid (reviewers see old commits)
- Explain trade-offs if not implementing a suggestion

## 6. Verify

After changes, run the project's standard checks:

```bash
# Detect and run appropriate commands based on project type
# Node.js
[ -f package.json ] && npm run lint 2>/dev/null && npm run build 2>/dev/null

# Python
[ -f pyproject.toml ] && ruff check . 2>/dev/null || pylint **/*.py 2>/dev/null

# Go
[ -f go.mod ] && go build ./... 2>/dev/null && go vet ./... 2>/dev/null

# Rust
[ -f Cargo.toml ] && cargo check 2>/dev/null

# Or use project-specific commands if documented
```

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
- [ ] All tests pass
- [ ] Linting passes

---

$ARGUMENTS
