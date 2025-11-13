# Expert Consultation Examples

Complete usage examples for the ask-expert skill.

## Complete Workflow Examples

### Example 1: Bug Investigation

**Scenario**: JWT refresh token causing unexpected logouts

```bash
# 1. Create consultation document
cat > auth-bug-consultation.md << 'EOF'
# Expert Consultation: JWT Refresh Token Bug

## 1. Problem
Users are getting logged out unexpectedly after 15 minutes despite having valid refresh tokens.

## 2. Our Solution
Modified the token refresh logic in AuthService to use a sliding window approach instead of fixed expiration.

## 3. Concerns
- This couples authentication to session management
- Might introduce race conditions with concurrent requests
- Token refresh happens in middleware which feels wrong

## 4. Alternatives
- Separate auth service with dedicated refresh endpoint
- Use Redis for session management
- Switch to stateless JWTs

## 5. Architecture Overview
```
┌─────────┐     ┌──────────────┐     ┌───────────┐
│ Client  │────▶│  Middleware  │────▶│  Auth     │
│         │◀────│  (Refresh)   │◀────│  Service  │
└─────────┘     └──────────────┘     └───────────┘
                       │
                       ▼
                 ┌──────────┐
                 │  Token   │
                 │  Manager │
                 └──────────┘
```

---
# Complete Architecture Context
EOF

# 2. Extract code with size tracking
node scripts/extract-code.js \
  --track-size --output=auth-bug-consultation.md \
  --section="What Changed" \
  src/auth/AuthService.cs:diff \
  --section="Auth Flow (COMPLETE)" \
  src/auth/AuthController.cs \
  src/auth/TokenManager.cs \
  --section="Middleware" \
  src/middleware/AuthMiddleware.cs \
  --section="Tests" \
  tests/auth/AuthFlowShould.cs:1-150

# 3. Add expert questions
cat >> auth-bug-consultation.md << 'EOF'

---
# Expert Guidance Request

## Questions
1. Does our sliding window approach introduce security risks?
2. Better patterns for handling token refresh in middleware?
3. How to test race conditions effectively?
4. Should authentication and session management be separate concerns?

## Success Criteria
- Backward compatible with mobile clients
- No data loss during token refresh
- Clear security model
- Testable solution

**Please answer in English**
EOF

# 4. Verify size
wc -c auth-bug-consultation.md
```

### Example 2: API Redesign

**Scenario**: Need expert review of new REST API design

```bash
# Use config file for complex extraction
cat > api-redesign-plan.json << 'EOF'
{
  "output": "api-redesign-consultation.md",
  "trackSize": true,
  "sections": [
    {
      "header": "Current API Design",
      "files": [
        "src/controllers/ApiController.cs",
        "src/models/ApiRequest.cs",
        "src/models/ApiResponse.cs"
      ]
    },
    {
      "header": "Service Layer",
      "files": [
        "src/services/ApiService.cs:1-200",
        "src/services/ApiService.Validation.cs"
      ]
    },
    {
      "header": "Test Coverage",
      "files": [
        "tests/ApiControllerShould.cs:100-300"
      ]
    }
  ]
}
EOF

node scripts/extract-code.js \
  --config=api-redesign-plan.json
```

### Example 3: Architecture Review

**Scenario**: TypeScript strict mode migration

```bash
# 1. Write problem context
cat > typescript-strict-consultation.md << 'EOF'
# Expert Consultation: TypeScript Strict Mode Migration

## 1. Problem
Legacy codebase has `strict: false` in tsconfig.json. Need to enable strict mode without breaking production.

## 2. Our Solution
Incremental migration by file, starting with new code and migrating old files gradually.

## 3. Concerns
- 500+ files to migrate
- Some patterns don't work well with strict mode (dynamic property access)
- Team unfamiliar with strict mode patterns

## 4. Alternatives
- Big bang migration with dedicated sprint
- Stay on non-strict mode indefinitely
- Use strict mode only for new files

## 5. Architecture Overview
[Diagram showing file dependency graph]

---
# Complete Architecture Context
EOF

# 2. Batch extract multiple files efficiently
node scripts/extract-code.js \
  --track-size --output=typescript-strict-consultation.md \
  --section="Type Definitions" \
  src/types/payloads.ts src/types/responses.ts \
  --section="Core Files (COMPLETE)" \
  src/handlers/base-handler.ts \
  src/handlers/intents.ts \
  --section="Config" \
  tsconfig.json \
  --section="Example Migrated Files" \
  src/services/user.ts src/services/auth.ts

# 3. Add questions
cat >> typescript-strict-consultation.md << 'EOF'

---
# Expert Guidance Request

## Questions
1. Recommended migration order for 500+ files?
2. Common patterns that break in strict mode and their fixes?
3. Tooling to automate parts of the migration?
4. Testing strategy during migration?

## Success Criteria
- Zero runtime regressions
- Team can maintain strict mode going forward
- Migration completable in 2-3 sprints

**Please answer in English**
EOF
```

## Extract-Code Script Usage

### Basic Patterns

**Extract full files:**
```bash
node scripts/extract-code.js \
  src/Service.cs tests/ServiceTests.cs
```

**Extract line ranges:**
```bash
node scripts/extract-code.js \
  src/Service.cs:100-200 tests/ServiceTests.cs:50-75
```

**Multiple ranges from one file:**
```bash
node scripts/extract-code.js \
  src/Service.cs:1-30,86-213,500-600
```

**Mix full files and ranges:**
```bash
node scripts/extract-code.js \
  src/Models/User.cs src/Service.cs:100-150
```

### Git Diff Patterns

**Diff vs master (default):**
```bash
node scripts/extract-code.js \
  src/Service.cs:diff
```

**Explicit diff range:**
```bash
node scripts/extract-code.js \
  src/Service.cs:diff=master..feature-branch \
  src/Helper.cs:diff=HEAD~3..HEAD
```

**Recent changes:**
```bash
node scripts/extract-code.js \
  src/Service.cs:diff=HEAD~5
```

**Combine diffs with regular files:**
```bash
node scripts/extract-code.js \
  src/Service.cs:diff \
  src/Tests.cs:100-200 \
  src/Models.cs
```

### Size Tracking Patterns

**Basic size tracking:**
```bash
node scripts/extract-code.js \
  --track-size --output=consultation.md \
  src/Service.cs
```

**With sections:**
```bash
node scripts/extract-code.js \
  --track-size --output=doc.md \
  --section="Core Interfaces" \
  Interface.cs BaseClass.cs \
  --section="Domain Models" \
  Contact.cs Company.cs \
  --section="Tests" \
  Tests.cs:100-200
```

**Incremental building (appends each time):**
```bash
node scripts/extract-code.js \
  --track-size -o doc.md File1.cs

node scripts/extract-code.js \
  --track-size -o doc.md File2.cs  # Appends

node scripts/extract-code.js \
  --track-size -o doc.md File3.cs  # Appends again
```

### Config File Patterns

**Simple config:**
```json
{
  "output": "consultation.md",
  "trackSize": true,
  "sections": [
    {
      "header": "Core Implementation",
      "files": ["src/Service.cs", "src/Model.cs"]
    }
  ]
}
```

**Complex config with diffs:**
```json
{
  "output": "feature-consultation.md",
  "trackSize": true,
  "sections": [
    {
      "header": "What We Changed",
      "files": [
        "src/Service.cs:diff",
        "src/Helper.cs:diff=master..feature-branch"
      ]
    },
    {
      "header": "Frontend Component (COMPLETE)",
      "files": ["src/components/MyComponent.vue"]
    },
    {
      "header": "Component Tests (COMPLETE)",
      "files": ["tests/components/MyComponent.test.ts"]
    },
    {
      "header": "Core Interfaces",
      "files": ["src/interfaces/IMyService.cs"]
    },
    {
      "header": "Domain Models",
      "files": [
        "src/models/MyModel.cs",
        "src/models/RelatedModel.cs"
      ]
    },
    {
      "header": "Service Implementation (Relevant Methods)",
      "files": ["src/services/MyService.cs:100-500"]
    }
  ]
}
```

**Run config:**
```bash
node scripts/extract-code.js \
  --config=extraction-plan.json
```

## Size Tracking Output

The script shows real-time progress:

```
📄 consultation.md: 4.9 KB (existing)
[1/8] NetworkIndex.vue → +25.5 KB (30.4 KB / 125 KB, 24.3%)
[2/8] NetworkIndex.test.ts → +14.0 KB (44.4 KB / 125 KB, 35.5%)
[3/8] NetworkController.cs → +12.3 KB (56.7 KB / 125 KB, 45.4%)
[4/8] INetworkService.cs → +3.2 KB (59.9 KB / 125 KB, 47.9%)
[5/8] Contact.cs → +8.1 KB (68.0 KB / 125 KB, 54.4%)
[6/8] Company.cs → +7.4 KB (75.4 KB / 125 KB, 60.3%)
[7/8] NetworkService.cs → +9.2 KB (84.6 KB / 125 KB, 67.7%)
[8/8] Tests.cs → +2.7 KB (87.3 KB / 125 KB, 69.8%)
✅ Saved: 8 files to consultation.md (87.3 KB / 125 KB)
```

**Warnings at thresholds:**
```
⚠️  Approaching 100 KB    (at 100 KB)
⚠️  Very close to limit!  (at 115 KB)
❌ Exceeded 125 KB limit  (stops processing)
```

## Traditional Redirection

You can also use traditional shell redirection:

```bash
node scripts/extract-code.js \
  src/Service.cs > expert-consultation.md

node scripts/extract-code.js \
  src/Tests.cs >> expert-consultation.md  # Append
```

**Note**: Without `--track-size`, you won't see progress or warnings.

## Tips for Efficiency

1. **Batch files together** - One call is better than many
2. **Use config files** for complex extractions you'll repeat
3. **Use full files** when possible - better context for expert
4. **Use diffs** to show "what changed" concisely
5. **Track size** to avoid hitting 125 KB limit
6. **Verify early** - run `wc -c` to check size before adding more
