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

## One-time trusted publishing setup

Configure this before the first release from the new workflow:

1. On npm, open the `color2k` package settings.
2. Add a Trusted Publisher with:
   - Provider: GitHub Actions
   - Organization or user: `ricokahler`
   - Repository: `color2k`
   - Workflow filename: `release.yml`
   - Environment name: `npm-publish`
   - Allowed actions: `npm publish`
3. On GitHub, create or confirm the `npm-publish` environment.
4. Add required reviewers to the `npm-publish` environment.
5. Restrict the environment to deploy only from `main`, if branch protection
   settings allow it.
6. Confirm there is no `NPM_TOKEN` required by `.github/workflows/release.yml`.
7. After the first trusted publish works, revoke any old npm automation token
   for this package.

## Provenance requirements

Before publishing, confirm:

1. The release workflow is on the default branch.
2. The workflow runs on a GitHub-hosted runner.
3. The release job has `id-token: write`.
4. `package.json` contains:

```json
{
  "publishConfig": {
    "provenance": true
  }
}
```

5. The release workflow sets `NPM_CONFIG_PROVENANCE=true`.
6. The package repository URL in `package.json` matches the public GitHub repo.

## Publish

1. Merge the approved PR to `main`.
2. Confirm the release workflow file is present on `main`.
3. In GitHub, open Actions, then the `Release` workflow.
4. Click Run workflow and select branch `main`.
5. Approve the `npm-publish` environment deployment when prompted.
6. Watch the workflow until completion.
7. Verify the npm package page:
   - Correct version.
   - Correct `latest` dist tag.
   - Provenance present.
   - README rendered correctly.
   - Package file list matches expectations.
8. Smoke install in a temporary project:
   - CommonJS require.
   - ESM import.
   - TypeScript type resolution.
   - UMD bundle presence if CDN usage remains supported.
9. Run `npm audit signatures` in the smoke project.
