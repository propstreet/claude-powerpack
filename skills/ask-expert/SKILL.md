---
name: ask-expert
description: Creates expert consultation documents with code extraction, git diffs, and size tracking (125KB limit). Use when user asks to "create an expert consultation document", "prepare code for expert review", "gather architecture context", or needs comprehensive technical documentation for external analysis. Requires Node.js 18+.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash(git:*)
  - Bash(node:*)
  - Bash(cat:*)
  - Bash(wc:*)
  - Bash(ls:*)
user-invocable: true
context: fork
---

# Expert Consultation Document Creator

Create comprehensive technical consultation documents by extracting code, diffs, and architectural context within LLM token limits (125KB).

## Document Structure

### Part 1: Problem Context (~15-25 KB)
1. **Problem** — Issue, errors, test failures
2. **Our Solution** — What was implemented and why
3. **Concerns** — Code smells, coupling, architectural questions
4. **Alternatives** — Other approaches, trade-offs

### Part 2: Complete Architecture (~60-90 KB)
5. **Architecture Overview** — ASCII diagram, data flow, patterns
6. **Components** — Frontend, tests, controllers
7. **Services** — Implementation and interfaces
8. **Models** — Domain entities with relationships

### Part 3: Expert Request (~5-10 KB)
9. **Questions** — Specific technical questions
10. **Success Criteria** — Requirements and priorities

## Workflow

### Step 1: Write Problem Context

Create a descriptive file like `{topic}-consultation.md` with the problem context, your solution, concerns, alternatives, and an architecture overview.

### Step 2: Extract Code

Use the bundled extraction script with size tracking. The script accepts multiple files in one call — batch for efficiency.

```bash
node scripts/extract-code.js \
  --track-size --output=doc.md \
  --section="Core Files" \
  file1.ts file2.ts file3.ts \
  --section="Tests" \
  test1.ts test2.ts
```

**File format options:**
- Full file: `src/Service.cs`
- Line ranges: `src/Service.cs:100-200` or `src/Service.cs:1-30,100-150`
- Git diff (per-file): `src/Service.cs:diff` or `src/Service.cs:diff=master..HEAD`

**Git diff options (all changes):**
- Staged changes: `--staged`
- Commit changes: `--commit=abc123` or `--commit=HEAD~1`

**Prefer FULL files over chunks** for better expert analysis. Use chunks only for very large files.

### Step 3: Add Expert Request

Append the specific questions and success criteria to the document.

### Step 4: Verify Size

Check the file size — it should be 100-125 KB. DO NOT read the full file back (exceeds context).

## Code Extraction Examples

See [EXAMPLES.md](EXAMPLES.md) for detailed usage patterns.

**With sections:**
```bash
node scripts/extract-code.js \
  --track-size --output=doc.md \
  --section="What Changed" \
  src/Service.cs:diff \
  --section="Implementation" \
  src/Service.cs src/Model.cs
```

**Using config file:**
```bash
node scripts/extract-code.js \
  --config=extraction-plan.json
```

**Staged or commit changes:**
```bash
node scripts/extract-code.js \
  --staged --track-size --output=doc.md

node scripts/extract-code.js \
  --commit=abc123 --track-size --output=doc.md
```

## Config File Format

```json
{
  "output": "consultation.md",
  "trackSize": true,
  "sections": [
    {
      "header": "What Changed",
      "files": ["src/Service.cs:diff"]
    },
    {
      "header": "Core Implementation",
      "files": ["src/Service.cs", "src/Model.cs"]
    }
  ]
}
```

## Code Inclusion Priority

**Must include:**
- Core interfaces/abstractions
- Modified/bug-fix code
- Domain models
- Key service methods
- Test examples

**Skip if tight on space:**
- Boilerplate
- Simple DTOs
- Repetitive test setups

## Gotchas

- The 125KB limit is enforced by the extraction script — it warns at 100KB and 115KB, then exits at 125KB
- Always use `--track-size` to stay within the limit
- Don't read the completed document back into context — it's too large
- The script appends to existing files, so you can build incrementally
- Shell constructs like `$()` and variable assignments in Bash calls can trigger permission prompts. Prefer simple, single-command calls when possible.
