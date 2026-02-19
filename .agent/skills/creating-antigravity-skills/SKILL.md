---
name: creating-antigravity-skills
description: 
  Produces Antigravity-compatible skills for creating, validating and templating
  `.agent/skills/` entries. Use when the user asks to generate or validate a
  skill, requests a SKILL.md template, or mentions "skill", "antigravity",
  "SKILL.md" or ".agent/skills". Includes validation checklist and helper
  scripts.
---

# Antigravity Skill Creator

## When to use this skill
- User asks to create or update a skill under `.agent/skills/`
- User requests a `SKILL.md` template, example, or validation check
- Triggers/keywords: `skill`, `antigravity`, `SKILL.md`, `skill template`, `.agent/skills`

## Workflow
- Checklist (copyable):
  - [ ] Plan: confirm task & target skill name
  - [ ] Validate: run `scripts/validate-skill.js` on the draft `SKILL.md`
  - [ ] Execute: write files under `.agent/skills/[skill-name]/`
  - [ ] Test: run validation and example usage

### Plan → Validate → Execute
1. Plan: decide skill name, description, and example files.
2. Validate: run the validator (`node scripts/validate-skill.js PATH`) before creating files.
3. Execute: create `SKILL.md` + optional `scripts/`, `examples/`, `resources/`.

## Instructions (rules & templates)
- Core structure (required):
  - `SKILL.md` (required)
  - optional `scripts/`, `examples/`, `resources/`
  - Use `/` in paths (never `\\`).
- YAML frontmatter (strict):
  - `name`: gerund form (e.g. `testing-code`, `managing-databases`), max 64 chars,
    lowercase, numbers and hyphens only. Must contain at least one `-ing` segment.
    Do **not** include `claude` or `anthropic` in the name.
  - `description`: third-person; include explicit triggers/keywords; max 1024 chars.
- Writing principles (concise):
  - Keep `SKILL.md` focused and <= 500 lines.
  - Use bullet points for high‑freedom guidance, code blocks for templates,
    and exact bash commands for fragile operations.
- Feedback & error handling:
  - Provide a checklist and a Plan-Validate-Execute loop.
  - Include a validator script as a black-box: run `--help` if unsure.

## Resources
- Validator: `scripts/validate-skill.js`
- Example: `examples/guarding-deployments/SKILL.md`

---

## Instructions for use
1. **Copy** this `SKILL.md` into `.agent/skills/creating-antigravity-skills/SKILL.md`.
2. **Validate** with `node .agent/skills/creating-antigravity-skills/scripts/validate-skill.js .agent/skills/creating-antigravity-skills/SKILL.md`.
3. **Create** new skills by following the checklist and template below.

### Output template (use when asked to create a skill)
```markdown
---
name: [gerund-name]
description: [3rd-person description with triggers/keywords]
---

# [Skill Title]

## When to use this skill
- [Trigger 1]
- [Trigger 2]

## Workflow
- [ ] Plan
- [ ] Validate
- [ ] Execute

## Instructions
- [Specific logic, code snippets, or rules]

## Resources
- [Link to scripts/ or resources/]
```

---

## Suggested next step
Would you like me to generate a concrete skill now (for example: `guarding-deployments` or `reviewing-code`)?
