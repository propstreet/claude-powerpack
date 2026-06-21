# pr-audit-angles — Examples

Concrete orchestration for the multi-angle audit. The script below uses the `Workflow` tool (deterministic fan-out with structured output). If your harness has no workflow primitive, the same shape works by dispatching one subagent per angle (the `Agent` tool) in parallel and merging their structured replies yourself.

## Structured schemas

Forcing each angle to return a schema (not prose) is what lets the orchestrator merge results mechanically and enforce evidence.

```js
const FINDING = {
  type: 'object', additionalProperties: false,
  required: ['location', 'severity', 'finding', 'correctPattern'],
  properties: {
    location:      { type: 'string', description: 'repo-relative file:line' },
    severity:      { type: 'string', enum: ['blocker', 'important', 'minor'] },
    finding:       { type: 'string', description: 'what is wrong, with concrete evidence' },
    correctPattern:{ type: 'string', description: 'the correct pattern + citation (doc section or exemplar file:line)' },
  },
}

const AUDIT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['findings', 'newConcepts', 'verifiedClean'],
  properties: {
    findings:    { type: 'array', items: FINDING },
    newConcepts: { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['concept', 'verdict', 'reasoning'],
      properties: {
        concept:   { type: 'string' },
        verdict:   { type: 'string', enum: ['justified', 'precedent-matching', 'should-reuse-existing', 'duplicate-of-existing'] },
        reasoning: { type: 'string', description: 'why; if should-reuse, name the existing pattern file:line' },
      } } },
    verifiedClean: { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['check', 'evidence'],
      properties: { check: { type: 'string' }, evidence: { type: 'string', description: 'one-line evidence with file:line' } } } },
  },
}
```

## The shared preamble + per-angle prompt (the 6 sections)

```js
const COMMON = `You are one angle of a multi-angle pre-merge audit of <PR/branch> in <repo path> (checked out).
Audit against <base>: use \`git diff <base>...HEAD -- <paths>\` to see what changed, but READ THE FULL CURRENT
FILES, not just the hunks. <one-paragraph description of what the PR does>.

INTENTIONAL DESIGN DECISIONS — do NOT flag these: <known-good choices that would otherwise generate false positives>.

HARD GUARDRAILS: read-only audit — do NOT edit files, do NOT run the full test suite. Every finding needs a
repo-relative file:line citation and a severity. "Looks good" without evidence is not acceptable — populate
verifiedClean with the specific hard-rule scans you ran and one-line evidence each. Your structured output is
machine-merged by an orchestrator; do not write prose outside the schema.`

const anglePrompt = COMMON + `

ANGLE: <name>.
1. REQUIRED READING FIRST: <2–4 docs/configs for this angle>.
2. IN-SCOPE FILES (read fully): <paths>.
3. COMPARISON ANCHORS: <2–3 exemplar files that show the established way>.
4. WHAT TO FLAG (checklist): <numbered list of this repo's hard rules for this angle>.
5. NEW CONCEPTS TO CHALLENGE: <name each new thing; demand justified / reuse-X / duplicate verdict>.
6. Cap to this angle; other agents cover the rest.`
```

## Orchestration (Workflow tool)

```js
export const meta = {
  name: 'pr-audit-angles',
  description: 'Multi-angle parallel audit',
  phases: [{ title: 'Audit', detail: 'parallel angle agents, uniform structured reports' }],
}

const ANGLES = [ /* { key, prompt } per picked angle */ ]

phase('Audit')
const results = await parallel(ANGLES.map(a => () =>
  agent(a.prompt, { label: 'audit:' + a.key, phase: 'Audit', schema: AUDIT_SCHEMA })
    .then(r => (r ? { angle: a.key, ...r } : null))
))
return results.filter(Boolean)
```

Then **the orchestrator (you), not the workflow,** verifies each candidate finding against current code before reporting it — see the synthesis rules in `SKILL.md`.

## Variant: verify-as-you-go (find → adversarially verify)

When you want findings pre-verified before they reach you, make verification a second stage so each finding is checked the moment its angle returns:

```js
const VERDICT = { type: 'object', additionalProperties: false,
  required: ['isReal', 'reachable', 'alreadyFixed', 'confidence', 'reasoning'],
  properties: {
    isReal:      { type: 'boolean' },
    reachable:   { type: 'boolean', description: 'can a real user/state hit it' },
    alreadyFixed:{ type: 'boolean', description: 'did a recent commit already close it' },
    confidence:  { type: 'string', enum: ['high', 'medium', 'low'] },
    reasoning:   { type: 'string', description: 'verified against actual code; cite file:line' },
  } }

const results = await pipeline(
  ANGLES,
  a => agent(a.prompt, { label: `audit:${a.key}`, phase: 'Audit', schema: AUDIT_SCHEMA }).then(r => ({ ...r, key: a.key })),
  audit => parallel((audit.findings || []).map(f => () =>
    agent(`Adversarially VERIFY this finding against CURRENT code. Be skeptical — default to "not real"
            unless you can prove it with file:line.\n\n${JSON.stringify(f)}`,
          { label: `verify:${audit.key}`, phase: 'Verify', schema: VERDICT })
      .then(v => ({ finding: f, verdict: v }))))
)
const confirmed = results.filter(Boolean).flatMap(r => r)
  .filter(x => x.verdict && x.verdict.isReal && x.verdict.reachable && !x.verdict.alreadyFixed)
```

Hand `confirmed` to **`pr-fix-angles`** to remediate.
