# color2k monthly maintenance

A report-first checklist. Don't merge, approve releases, rotate credentials or
change npm settings without the maintainer's approval.

1. Fetch the latest `main`, then run `npm ci` and `npm run check`.
2. Run `npm outdated` and `npm audit`.
3. Review open Renovate and Dependabot PRs and the Renovate Dependency
   Dashboard issue.
4. Check recent GitHub Actions runs on `main` (Test, Release, Security,
   Dependabot Updates) and any security alerts.
5. Check the npm package page: latest version, dist-tags and provenance.
6. Report what needs an update, any advisory or workflow problem, and any merged
   change still waiting for release approval.

Releases happen on merge to `main`; see [release-checklist.md](release-checklist.md).
