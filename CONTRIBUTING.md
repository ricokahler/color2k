# Contributing to color2k

Thanks for helping. color2k is small on purpose, so the bar for changes is
simple: it has to be correct, documented and cheap in bytes.

## Setup

You need Node.js 24 (see `.nvmrc`).

```sh
git clone https://github.com/ricokahler/color2k.git
cd color2k
npm ci
npm run check
```

`npm run check` is what CI runs. It lints, tests with coverage, builds the
package, checks that the generated docs are current, runs every README
example, builds and checks the website, and inspects the npm package contents.

| Command | What it does |
| --- | --- |
| `npm test` | Runs the Jest tests. Add `-- --watch` while you work. |
| `npm run build` | Builds `dist` with Rollup and emits type declarations. |
| `npm run docs:generate` | Rewrites the README's API section from JSDoc, its size table, and its banner and recipe pictures (needs a build). |
| `npm run examples:check` | Runs the README code blocks against `dist`. |
| `npm run website` | Builds color2k.com, `llms.txt` and `llms-full.txt` into `build`. |
| `npm run check` | All of the above, plus lint and package checks. |

## How the project is laid out

- `src/<name>.ts` holds one public function with its JSDoc, and
  `src/<name>.test.ts` holds its tests. `src/index.ts` re-exports everything.
- `website/docs.ts` reads that JSDoc and generates the README API section and
  the llms files. `website/` also contains the static site generator.
- `scripts/` holds the build and check scripts.

## Guidelines

**Size is the feature.** color2k is about 2.4 kB minified and gzipped. New
features need to earn their bytes, so please open an issue before writing a
large one. No runtime dependencies.

**`dist` must run on Node 6.** color2k is used in old toolchains. CI runs the
CommonJS build on a real Node 6 and checks that the `module` and UMD builds
parse as ES2015. `npm run compat:check` runs the same checks locally (on your
Node version), so avoid newer syntax and built-ins in `src`.

**Document as you go.** Every export needs a JSDoc comment with a description,
a `js` example, `@param` tags and `@returns`. Run `npm run docs:generate` and
commit the README change. Do not edit the README between the `API-DOCS`
markers by hand.

**Examples must run.** `js`, `jsx` and `tsx` code blocks in the README are
executed in CI. A trailing comment on a one-line statement is checked against
the real result:

```js
toHex('red'); // '#ff0000'
```

Put explanatory comments on their own line.

**Pictures come from the code.** The banner and the picture under each recipe
live in `docs/readme` and are drawn by `scripts/readme-assets.js` using
color2k. A `<!-- RESULT: kind expression -->` marker under a code block draws
that block's result, with the expression evaluated in the block's scope. Run
`npm run docs:generate` after changing a recipe, and commit the SVGs.

**Sizes are measured.** `scripts/sizes.js` bundles each export with Rollup,
minifies it with Terser and gzips it, and writes `docs/sizes.json`. It also
measures what each source file adds to the whole bundle, for the treemap on
the website. The README table and the website read that file, and the docs build fails if the total no
longer rounds to the 2.4 kB the copy claims.

**Write like a person.** Docs and site copy should sound like a sharp
colleague explaining something: plain words, real numbers, short sentences.
No italics, exclamation marks or em-dash asides, and no claim you have not
run.

**Test behavior.** Add or update tests next to the code you change.

**Keep diffs focused.** Please do not reformat code you are not changing.

## Pull requests

Use a [conventional commit](https://www.conventionalcommits.org) as the PR
title, for example `fix: parse uppercase hex colors`. PRs are squash-merged and
the title decides the release: `feat:` is a minor version, `fix:`, `perf:` and
`docs:` are a patch, and `chore:`, `ci:` and `test:` release nothing. Releases
are automatic after a maintainer approves them. See
[docs/release-checklist.md](./docs/release-checklist.md).

## Fonts

The theme samples on the website use two fonts, cut down to basic Latin and
served from the site itself: Fredoka (weight 600) and Anton. Both are under
the SIL Open Font License, which ships next to them as
`website/static/fonts-license.txt`. Everything else uses system fonts.

## Logo and icons

The logo (`website/static/logo.svg`) and icon (`website/static/favicon.svg`)
are hand-written SVG. The PNG icons, `favicon.ico` and `og.png` in
`website/static` are renders of those files, so re-render them if you change
the SVGs.

## Security

Please report vulnerabilities privately. See [SECURITY.md](./SECURITY.md).
