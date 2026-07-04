# color2k release checklist

Use this checklist before any npm publish.

## Pre-merge

1. Confirm the PR contains no runtime API behavior changes.
2. Confirm the README/API docs diff has been reviewed.
3. Confirm website screenshots have been reviewed.
4. Confirm CI is green.
5. Confirm semantic-release dry run reports the expected next version.

For the documentation overhaul release, the expected next version is `2.0.4`.

## Local validation

Run from a clean checkout:

```sh
npm ci
npm run check
npm audit --omit=dev
npm pack --dry-run --json
```

Inspect the pack output and confirm it only includes:

- `dist/**`
- `LICENSE`
- `README.md`
- `package.json`

## npm settings

Before publishing:

1. Confirm npm trusted publishing is configured for this repository and workflow.
2. Confirm the workflow uses GitHub-hosted runners.
3. Confirm the release job has `id-token: write`.
4. Confirm legacy `NPM_TOKEN` publishing is no longer required.
5. Confirm package token settings match the intended 2FA/token policy.

## Publish

1. Get explicit maintainer approval.
2. Run the release workflow from `main`.
3. Watch the workflow until completion.
4. Verify the npm package page:
   - Correct version.
   - Correct `latest` dist tag.
   - Provenance present.
   - README rendered correctly.
   - Package file list matches expectations.
5. Smoke install in a temporary project:
   - CommonJS require.
   - ESM import.
   - TypeScript type resolution.
   - UMD bundle presence if CDN usage remains supported.
