# Debrief Skill: Examples

## Good Debrief Output

After a session where the user debugged a flaky test and discovered an undocumented API behavior:

```markdown
## Session Debrief: Proposed Updates

### 1. CLAUDE.md (142 → 144 lines)
- **Add to Common Mistakes**: "Integration tests require `TEST_DB_URL` — run `docker compose up -d test-db` first"
- **Add to Architecture**: "Order service uses eventual consistency — don't assert state immediately after writes"

### 2. .claude/rules/testing.md (new file, path-scoped)
---
paths:
  - "tests/**/*.ts"
  - "src/**/*.test.ts"
---

- Flaky test root cause: `waitForEvent()` has a default 5s timeout that's too short for CI. Use `waitForEvent({ timeout: 15000 })` in integration tests.
- Test database is reset between suites but NOT between individual tests — use `beforeEach` for isolation.

### 3. Skipped
- "Had to restart Docker twice" — session-specific, not generalizable
- "TypeScript version is 5.3" — already in package.json, no need to document
```

## Bad Debrief Output (Avoid)

```markdown
## Session Debrief

### CLAUDE.md additions:
- We use TypeScript for this project (OBVIOUS — already implied by tsconfig.json)
- Always write clean code (VAGUE — not actionable)
- The order service is in src/services/order.ts (LOW VALUE — Claude can find files)
- Today we fixed bug #1234 where the test was failing because the database
  container wasn't running and we had to restart Docker and then we found that
  the timeout was too short... (TOO VERBOSE — this is a session log, not a learning)
- Consider using vitest instead of jest (SPECULATIVE — unverified preference)
```

## Progressive Disclosure Example

Instead of adding 10 lines to CLAUDE.md about API conventions:

**CLAUDE.md** (1 line):
```
- API conventions: see @.claude/rules/api-conventions.md
```

**.claude/rules/api-conventions.md** (detailed, path-scoped):
```yaml
---
paths:
  - "src/api/**/*.ts"
---
```
```markdown
# API Conventions

- All handlers validate input with zod before processing
- Use `ApiError.from(err)` for consistent error responses — never throw raw errors
- Rate limiting is middleware-level, don't implement per-handler
- Auth header required even for "public" endpoints (passes through user context if available)
```

## Routing Decision Guide

| Learning | Where it goes | Why |
|----------|--------------|-----|
| "Always use pnpm, not npm" | CLAUDE.md | Universal, prevents real mistakes |
| "Zod schemas required for API input" | .claude/rules/api.md (path-scoped) | Domain-specific to API files |
| "Run migrations after pulling" | CLAUDE.md (common mistakes) | Universal, high-frequency mistake |
| "CORS errors mean missing proxy config" | .claude/rules/debugging.md | Domain knowledge, not a daily rule |
| "We chose Postgres over MongoDB for X" | ARCHITECTURE.md | Architectural decision record |
| "PR descriptions must include test plan" | CONTRIBUTING.md | Process for human contributors |
