---
name: reviewing-code
description: >-
  Reviews code changes, runs linters and tests, and suggests fixes. Use when
  the user requests a PR review, CI checks, linting, or test runs. Triggers:
  review, code review, PR, lint, test, skill, .agent/skills
---

# Reviewing Code

## When to use this skill
- When the user asks for a code review or PR feedback
- When the user requests automated checks (lint, tests, build)

## Workflow
- Checklist (copyable):
  - [ ] Plan: identify PR/branch and scope
  - [ ] Validate: run `scripts/run-checks.sh` locally or in CI
  - [ ] Execute: provide review comments, suggested diffs, or follow-up tasks

### Plan → Validate → Execute
1. Plan: collect PR link, changed files, and testing matrix.
2. Validate: run `scripts/run-checks.sh` to execute lint, tests and build (non-blocking failures).
3. Execute: produce review summary, prioritized issues, and suggested fixes.

## Instructions
- Prefer short code suggestions and concrete commands the author can run.
- Use bullet points for heuristic guidance and code blocks for suggested snippets.
- For fragile operations (migration runs, destructive scripts), include exact bash commands and ask for explicit confirmation.
- If unsure how to run project tests, run `node scripts/run-checks.sh --help`.

## Resources
- scripts/run-checks.sh — runs lint/test/build heuristics
- examples/pr-review-checklist.md — PR review checklist to copy
- resources/README.md — quick usage notes

---

## Instructions for use
1. Copy this `SKILL.md` into `.agent/skills/reviewing-code/SKILL.md`.
2. Run `node ../creating-antigravity-skills/scripts/validate-skill.js .` to validate.
3. Run `scripts/run-checks.sh` in the repository root to gather automated results.

### Suggested next step
Would you like me to run the validator on this skill now and/or open a PR with these files? 
