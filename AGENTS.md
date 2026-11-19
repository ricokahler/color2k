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
npm run docs:generate   # rewrite the API section of README.md from JSDoc
npm run website     # build the site and llms files into ./build
```

## Layout

- `src/<name>.ts`: one public function per file, default-exported, with its
  test in `src/<name>.test.ts`. `src/index.ts` re-exports each one by name.
- `website/docs.ts`: turns the JSDoc in `src` into the README API section,
  `llms.txt` and `llms-full.txt`.
- `website/`: the static generator for color2k.com (`index.ts`, `template.ts`,
  `App.css`, `playground.js`, and `static/` for the logo and icons).
- `scripts/`: build and check scripts. `scripts/color-map.ts` generates the
  compressed named-color table in `src/parseToRgba.ts`.

## Rules

- Do not add runtime dependencies, and do not grow the bundle for
  documentation or tooling changes. If a change adds bytes to `dist`, say how
  many in the PR.
- Every export needs a JSDoc comment with a description, a `js` example,
  `@param` for each parameter and `@returns`. The docs build fails without them.
- Never edit README.md between `<!-- API-DOCS-START -->` and
  `<!-- API-DOCS-END -->` by hand. Edit the JSDoc and run
  `npm run docs:generate`.
- README code blocks marked `js`, `jsx` or `tsx` are executed by
  `scripts/check-examples.js`. A trailing comment on a one-line statement is an
  assertion (`toHex('red'); // '#ff0000'`), so put explanations on their own
  line and make sure each example imports what it uses.
- The list between `<!-- AGENT-NOTES-START -->` and `<!-- AGENT-NOTES-END -->`
  in README.md is copied into `llms.txt`. Keep it short and true.
- New exports must be added to `API_GROUPS` in `website/docs.ts`.
- The website stays static: no frameworks, no external requests, and it must
  work with JavaScript turned off. `npm run website:check` enforces this.
- Do not reformat files you are not otherwise changing.

## Pull requests and releases

- PR titles are conventional commits and become the squash commit. `feat:`
  releases a minor version, and `fix:`, `perf:` and `docs:` release a patch.
  `chore:`, `ci:` and `test:` release nothing.
- Merging to `main` publishes to npm after the maintainer approves it. Do not
  merge, enable auto-merge or run the Release workflow yourself.
