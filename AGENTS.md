# AGENTS.md

Instructions for coding agents working in this repository. Humans should read
[CONTRIBUTING.md](./CONTRIBUTING.md), which says the same things at more length.

color2k is a color parsing and manipulation library whose main feature is its
size: about 2.5 kB minified and gzipped, with zero runtime dependencies. Treat
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
- `website/docs.ts`: turns the JSDoc in `src` into the README API section, one
  Markdown file per section of the site (`/adjust.md` and so on),
  `llms.txt` and `llms-full.txt`.
- `website/`: the static generator for color2k.com, which is one page.
  `index.ts` cuts the README and the JSDoc into its sections, `template.ts` is
  the shell (menu, splash, color bar, footer), `pages.ts` and `demos.ts` are
  the section bodies and the demo markup, and `App.css` is the one stylesheet. `models.js` holds what each
  demo shows as plain data and runs in both Node and the browser. `client.js`
  and `theme.js` are the browser scripts. `static/` has the logo and icons.
- `scripts/sizes.js` measures the bundle (everything, each export alone, and
  what each source file adds) into `docs/sizes.json`. The README table and the
  website's treemap read that file.
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
  for those decisions is `WHY` in `website/models.js`. The generator sweeps
  each builder through about 1,300 colors (see-through ones included) and
  fails if a text pair drops below WCAG AA.
- The site's own colors come from the visitor's color through `site()` in
  `website/models.js`, in light and dark. `npm run website:check` sweeps it the
  same way, and checks highlighted code against it too. Add a pair to
  `SITE_PAIRS` when you put text on a new background.
- The site self-hosts one small font subset, for the Bold theme sample
  (`website/static/anton.woff2`, OFL, license in `fonts-license.txt`). The
  other samples use system font stacks. Do not add more, do not preload it,
  and keep `font-display: swap`. `npm run website:check` enforces this.
- Every "2.5 kB" is held to `docs/sizes.json`. If the bundle rounds to
  something else, the docs build fails until the copy is updated.
- The list between `<!-- AGENT-NOTES-START -->` and `<!-- AGENT-NOTES-END -->`
  in README.md is copied into `llms.txt`. Keep it short and true.
- New exports must be added to `API_GROUPS` in `website/docs.ts` and need a
  demo: a model in `demos` in `website/models.js` and its markup in
  `website/demos.ts`. The build fails without one, and `npm run website:check`
  fails unless the page lists exactly the package's exports.
- The site is one long page of sections, designed for a phone first (390px),
  then widened. Keep one home for each thing: a function's home is its entry
  in its group's section (`/#darken`), with its demo and its reference
  together. Everything else links there. The menu is the map, so a new
  section goes in `nav` in `website/index.ts`, and gets a Markdown twin in
  `getSections` in `website/docs.ts`.
- The README is the one source for the site's prose, credits included.
  `npm run website:check` fails if a line of the README's hand-written
  sections is not on the page word for word, so write prose in the README
  and let the site pick it up.
- Old addresses keep working. Anchors from earlier versions of the site are
  real elements on the page (`LEGACY_ANCHORS` in `website/index.ts`, and one
  per function), and each path from when the site was several pages keeps
  a small page that forwards to its section, anchor included
  (`website/forward.js`). Do not remove them.
- The theme samples' buttons take their colors from `BUTTON_STATES` in
  `website/models.js`. `npm run website:check` holds the CSS to that list and
  sweeps every state for AA, so add a state there before you style it.
- A demo's first paint and its updates come from the same model. Markup holds
  `data-t` slots for text and reads colors from CSS variables, and the browser
  only fills those in. Do not build demo markup in `client.js`.
- Keep the site smooth. A color change repaints at most once a frame, demos
  that are off screen wait until they scroll into view, the wheel turns with
  a CSS transform, and nothing animates until the visitor touches it.
- Copy follows the maintainer's guidelines: a sharp colleague talking. Plain
  words, real numbers, short sentences, no italics, no exclamation marks, no
  em-dash asides, and no claim you have not run.
- The website stays static: no frameworks, no external requests, no inline
  scripts (the Content-Security-Policy written by `website/index.ts` only allows
  the site's own script files), and it must work with JavaScript turned
  off and respect `prefers-reduced-motion`. `npm run website:check` enforces
  most of this.
- Do not reformat files you are not otherwise changing.

## Pull requests and releases

- PR titles are conventional commits and become the squash commit. `feat:`
  releases a minor version, and `fix:`, `perf:` and `docs:` release a patch.
  `chore:`, `ci:` and `test:` release nothing.
- Merging to `main` publishes to npm after the maintainer approves it. Do not
  merge, enable auto-merge or run the Release workflow yourself.
