---
name: deep-interview
description: Start a structured interview to gather requirements for complex features. Use when tackling multi-layer features, validating PRDs, or defining scope for implementation.
argument-hint: "<issue-number|prd-path|feature-description>"
user-invocable: true
allowed-tools:
  # Git: read-only operations
  - Bash(git log:*)
  - Bash(git diff:*)
  - Bash(git status)
  - Bash(git show:*)
  # GitHub CLI: read-only operations
  - Bash(gh issue view:*)
  - Bash(gh issue list:*)
  - Bash(gh pr view:*)
  # File operations
  - Read
  - Glob
  - Grep
  - AskUserQuestion
  - Write
  - Task
---

# Deep Interview

A structured interview process for gathering requirements and making design decisions on complex features.

## When to Use This Skill

- Complex features with multiple valid approaches
- Features affecting multiple layers (backend, frontend, data model)
- When prior investigation exists that needs stakeholder validation
- When "quick win" scope needs definition

## Input

`$ARGUMENTS` can be:

| Format              | Example                            | Description                    |
| ------------------- | ---------------------------------- | ------------------------------ |
| Issue number        | `#531` or `531`                    | GitHub issue to research first |
| PRD path            | `docs/feature-spec.md`             | Existing PRD to validate       |
| Feature description | `"user authentication flow"`       | Free-form description          |
| Nothing             | (empty)                            | Ask what we're planning        |

---

## Interview Process

### Phase 1: Context Gathering (Before Questions)

**Do this silently before asking any questions:**

1. **If issue number provided** (strip `#` prefix if present):

   ```bash
   # User may pass "#531" or "531" - strip the # if present
   gh issue view 531 --comments
   ```

2. **Search for related documentation** using Glob and Grep tools:

   ```
   # Use Glob to find markdown files
   Glob: **/*.md

   # Use Grep to search for keywords in those files
   Grep: pattern="<keywords>" glob="*.md"
   ```

3. **Explore current implementation:**
   - Use Task tool with `subagent_type: Explore` to find relevant code
   - Identify existing patterns that could be reused
   - Note gaps between documented plans and current state

4. **Summarize findings** to the user before starting questions:
   > "I've reviewed [issue/PRD/code]. Here's what I found:
   >
   > - Current state: [summary]
   > - Planned state: [from docs]
   > - Key gaps: [what's missing]
   >
   > Let me ask some questions to clarify the approach..."

---

### Phase 2: Scope Definition

**First question - establish boundaries:**

```
Question: "What does [goal] mean to you? What's your target scope?"
Header: "Scope"
Options:
  - Minimal: [simplest version, automatic, no new UI]
  - Medium: [adds user interaction after completion]
  - Full: [mid-process interaction, complete workflow]
  - Other: (always available)
```

**Key:** Options should represent increasing complexity, not different features.

---

### Phase 3: Approach Selection

**Second question - choose implementation strategy:**

```
Question: "Which approach do you prefer for [main mechanism]?"
Header: "Approach"
Options:
  - Option A: [simpler, faster to build]
  - Option B (Recommended): [better UX, more robust]
  - Hybrid: [combine best of both]
```

**Listen for:** If stakeholder suggests something different ("we could do X because Y already exists"), probe deeper - they have context about existing patterns.

---

### Phase 4: Priority Ranking

**Third question - identify most valuable improvements:**

```
Question: "What's the most valuable improvement for users right now?"
Header: "Priority"
multiSelect: true  // Features may be complementary
Options:
  - [Capability A]: [benefit description]
  - [Capability B]: [benefit description]
  - [Capability C]: [benefit description]
```

---

### Phase 5: Implementation Details

**Fourth question set - drill into specifics for each selected priority:**

Ask about:

1. **Context/data flow:**

   ```
   Question: "What context should carry over to [feature]?"
   Options:
     - Full context: [everything persists]
     - Minimal: [only essential data]
     - Session-based: [reuse existing patterns]
   ```

2. **UI/UX pattern:**

   ```
   Question: "How should users interact with [feature]?"
   Options:
     - Simple button: [one-click action]
     - Preset options: [predefined choices]
     - Smart suggestions: [dynamic options]
   ```

3. **Behavior on triggers:**
   ```
   Question: "When [event] happens, what should [system] do?"
   Options:
     - [Behavior A]
     - [Behavior B]
     - [Behavior C]
   ```

---

### Phase 6: Technical Decisions

**Fifth question set - architectural choices:**

```
Question: "For [technical mechanism], should we [A] or [B]?"
Header: "Technical"
Options:
  - New implementation: [simpler, isolated]
  - Reuse existing: [patterns exist in codebase]
  - Hybrid: [new feature, existing infrastructure]
```

**Listen for:** "We could reuse X" - stakeholder knows about existing infrastructure you should leverage.

---

### Phase 7: Timeline & Scope Confirmation

**Final questions:**

```
Question: "What's your timeline expectation?"
Header: "Timeline"
Options:
  - Quick win (1-2 days): [core functionality only]
  - Full feature (3-4 days): [complete implementation]
  - Polish (1 week+): [edge cases, optimization]
```

```
Question: "Any specific ideas or concerns I should include in the plan?"
Header: "Ideas"
Options:
  - Nothing else: [proceed with plan]
  - I have more ideas: [capture additional input]
```

---

## Output: PRD Generation

After completing the interview, generate a PRD with this structure:

```markdown
# [Feature Name] PRD

## Executive Summary

[1-2 paragraphs: what we're building and why]

## Design Decisions

| Decision           | Choice     | Rationale |
| ------------------ | ---------- | --------- |
| Scope              | [Selected] | [Why]     |
| Approach           | [Selected] | [Why]     |
| [Technical choice] | [Selected] | [Why]     |

## Architecture Overview

### Current State

[Describe what exists today]

### Target State

[Describe end state after implementation]

## Data Model Changes

### New Entities

- [Entity]: [fields, relationships]

### Modified Entities

- [Entity]: [changes]

## API Changes

### New Endpoints

- `POST /api/[endpoint]` - [description]

### Modified Endpoints

- `PUT /api/[endpoint]` - [changes]

## Frontend Changes

### New Components

- [Component]: [purpose]

### Modified Components

- [Component]: [changes]

## Implementation Checklist

### Phase 1: Foundation

- [ ] [Task 1]
- [ ] [Task 2]

### Phase 2: Core Feature

- [ ] [Task 3]
- [ ] [Task 4]

### Phase 3: Polish

- [ ] [Task 5]
- [ ] [Task 6]

## Rollback Plan

[How to disable if issues arise - feature flag, revert steps]

## Open Questions

[Any unresolved items for future discussion]
```

Save the PRD to an appropriate location (e.g., `docs/prd-[feature-name].md` or as specified by the user).

---

## Best Practices

### Do:

- Start broad (scope), then narrow (details)
- Present tradeoffs, not just options
- Mark recommended options with "(Recommended)"
- Probe when stakeholder mentions existing patterns
- Summarize decisions before moving to next phase
- Use `multiSelect: true` when options aren't mutually exclusive

### Don't:

- Ask about timeline first (understand scope first)
- Present more than 4 options per question
- Ask multiple questions about the same decision
- Skip the exploration phase
- Assume you know the right answer

---

## Example Flow

**Input:** `/deep-interview #531`

1. **Context:** Read issue #531, find related docs, explore existing code
2. **Scope:** "What does 'quick win' mean?" → Medium scope
3. **Approach:** "Which approach?" → Hybrid (auto + manual options)
4. **Priority:** "Most valuable?" → User feedback + Automation
5. **Details:** "What carries over?" → Session context reuse
6. **Technical:** "New or reuse?" → Reuse existing patterns
7. **Timeline:** → 1 week with polish
8. **Output:** PRD with implementation checklist, decision log

---

$ARGUMENTS
