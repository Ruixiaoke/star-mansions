## Summary

<!-- What does this PR do? One sentence. -->

## Related Issue

<!-- Link the GitHub Issue: Fixes #123 or Closes #123 -->

## Type

- [ ] `feat` — New feature
- [ ] `fix` — Bug fix
- [ ] `refactor` — Code restructuring (no behaviour change)
- [ ] `docs` — Documentation only
- [ ] `test` — New or updated tests
- [ ] `infra` — Infrastructure / DevOps
- [ ] `chore` — Maintenance

## Changes

<!-- Bullet list of what changed and why. -->

-

## Design Note

<!-- For non-trivial changes, link to the design note in docs/design-notes/ or summarise: -->
<!-- - Problem it solves -->
<!-- - Services affected -->
<!-- - Schema / API changes -->
<!-- - Risks -->
<!-- - Test plan -->

## Checklist

- [ ] All CI gates green — see [`docs/TESTING.md#ci-gates`](../docs/TESTING.md#ci-gates) for what each check protects
- [ ] Tests pass: `pytest tests/ -v`
- [ ] Linter clean: `ruff check backend/ scheduler/`
- [ ] Types check: `mypy backend/ scheduler/`
- [ ] Documentation updated (if applicable)
- [ ] No hardcoded secrets
- [ ] Bridge contract unchanged (or `RAY-MIGRATE-XXX` tag added)
- [ ] Tested locally with `docker compose up`

## Screenshots / Evidence

<!-- If UI changes, paste before/after screenshots. -->
<!-- If API changes, paste curl or httpie output. -->
