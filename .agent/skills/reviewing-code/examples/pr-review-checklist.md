# PR Review Checklist

- [ ] Confirm PR description explains the why and what
- [ ] Run `scripts/run-checks.sh` and include output in review
- [ ] Verify unit and integration tests cover key changes
- [ ] Check for accessibility and basic UX regressions
- [ ] Ensure database migrations (if any) are backward-compatible
- [ ] Suggest minimal, focused change requests with concrete code snippets
- [ ] Recommend follow-up tasks for larger refactors

## Suggested PR comment template
> Summary: [short summary]
> Automated checks: [paste `run-checks.sh` output]
> Risks: [list]
> Suggested fixes: [code block or file/line references]
