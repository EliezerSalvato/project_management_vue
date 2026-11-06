# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Plan/Checks)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Keep cross-field date rules (end not before start) active even when the dependent field itself was not edited
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `forms` · harmful: 0
- features: projects
- evidence: src/components/project/ProjectForm.vue:68 (forms)
- last seen: 2026-11-05T23:43:01Z

### L-002 - Enforce input limits in the page that reads the URL query, not only in the control that builds it
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `routes` · harmful: 0
- features: projects
- evidence: src/pages/project/Search.vue:20 (routes)
- last seen: 2026-11-05T23:43:02Z

### L-003 - Seed more items than the stated maximum when testing an up-to-N limit
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `tests` · harmful: 0
- features: projects
- evidence: C64 (tests)
- last seen: 2026-11-05T23:43:02Z

### L-004 - Read related element positions in one evaluate call and wait for requests to settle before counting them in Playwright tests
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: projects
- evidence: e2e/projects/infiniteScroll.spec.ts:63 (e2e)
- last seen: 2026-11-05T23:43:02Z

### L-005 - Assert a shared layout rule on every page it applies to, not only the first one built
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: projects
- evidence: C12 (e2e)
- last seen: 2026-11-05T23:43:02Z

### L-006 - Check the top edge of fixed bars against the capture after focusing an input, since focus can scroll the page
- signal: `gate_fail` · recurrence: 1 feature(s) · scope: `css` · harmful: 0
- features: projects
- evidence: C55 search-bar.running.png (css)
- last seen: 2026-11-05T23:43:02Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
