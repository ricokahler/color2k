# color2k maintenance and trust plan

Status: implemented as one overhaul PR. Stop for maintainer review before merge
and before any npm publish.

Date: 2026-07-04

## Goals

- Improve API documentation everywhere while keeping JSDoc comments in `src/*.ts` as the source of truth for function docs.
- Replace the current hydrated Preact docs site with a static HTML site that visually tracks GitHub README rendering.
- Keep the README and website in sync through one docs pipeline.
- Add server-side syntax highlighting and avoid client-side JavaScript on the website unless a future approved feature explicitly needs it.
- Improve SEO with full static content, canonical metadata, sitemap/robots, Open Graph/Twitter metadata, and JSON-LD structured data.
- Modernize dependencies and tooling without increasing runtime package weight.
- Raise package trust: provenance, least-privilege publishing, scoped or removed npm tokens, tighter CI permissions, release checkpoints, and tarball verification.
- Add lightweight ongoing maintenance automation so this does not depend on memory or vibes.

## Non-goals

- No runtime API behavior changes in the overhaul PR unless a docs or build fix proves one is required.
- No breaking changes. The intended package outcome is a patch release, `2.0.4`.
- No direct manual version bump in `package.json`; semantic-release should calculate the release.
- No package publish until after a human checkpoint and an approved PR.
- No automatic publish on ordinary implementation branches.
- No new production dependencies for `color2k` runtime code.

## Current repo observations

- `package.json` in this checkout says `2.0.0`; the npm registry latest is
  `2.0.3` as checked on 2026-07-04. This appears to be normal
  semantic-release behavior and is documented in the release checklist.
- The published package has no runtime dependencies in this checkout. `npm audit --omit=dev` reports zero production vulnerabilities.
- Full `npm audit` reports dev-tooling vulnerabilities, including one critical. This is mostly build/release/docs tooling, but it still matters because release tooling is part of the supply chain.
- The current website generator renders Preact on the server, bundles Preact app JavaScript, injects `window.docs` and `window.readmeHtml`, then hydrates on the client.
- The docs extractor already uses the TypeScript compiler to read function declarations and JSDoc, but many JSDoc blocks are incomplete: missing param descriptions, typoed prose, missing examples, and sparse return/edge-case notes.
- The README currently stops generated/API content at `<!-- DOCS-END -->` and sends users to the docs site for API details.
- Release currently runs on push to `main` and `alpha`, uses `NPM_TOKEN`, uses older `actions/*@v3`, does not set explicit workflow permissions, and does not use OIDC trusted publishing.
- `renovate.json` has monthly grouped updates with `automerge: true`; this is not the posture we want for a high-download package.
- `.npmignore` already excludes `src`, `scripts`, `website`, build clutter, and config files from the published tarball.

## Research summary

- npm Trusted Publishing uses OIDC so a specific CI workflow can publish without long-lived npm tokens. npm docs say it requires npm CLI 11.5.1 or later and Node 22.14.0 or later, and GitHub Actions needs `id-token: write`.
- npm says trusted publishing generates provenance by default for GitHub Actions/GitLab publishes. The GitHub changelog says the `--provenance` flag is no longer needed with trusted publishing.
- npm recommends, after trusted publishing is verified, setting package publishing access to "Require two-factor authentication and disallow tokens" and revoking old automation tokens. npm also describes granular tokens with package/scope limits, expirations, IP restrictions, read/write selection, and 2FA-bypass controls.
- GitHub recommends least-privilege `GITHUB_TOKEN` permissions, careful handling of secrets, avoiding privileged untrusted PR checkout, OIDC for short-lived credentials, monitoring action vulnerabilities, and using OpenSSF Scorecard checks for script injection, token permissions, and pinned actions.
- OpenSSF's npm supply-chain guidance frames the main risks as dependency compromise, hijacked dependencies, insecure CI, dependency confusion, and limiting blast radius after compromise.
- Google's structured data guidance says JSON-LD helps search engines understand page content, should match visible page content, and should be validated. Google's JavaScript SEO docs describe crawl, render, and index phases, which supports the goal of shipping core docs as plain HTML.

Sources:

- https://docs.npmjs.com/trusted-publishers/
- https://docs.npmjs.com/about-access-tokens/
- https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/
- https://docs.github.com/en/actions/reference/security/secure-use
- https://openssf.org/blog/2022/09/01/npm-best-practices-for-the-supply-chain/
- https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics

## Overhaul PR plan

Make one PR that contains the full documentation and trust overhaul. Keep the work internally staged so each risky area is reviewable in the PR description and commit history, but do not split it into separate PRs.

Target release:

- Intended npm version: `2.0.4`.
- Release type: patch.
- Compatibility: no breaking changes and no runtime API behavior changes.
- Scope: documentation, docs generation, website rendering, release trust, CI/release safety, and maintenance documentation.
- Important semantic-release check: verify with `npx semantic-release --dry-run` that the final merged commit set produces `2.0.4`. If the default analyzer would skip a pure `docs:` release, choose an explicit patch-release path before merge, such as a `fix(docs): ...` commit or a reviewed semantic-release rule for docs-only patch releases.

### Phase 1: Baseline and safety rails

Purpose: establish the current truth before changing docs or release behavior.

Tasks:

- Run `npm ci` from a clean checkout and record baseline results for `npm test`, `npm run build`, `npm run website`, and `npm pack --dry-run --json`.
- Add or update scripts for repeatable checks:
  - `check`: lint, test, build, docs check, package dry-run.
  - `pack:check`: build then run `npm pack --dry-run --json` and inspect allowed files.
  - `audit:prod`: `npm audit --omit=dev`.
- Add a small package-shape test that verifies the built package supports the advertised CJS, ESM, UMD, `exports`, and `.d.ts` entrypoints.
- Decide whether `package.json` staying at `2.0.0` is intentional semantic-release behavior or should be documented in release notes.

Acceptance:

- Existing runtime behavior remains unchanged.
- CI can prove package shape before release.
- We know exactly what the tarball will contain.

### Phase 2: Documentation source cleanup

Purpose: make every exported function self-documenting from JSDoc.

Tasks:

- Audit every export from `src/index.ts`, including helper exports like `guard` and `ColorError`.
- For every public function, standardize JSDoc with:
  - One clear summary.
  - Supported input formats where relevant.
  - `@param` for every parameter.
  - `@returns` for every return value.
  - One minimal example where helpful.
  - Notes for clamping, alpha handling, output color model, and thrown errors where relevant.
- Fix obvious docs typos without changing implementation behavior.
- Expand `website/getDocInfo.test.ts` or successor tests to fail when public JSDoc is missing param or return docs.

Acceptance:

- Every public API has complete JSDoc.
- Generated docs are deterministic.
- Tests catch future incomplete JSDoc.

### Phase 3: Single README and website docs pipeline

Purpose: preserve JSDoc authorship while making README and website the same documentation artifact.

Tasks:

- Replace the one-way website-only docs extraction with a docs generator that:
  - Reads JSDoc from `src/*.ts`.
  - Generates an API section as Markdown.
  - Updates README between explicit markers, for example `<!-- API-DOCS-START -->` and `<!-- API-DOCS-END -->`.
  - Uses the README as the website content source after generation.
- Keep the manually authored README introduction above generated markers.
- Add `docs:generate` and `docs:check`, where `docs:check` fails if generated README content is stale.
- Preserve stable heading slugs for existing links where practical.

Acceptance:

- README contains the complete API docs.
- Website content is rendered from the same README.
- CI prevents README/site drift.

### Phase 4: Static GitHub-style website

Purpose: remove client JavaScript and make `color2k.com` feel like the GitHub README page.

Tasks:

- Replace `website/App.tsx`, Preact hydration, and client bundles with a static renderer.
- Render Markdown server-side with a GitHub-compatible Markdown parser and GitHub-like CSS.
- Use server-side syntax highlighting, likely Shiki with `github-light` and optionally `github-dark`, emitted as static HTML spans.
- Inline or bundle local CSS. Avoid external stylesheet requests like `https://unpkg.com/normalize.css`.
- Use a restrained product/docs register:
  - System font stack.
  - GitHub-like content width and typography.
  - Familiar heading anchors, tables, code blocks, and API sections.
  - No decorative app shell, search box, hydration data, or client runtime.
- Generate:
  - `build/index.html`
  - `build/robots.txt`
  - `build/sitemap.xml`
  - static icons/manifests copied from `website/static`
- Add metadata:
  - canonical URL
  - title and description
  - Open Graph and Twitter cards
  - JSON-LD for `SoftwareSourceCode` or `SoftwareApplication`, plus visible facts only
- Add website snapshot or HTML tests:
  - no inline hydration scripts
  - no external CSS/JS
  - headings and API anchors exist
  - highlighted code is present in static HTML

Acceptance:

- `npm run website` produces a no-JS static site.
- The first HTML response contains all README/API content.
- Site visually resembles GitHub docs rather than a custom app.

### Phase 5: Dependency modernization and pruning

Purpose: update tooling and shrink the maintenance surface without touching runtime behavior.

Tasks:

- Remove website-only client dependencies after the static renderer lands, likely `preact`, `preact-render-to-string`, `react`, `react-dom`, `@types/react`, and `@types/react-dom`.
- Replace `showdown` if needed, since current audit reports a direct vulnerability with no available fix.
- Update build/test/release dev dependencies in controlled batches.
- Keep old Node 4/6 output targets for this patch release unless a build-tool update makes that impossible. Any intentional support-policy change belongs outside this docs-only patch.
- Keep `sideEffects: false` and zero runtime dependencies.
- Run:
  - `npm ci`
  - `npm run lint`
  - `npm test -- --coverage`
  - `npm run build`
  - `npm run website`
  - `npm audit --omit=dev`
  - `npm pack --dry-run --json`

Acceptance:

- Production audit stays clean.
- Full audit is materially improved or remaining dev issues are documented with owners.
- Package output and tests are unchanged except intentional docs/site artifacts.

### Phase 6: CI and supply-chain hardening

Purpose: make compromise harder and make release evidence easier to inspect.

Tasks:

- Set top-level workflow permissions to read-only, then grant job-specific permissions.
- Update `actions/checkout`, `actions/setup-node`, and `codecov/codecov-action`, preferably pinned to full commit SHAs with Renovate configured to update them.
- Add `dependency-review` for PRs touching lockfiles.
- Add OpenSSF Scorecard on a schedule and on main changes, publishing results to code scanning if feasible.
- Add CodeQL or equivalent workflow scanning if it is useful for this small TypeScript repo.
- Change Renovate:
  - Disable automerge.
  - Keep monthly grouping if desired.
  - Require CI and human review.
  - Include GitHub Actions updates.
- Consider using `npm ci --ignore-scripts` in CI and release after a trial proves the build does not depend on install scripts.
- Add branch protection expectations to a maintainer checklist:
  - required PR checks
  - required review before merge
  - no direct pushes to `main`
  - protected release environment for publishing

Acceptance:

- Workflows follow least privilege.
- Third-party action drift is visible.
- Dependency and workflow updates require review.

### Phase 7: Trusted publishing and provenance

Purpose: remove long-lived npm publish credentials from GitHub Actions.

Tasks:

- Convert release workflow to trusted publishing:
  - Use GitHub-hosted runners.
  - Use Node 22.14+ or 24+ with npm 11.5.1+.
  - Add `id-token: write`.
  - Remove `NPM_TOKEN` from the workflow after verification.
  - Configure npm trusted publisher for `ricokahler/color2k`, workflow file `release.yml`, and preferably a protected GitHub Environment such as `npm-publish`.
- Change release trigger from "every push to main" to a safer release checkpoint:
  - Preferred: manual `workflow_dispatch` from `main` after PR merge and explicit approval.
  - Also acceptable: push-to-main release gated by a protected environment that requires Rico approval.
- Keep semantic-release if it remains compatible with trusted publishing and the desired checkpoint model.
- Investigate npm staged publishing. If semantic-release cannot stage publish, document whether the extra manual review is worth replacing semantic-release for this package.
- After OIDC works, change npm package settings to require 2FA and disallow tokens if feasible.
- Revoke old `NPM_TOKEN` automation secrets.
- If a fallback token is temporarily required:
  - Use a granular token scoped only to `color2k`.
  - Set the shortest practical expiration, no more than 90 days.
  - Avoid 2FA bypass if package policy requires fully enforced 2FA.
  - Store rotation instructions in a private maintainer note, not the repo.

Acceptance:

- A dry-run release proves semantic-release behavior before publishing.
- The dry run reports the intended next version, `2.0.4`.
- A real release is approved manually.
- npm shows provenance for the published version.
- No long-lived npm publish token remains in GitHub repo secrets after migration.

### Phase 8: Trust-facing public docs

Purpose: make users understand why this package is safe to adopt.

Tasks:

- Add concise README/site sections:
  - zero runtime dependencies
  - tiny published surface
  - provenance-enabled releases
  - supported module formats
  - security policy and vulnerability reporting
- Add `SECURITY.md`.
- Add a maintainer release checklist, probably `docs/release-checklist.md`.
- Add badges only if they are useful and reliable. Avoid badge clutter.

Acceptance:

- Trust claims are factual and backed by CI/package evidence.
- Public docs do not overpromise security.

### Phase 9: Maintenance automation docs

Purpose: keep the package watched without requiring constant attention.

Tasks:

- Add a monthly maintenance checklist document for Codex runs:
  - fetch latest `main`
  - `npm ci`
  - `npm outdated`
  - `npm audit` and `npm audit --omit=dev`
  - review Renovate PRs
  - inspect GitHub Actions/security alerts
  - run docs check, tests, build, website, pack dry-run
  - inspect npm package page for provenance and metadata
  - report whether a release is needed
- After implementation, create a monthly Codex automation only with Rico approval.
- The automation should open with "plan and report only" by default, not publish or merge.

Acceptance:

- There is a repeatable monthly maintenance protocol.
- Automation cannot publish by itself.

## Overhaul PR review checklist

Before merging the overhaul PR:

- The PR description lists each phase and links to evidence.
- README/API docs diff has been reviewed for public tone.
- Website screenshots have been reviewed.
- `npm run check` passes.
- `npm audit --omit=dev` is clean.
- `npm pack --dry-run --json` has an expected file list.
- Semantic-release dry run says the next version will be `2.0.4`.
- The PR contains no runtime API behavior changes.
- Any remaining dev-only audit findings are documented.

## Release checkpoint protocol

Before any publish:

1. Confirm branch is `main` and clean.
2. Confirm all PR checks are green.
3. Run local or CI validation:
   - `npm ci`
   - `npm run check`
   - `npm audit --omit=dev`
   - `npm pack --dry-run --json`
4. Review tarball file list and unpacked size.
5. Review generated README and website diff.
6. Review semantic-release dry-run notes.
7. Confirm npm trusted publisher and package 2FA/token settings.
8. Get explicit Rico approval.
9. Run release.
10. Verify npm package page:
   - correct version
   - provenance present
   - dist tags correct
   - README rendered correctly
   - package files expected
11. Smoke install in a temporary project:
   - ESM import
   - CJS require
   - TypeScript type resolution
   - at least one browser/CDN-style bundle check if UMD remains supported

## Open decisions for Rico

- Should the site be a literal rendered README only, or rendered README plus a small static left-hand table of contents? My recommendation: literal README first, then add static TOC only if navigation feels painful.
- Should releases be manual `workflow_dispatch` only? My recommendation: yes, at least for the next few releases.
- Should we keep semantic-release? My recommendation: keep it initially, but gate it manually and reassess if npm staged publishing becomes important.
- Should old Node 4/6 bundle targets remain? My recommendation: keep them for now unless we intentionally plan a major version.
- `guard` remains public and documented for compatibility.

## First execution order inside the overhaul PR

Start the one PR with the lowest-risk, highest-signal commits:

1. Baseline install, tests, build, website, pack dry-run.
2. Add check scripts and package-shape tests.
3. Complete JSDoc for every public export.
4. Add docs completeness tests.
5. Replace the README/site docs pipeline.
6. Replace the website renderer.
7. Prune dependencies and harden CI/release.
8. Verify semantic-release dry-run reports `2.0.4`.

Stop for Rico review before merge and again before any real publish.
