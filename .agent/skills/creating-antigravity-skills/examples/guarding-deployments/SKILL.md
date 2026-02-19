---
name: guarding-deployments
description: >-
  Provides checks and a deployment-gate checklist. Use when the user requests
  deployment safety checks, CI gating, or rollout validation. Triggers: deploy,
  deployment, rollout, deployment-check.
---

# Guarding Deployments

## When to use this skill
- Before production deploys
- When the user asks for a deployment gate or rollout checklist

## Workflow
- [ ] Plan: identify targets and rollback procedure
- [ ] Validate: run pre-deploy checks and automated tests
- [ ] Execute: run gated deployment and monitor

## Instructions
- Add `examples/` with sample commands and expected outputs.
- Include automated smoke tests under `scripts/` and reference them here.

## Resources
- Example script: `scripts/smoke-check.sh` (place under skill `scripts/`)
