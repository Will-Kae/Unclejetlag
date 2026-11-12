# Public-site hardening release candidate

Base: main at 09568b856dfb074fe4e42080ad27e3f446d06b8e.
Production rollback reference observed on 12 November 2026:
dpl_62KVWoiSfUahWwtZYW1FLFb4xXf5.

This branch carries only package/lockfile updates and the research logout
helper, route and regression tests from the audited development branch.
Recent main content updates are preserved. No SQL, RPC, governance prototype,
fixture grants or editorial write controls are included.

The research workspace remains read-only. Approval, edit, import and
publication capabilities are not enabled by this release.
No database migration or service configuration change is required.

## Verification required on this branch

- npm ci --include=dev
- npm test
- npm run typecheck
- npm run build
- npm audit
- CI=1 npm run test:e2e -- --workers=1
- Confirm the preview deployment's exact commit, inspect its build result and
  test public pages, consent, protected anonymous routes and disabled writes.
- Confirm the production target is kachere-holdings / unclejetlag.
- Review the final diff before merging or promoting a tested production build.
- After release, check public routes, consent, protected-route denial and logs.

Previous local evidence from the governance branch does not replace validation
of this branch based on newer main. PR #21 remains separate and draft.
Do not run its SQL candidates as part of this release.

If a release fails, restore the recorded previous production deployment after
checking its current availability. Vercel rollback can alter automatic domain
assignment, so verify the production alias after rollback.

## Local regression checkpoint, 12 November 2026

User-supplied terminal output on the initial release branch reports:
431 unit tests passing, four intentional baseline-writer skips; typecheck
successful; 70/70 photos prepared; production build generated 445 pages;
npm audit zero findings; browser suite 106 passed, one skipped, two failed.

The two browser failures are reviewed fixture drift inherited from main.
Seven sitemap additions correspond exactly to three existing verified article
entries and four passport profiles gaining their first verified record.
The latter follow the existing scorePassport > 0 sitemap rule and
scorePassport === 0 noindex rule. docs/passport-audit-2026-11-12.md records the
four Saudi eVisa records already merged on main. This release does not alter
their claims or independently re-verify them.

The sitemap fixture now includes exactly those seven paths (219 to 226).
The noindex fixture removes exactly the four passport paths (189 to 185).
No assertions, route behavior, content, data or other baselines were changed.
Rerun e2e/routes.spec.ts to verify the fixture correction. Remaining browser
checks need not be repeated without further runtime changes.
Preview deployment verification and final release review remain pending.
