# AGENTS.md

Instructions for coding agents working in this repository. Humans should read
[CONTRIBUTING.md](./CONTRIBUTING.md), which says the same things at more length.

color2k is a color parsing and manipulation library whose main feature is its
size: about 2.4 kB minified and gzipped, with zero runtime dependencies. Treat
every byte in `dist` as expensive.

## Commands

```sh
npm ci              # install (also builds dist)
npm test            # jest
npm run check       # everything CI runs; must pass before you open a PR
npm run docs:generate   # rewrite the README's API section, sizes and pictures
npm run website     # build the site and llms files into ./build
```

## Layout

- `src/<name>.ts`: one public function per file, default-exported, with its
  test in `src/<name>.test.ts`. `src/index.ts` re-exports each one by name.
- `website/docs.ts`: turns the JSDoc in `src` into the README API section,
  `llms.txt` and `llms-full.txt`.
- `website/`: the static generator for color2k.com (`index.ts`, `template.ts`,
  `App.css`, `showcase.js` for the hero, the theme studio and the function
  index, and `static/` for the logo and icons).
- `scripts/sizes.js` measures the bundle (everything, and each export alone)
  into `docs/sizes.json`. The README table and the website read that file.
- `scripts/`: build and check scripts. `scripts/color-map.ts` generates the
  compressed named-color table in `src/parseToRgba.ts`.
  `scripts/readme-assets.js` draws `docs/readme/*.svg` (the animated banner and
  each recipe's result) with color2k itself.

## Rules

- Do not add runtime dependencies, and do not grow the bundle for
  documentation or tooling changes. If a change adds bytes to `dist`, say how
  many in the PR.
- `dist` must run on Node 6. The CommonJS build is run on a real Node 6 in CI
  (`scripts/check-node6.js`, which is itself ES5), and the `module` and UMD
  builds must parse as ES2015 (`npm run compat:check`). Do not use newer
  syntax or built-ins in `src` without checking the build output.
- Every export needs a JSDoc comment with a description, a `js` example,
  `@param` for each parameter and `@returns`. The docs build fails without them.
- Never edit README.md between `<!-- API-DOCS-START -->` and
  `<!-- API-DOCS-END -->` by hand. Edit the JSDoc and run
  `npm run docs:generate`.
- README code blocks marked `js`, `jsx` or `tsx` are executed by
  `scripts/check-examples.js`. A trailing comment on a one-line statement is an
  assertion (`toHex('red'); // '#ff0000'`), so put explanations on their own
  line and make sure each example imports what it uses.
- A `<!-- RESULT: kind expression -->` marker under a README code block draws
  that block's result. The expression runs in the block's scope, so name a
  variable from the recipe instead of repeating its math. Never edit
  `docs/readme/*.svg` or the lines between the `RESULT` markers by hand; run
  `npm run docs:generate` (after `npm run build`).
- The three theme builders (`softTheme`, `seriousTheme`, `boldTheme`) live in
  the README as recipes. The website lifts those exact functions out of the
  README, shows them and runs them, so change them there and nowhere else.
  Each builder returns its decisions about the color as `why`, and the copy
  for those decisions is `WHY` in `website/showcase.js`. The generator sweeps
  each builder through about 1,300 colors (see-through ones included) and
  fails if a text pair drops below WCAG AA.
- The site self-hosts two small font subsets for the theme cards
  (`website/static/fredoka.woff2` and `anton.woff2`, both OFL, license in
  `fonts-license.txt`). Do not add more, do not preload them, and keep
  `font-display: swap`. `npm run website:check` holds them under 30 kB.
- Every "2.4 kB" is held to `docs/sizes.json`. If the bundle rounds to
  something else, the docs build fails until the copy is updated.
- The list between `<!-- AGENT-NOTES-START -->` and `<!-- AGENT-NOTES-END -->`
  in README.md is copied into `llms.txt`. Keep it short and true.
- New exports must be added to `API_GROUPS` in `website/docs.ts` and need an
  example in `DEMOS` in `website/showcase.js`. The function index on the site
  is built from those two, and `npm run website:check` fails unless it lists
  exactly the exports in `src/index.ts`.
- The site is designed for a phone first (390px), then widened. Its header
  links are its sections, by the same names as the labels over them. Keep one
  home for each thing: an export's home is its API entry, and the function
  index and the recipes link there.
- Nothing on the website may touch the DOM on every frame. The hero is one
  small canvas (a pixel per tile, scaled up by the compositor), scroll effects
  are CSS transforms and opacity, and DOM text updates are throttled into
  boxes that never change size. Keep it that way.
- Copy follows the maintainer's guidelines: a sharp colleague talking. Plain
  words, real numbers, short sentences, no italics, no exclamation marks, no
  em-dash asides, and no claim you have not run.
- The website stays static: no frameworks, no external requests, no inline
  scripts (the Content-Security-Policy written by `website/index.ts` only allows
  the site's own two script files), and it must work with JavaScript turned
  off and respect `prefers-reduced-motion`. `npm run website:check` enforces
  most of this.
- Do not reformat files you are not otherwise changing.

## Pull requests and releases

- PR titles are conventional commits and become the squash commit. `feat:`
  releases a minor version, and `fix:`, `perf:` and `docs:` release a patch.
  `chore:`, `ci:` and `test:` release nothing.
- Merging to `main` publishes to npm after the maintainer approves it. Do not
  merge, enable auto-merge or run the Release workflow yourself.
