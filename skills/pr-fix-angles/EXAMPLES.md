# pr-fix-angles — Examples

Concrete orchestration for the disjoint-lane fix campaign. Uses the `Workflow` tool; the same shape works with manual parallel `Task` dispatch if your harness has no workflow primitive — the key invariants are *disjoint file ownership per lane* and *the orchestrator owns the gates*.

## The fix schema (per-lane structured output)

```js
const FIX_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['completed', 'deferred', 'testsRun', 'filesTouched', 'notes'],
  properties: {
    completed:    { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['finding', 'fix'], properties: { finding: { type: 'string' }, fix: { type: 'string', description: 'what changed, file:line' } } } },
    deferred:     { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['finding', 'reason'], properties: { finding: { type: 'string' }, reason: { type: 'string', description: 'incl. exact out-of-lane change needed' } } } },
    testsRun:     { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['command', 'result'], properties: { command: { type: 'string' }, result: { type: 'string', description: 'pass/fail + counts; on fail, the failing test names' } } } },
    filesTouched: { type: 'array', items: { type: 'string' } },
    notes:        { type: 'string', description: 'design decisions + contract changes other lanes/orchestrator must know' },
  },
}
```

## Lane prompts

Each lane = the shared `COMMON` preamble (the binding rules in `SKILL.md`) + a lane section:

```
LANE <X> — <theme>.
YOUR FILES (exclusive lock): <paths — no other lane may list these>.
FORBIDDEN: <files owned by other lanes; if a fix needs one, defer it>.
READ FIRST: <2–4 docs/configs + exemplar file:line for the pattern to follow>.

FIX 1 (<severity>) — <title>.
  RED:    <exact setup, exact failure to observe, fallback if not reproducible>.
  GREEN:  <fix direction; existing pattern/function to route through, file:line>.
  VERIFY: <narrow test command>. Report every test you added by name.
FIX 2 ...
```

## Orchestration — disjoint lanes, with one lane staged on a shared hot file

```js
export const meta = {
  name: 'pr-fix-angles',
  description: 'Parallel disjoint-lane fix campaign',
  phases: [{ title: 'Lane A' }, { title: 'Lane B' }, { title: 'Lane C' }],
}

// Lane A's findings all touch one hot file → run as sequential stages, threading results.
// Lanes B and C own disjoint files → run concurrently alongside A.
const [laneA, laneB, laneC] = await parallel([
  async () => {
    const a1 = await agent(A1_PROMPT, { label: 'fix:A1', phase: 'Lane A', schema: FIX_SCHEMA })
    const ctx = a1 ? `\n\nSTAGE-1 RESULT (already applied to the tree):\n${JSON.stringify({ completed: a1.completed, notes: a1.notes, filesTouched: a1.filesTouched })}` : '\n\nSTAGE-1 FAILED — inspect the tree yourself.'
    const a2 = await agent(A2_PROMPT + ctx, { label: 'fix:A2', phase: 'Lane A', schema: FIX_SCHEMA })
    return { a1, a2 }
  },
  () => agent(B_PROMPT, { label: 'fix:B', phase: 'Lane B', schema: FIX_SCHEMA }),
  () => agent(C_PROMPT, { label: 'fix:C', phase: 'Lane C', schema: FIX_SCHEMA }),
])

return { laneA, laneB: laneB ?? 'failed', laneC: laneC ?? 'failed' }
```

After this returns, **the orchestrator (you)** runs the repo's full lint → build → test, summarizes `completed`/`deferred` per lane, and stops. Do not commit or stage without an explicit request; when asked, stage explicit paths (never `git add -A`).

## Pre-step: verify candidate findings first (if not already verified)

```js
const VERDICT = { type: 'object', additionalProperties: false,
  required: ['isReal', 'reachable', 'alreadyFixed', 'confidence', 'reasoning', 'recommendedFix'],
  properties: {
    isReal:       { type: 'boolean' },
    reachable:    { type: 'boolean' },
    alreadyFixed: { type: 'boolean' },
    confidence:   { type: 'string', enum: ['high', 'medium', 'low'] },
    reasoning:    { type: 'string', description: 'cite file:line' },
    recommendedFix:{ type: 'string' },
  } }

const verified = await parallel(candidateFindings.map(f => () =>
  agent(`Adversarially VERIFY against current code. Default to "not real" unless proven with file:line.
          Check whether a recent commit already closed it.\n\n${JSON.stringify(f)}`,
        { label: 'verify', schema: VERDICT }).then(v => ({ f, v }))))
const toFix = verified.filter(Boolean).filter(x => x.v.isReal && x.v.reachable && !x.v.alreadyFixed).map(x => x.f)
// → partition toFix into disjoint lanes and run the campaign above.
```
