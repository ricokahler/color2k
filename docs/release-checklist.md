# color2k release checklist

Releases are automatic: merging to `main` runs the `Release` workflow, and
semantic-release publishes to npm with provenance when the merged commits call
for it.

## How a release happens

1. A PR merges to `main` (squash merge; the PR title becomes the commit).
2. The `Release` workflow runs a semantic-release dry run over the commits since
   the last release:
   - `feat:` → minor, `fix:`/`perf:`/`docs:` → patch, `BREAKING CHANGE` → major.
   - `chore:`, `ci:`, `test:` and similar → nothing to release; the workflow
     stops there without requesting approval.
3. If there is something to release, the `npm-publish` environment asks
   @ricokahler to approve the deployment.
4. After approval the job runs `npm run check`, then semantic-release tags the
   version, publishes to npm through trusted publishing (OIDC, no `NPM_TOKEN`)
   and creates the GitHub release.

Only one release runs at a time. `Release` can also be run by hand from the
Actions tab (branch `main`); manual runs skip the dry run.

## Before merging

1. CI is green.
2. The PR title is a conventional commit with the intended release type.
3. For runtime changes, the README/API docs and website are updated
   (`npm run check` fails if generated docs are stale).

## After a release

1. The npm page shows the new version on `latest`, with provenance.
2. The GitHub release and tag exist.
3. Optionally smoke-install in a scratch project (CommonJS `require`, ESM
   `import`, TypeScript types) and run `npm audit signatures`.

## Trusted publishing setup (already done)

npm trusted publisher: GitHub Actions, `ricokahler/color2k`, workflow
`release.yml`, environment `npm-publish`. The environment requires
@ricokahler's approval and only deploys from protected branches. Keep
`publishConfig.provenance: true` in `package.json`.
