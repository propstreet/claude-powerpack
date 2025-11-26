# PR Description Examples

Examples of comprehensive vs incomplete PR descriptions.

## Good Example: Complete Coverage

This example shows a PR that properly documents multiple categories of changes:

```markdown
## Summary

Refactors UserService to eliminate 600 lines of duplication by extracting common
validation logic. Additionally includes critical bug fixes for session handling,
EF Core query optimization, and test infrastructure improvements.

## User Impact

**User Management:**
- More consistent validation behavior across all user operations
- Better error messages when validation fails

**Reliability:**
- Bug fix: Sessions no longer expire prematurely during long operations
- Bug fix: Race condition in concurrent user updates resolved

**Performance:**
- 40% faster user lookup queries through optimized includes

## Technical Notes

### 1. UserService Refactoring

Extracted common validation logic into `UserValidationService`:

- **Before**: 3 nearly-identical validation methods across `Create`, `Update`, `Import`
- **After**: Single `ValidateUser()` method with operation-specific extensions
- **Files**: `UserService.cs`, `UserValidationService.cs` (new)

### 2. Bug Fixes

**Session Expiration (Critical)**
- **Location**: `SessionManager.cs:125`
- **Problem**: Timeout calculated from session start, not last activity
- **Impact**: Users logged out during long form submissions
- **Fix**: Track last activity timestamp, reset on each request

**Concurrent Update Race Condition**
- **Location**: `UserRepository.cs:89`
- **Problem**: No optimistic concurrency on user updates
- **Impact**: Last write wins, potentially losing data
- **Fix**: Added `RowVersion` column with EF Core concurrency token

### 3. Query Optimization

- **Location**: `UserRepository.cs:45`
- **Problem**: N+1 query pattern when loading users with roles
- **Fix**: Added explicit `.Include(u => u.Roles)` with split query
- **Measured**: 40% reduction in query time for user list endpoint

### 4. Test Infrastructure

- New `UserTestFixture` base class for consistent test setup
- Extracted common assertions to `UserAssertions` helper
- Added integration test for concurrent update scenario

### 5. Configuration

- Added `SessionTimeoutMinutes` to `appsettings.json` (default: 30)
- New `ConcurrencyRetryCount` setting for optimistic concurrency retries

## Testing

```
Total: 127 tests
Passed: 127
Failed: 0
New tests: 8
```

- Unit tests for validation extraction
- Integration test for session timeout behavior
- Concurrency test for race condition fix

## Implementation Approach

1. **feat: extract user validation service** - Core refactoring work
2. **fix: session timeout calculation** - Critical bug fix
3. **fix: add optimistic concurrency to user updates** - Race condition fix
4. **perf: optimize user query includes** - Query performance
5. **test: add user service test fixtures** - Test infrastructure
6. **chore: add session configuration** - Configuration changes

---

Generated with [Claude Code](https://claude.com/claude-code)
```

### Why This Is Good

- Documents ALL commits, not just the main feature
- Bug fixes are prominently highlighted with impact
- Performance improvement is measured and documented
- Test coverage is quantified
- Configuration changes are noted
- Each section has specific file references

---

## Bad Example: Incomplete Coverage

This example shows what to avoid:

```markdown
## Summary

Refactors UserService to eliminate duplication.

## Technical Notes

- New base class
- Moved duplicate code
- Tests passing

## Testing

All tests pass.
```

### Why This Is Bad

- **Missing bug fixes**: The session and concurrency fixes aren't mentioned
- **No impact context**: Doesn't explain WHY the refactoring matters
- **Vague descriptions**: "Moved duplicate code" tells reviewers nothing
- **Missing commits**: Only describes 1 of 6 commits
- **No configuration changes**: Settings changes completely omitted
- **No performance details**: Query optimization not mentioned
- **No file references**: Reviewers don't know where to look

---

## Example: Feature with Multiple Side Effects

When a feature PR includes necessary side effects:

### Good

```markdown
## Summary

Adds export-to-CSV functionality for reports. Also fixes date formatting
inconsistency discovered during development and adds missing null checks
in the report generator.

## User Impact

**New Feature:**
- Users can now export any report to CSV format
- Supports all report types (daily, weekly, monthly)

**Bug Fixes:**
- Dates now display consistently in user's timezone across all reports
- Reports no longer fail when optional fields are null

## Technical Notes

### 1. CSV Export Feature
[Details of main feature]

### 2. Date Formatting Fix
- **Location**: `DateFormatter.cs:45`
- **Problem**: Some dates used UTC, others used local time
- **Fix**: Standardized on user's configured timezone

### 3. Null Safety
- **Location**: `ReportGenerator.cs:112, 156, 203`
- **Problem**: Null reference exceptions on optional fields
- **Fix**: Added null-conditional operators and default values
```

### Bad

```markdown
## Summary

Adds CSV export for reports.

## Changes

- Added ExportService
- Updated ReportController
- Fixed some bugs
```

The bad version:
- Hides important bug fixes under "Fixed some bugs"
- Doesn't explain the impact of the bugs that were fixed
- Reviewers might miss that this PR changes date behavior

---

## Example: Infrastructure-Heavy PR

When the main work is test/infrastructure improvements:

### Good

```markdown
## Summary

Overhauls test infrastructure to support parallel execution, reducing CI
time from 12 minutes to 4 minutes. Includes migration of 45 test classes
to new fixture pattern.

## User Impact

**Developer Experience:**
- CI feedback 3x faster
- Local test runs significantly quicker
- Tests now properly isolated (no more flaky failures)

## Technical Notes

### 1. Parallel Test Execution
- **Problem**: Tests ran sequentially due to shared database state
- **Solution**: New `IsolatedDatabaseFixture` creates per-test databases
- **Result**: Full parallelization across all CPU cores

### 2. Test Migration
- Migrated 45 test classes to new fixture pattern
- Removed hardcoded IDs that caused parallel conflicts
- Added scoped assertions that filter to test-created data

### 3. Performance Results
| Metric | Before | After |
|--------|--------|-------|
| CI Duration | 12:34 | 4:12 |
| Local (8 cores) | 8:45 | 1:23 |
| Flaky test rate | 12% | 0% |

## Testing

All 312 tests pass in parallel mode.
```

### Bad

```markdown
## Summary

Updated tests.

## Changes

- Changed test base class
- Updated 45 files
```

---

## Checklist for Complete Coverage

Before finalizing your PR description, verify:

- [ ] Every commit message is reflected in the description
- [ ] Bug fixes are prominently documented (not hidden)
- [ ] Performance improvements include measurements
- [ ] Configuration changes are listed
- [ ] Test coverage changes are quantified
- [ ] File paths are included for key changes
- [ ] User impact is clearly separated from technical details
- [ ] "Why" is explained, not just "what"
