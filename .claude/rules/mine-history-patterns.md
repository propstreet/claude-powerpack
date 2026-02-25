---
paths:
  - "skills/mine-history/**"
---

# Pattern Authoring Rules for extract-learnings.js

## Subset analysis before adding patterns
When adding regex patterns to `CORRECTION_PATTERNS` or `NOISE_PATTERNS`, check whether the new pattern is a subset/superset of an existing one. Each match adds +1 to the score, so overlapping patterns silently inflate scores for certain phrases while leaving others unaffected.

## Delimiter consistency between arrays
The delimiter character class after `^no` (or any shared prefix) must be identical in both CORRECTION_PATTERNS and NOISE_PATTERNS. Any character present in one but missing from the other creates a gap where messages bypass the intended filter. Currently both use `[,.\s!]`.

## Robust word-boundary patterns
For correction openers that could appear with varied punctuation (`wait`, `hold on`, etc.), prefer `\b` word boundaries with expanded delimiter groups:
```
/^wait\b(?:[,:;.!?\s\u2014-]|$)/i
```
This covers colons, semicolons, em-dashes, question marks, and bare end-of-string while preventing partial-word matches (e.g., "waiting").
