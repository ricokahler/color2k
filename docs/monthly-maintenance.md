# color2k monthly maintenance

This is a maintenance prompt/checklist for a monthly Codex pass. It is
intentionally report-first. Do not merge, publish, or rotate credentials without
explicit maintainer approval.

## Checklist

1. Fetch the latest `main`.
2. Run `npm ci`.
3. Run `npm outdated`.
4. Run `npm audit`.
5. Run `npm audit --omit=dev`.
6. Review open Renovate or dependency PRs.
7. Inspect GitHub Actions failures and security alerts.
8. Run:

```sh
npm run check
```

9. Inspect `npm pack --dry-run --json` output.
10. Inspect the npm package page for:
    - Current version.
    - Provenance status.
    - Dist tags.
    - README rendering.
11. Report:
    - Anything requiring a dependency update.
    - Any security advisory or workflow concern.
    - Whether a release is needed.
    - Exact commands run and their results.

## Automation rule

The monthly automation may prepare a report or draft a PR. It may not publish,
merge, approve releases, create npm tokens, or change npm package settings.
