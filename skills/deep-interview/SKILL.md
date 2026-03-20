---
name: deep-interview
description: Start a structured interview to gather requirements for complex features. Use when tackling multi-layer features, validating PRDs, or defining scope for implementation.
argument-hint: "<issue-number|prd-path|feature-description>"
user-invocable: true
allowed-tools:
  - Bash(git:*)
  - Bash(gh:*)
  - Read
  - Glob
  - Grep
  - AskUserQuestion
  - Write
  - Agent
---

# Deep Interview

A structured interview process for gathering requirements and making design decisions on complex features.

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

Silently research the topic before asking any questions:

1. If an issue number is provided, read the issue and its comments
2. Search for related documentation and existing code
3. Identify existing patterns that could be reused, and gaps between planned and current state

Summarize findings to the user before starting questions:
> "I've reviewed [issue/PRD/code]. Here's what I found: [current state, planned state, key gaps]. Let me ask some questions to clarify the approach..."

---

### Phase 2: Scope Definition

**First question — establish boundaries:**

```
Question: "What does [goal] mean to you? What's your target scope?"
Header: "Scope"
Options:
  - Minimal: [simplest version, automatic, no new UI]
  - Medium: [adds user interaction after completion]
  - Full: [mid-process interaction, complete workflow]
  - Other: (always available)
```

Options should represent increasing complexity, not different features.

---

### Phase 3: Approach Selection

**Second question — choose implementation strategy:**

```
Question: "Which approach do you prefer for [main mechanism]?"
Header: "Approach"
Options:
  - Option A: [simpler, faster to build]
  - Option B (Recommended): [better UX, more robust]
  - Hybrid: [combine best of both]
```

**Listen for:** If stakeholder suggests something different ("we could do X because Y already exists"), probe deeper — they have context about existing patterns.

---

### Phase 4: Priority Ranking

**Third question — identify most valuable improvements:**

```
Question: "What's the most valuable improvement for users right now?"
Header: "Priority"
multiSelect: true
Options:
  - [Capability A]: [benefit description]
  - [Capability B]: [benefit description]
  - [Capability C]: [benefit description]
```

---

### Phase 5: Implementation Details

Drill into specifics for each selected priority. Ask about context/data flow, UI/UX patterns, and behavior on triggers — adapting questions to the feature at hand.

---

### Phase 6: Technical Decisions

Architectural choices — new implementation vs reusing existing patterns, and why.

**Listen for:** "We could reuse X" — stakeholder knows about existing infrastructure you should leverage.

---

### Phase 7: Timeline & Scope Confirmation

Final questions: timeline expectation (quick win / full feature / polish) and any additional ideas or concerns.

---

## Output: PRD Generation

After completing the interview, generate a PRD covering:

- **Executive Summary** — what we're building and why
- **Design Decisions** — table of each decision, choice, and rationale
- **Architecture Overview** — current state and target state
- **Data Model Changes** — new and modified entities
- **API Changes** — new and modified endpoints
- **Frontend Changes** — new and modified components
- **Implementation Checklist** — phased tasks (foundation, core feature, polish)
- **Rollback Plan** — how to disable if issues arise
- **Open Questions** — unresolved items

Save the PRD to an appropriate location (e.g., `prds/[date]-[feature-name].md` or as specified).

---

## Gotchas

- Start broad (scope), then narrow (details) — never ask about timeline first
- Present tradeoffs, not just options. Mark recommended options with "(Recommended)"
- Don't present more than 4 options per question
- Probe when stakeholder mentions existing patterns — they have context you don't
- Summarize decisions before moving to next phase
- Use `multiSelect: true` when options aren't mutually exclusive

---

$ARGUMENTS
