// The body of each kind of page: the overview, a function group, the themes
// and the size page. `index.ts` gathers the data and `template.ts` wraps the
// result in the shell.
import { DocInfo } from './getDocInfo';
import { escapeHtml, renderDemo, styleOf } from './demos';
import { icons } from './template';

const formatBytes = (bytes: number) =>
  bytes < 1000 ? `${bytes} B` : `${(bytes / 1000).toFixed(2)} kB`;

// --------------------------------------------------------------- treemap

interface Tile {
  name: string;
  size: number;
  typical: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A squarified treemap (Bruls, Huizing and van Wijk): rows are filled along
 * the shorter side for as long as that keeps the tiles close to square.
 */
function squarify(
  items: Array<{ name: string; size: number; typical: boolean }>,
  x: number,
  y: number,
  width: number,
  height: number
): Tile[] {
  const tiles: Tile[] = [];
  let rest = items.slice().sort((a, b) => b.size - a.size);
  const scale = (width * height) / rest.reduce((sum, { size }) => sum + size, 0);
  const sum = (row: typeof rest) => row.reduce((total, { size }) => total + size * scale, 0);

  while (rest.length) {
    const short = Math.min(width, height);
    const worst = (row: typeof rest) => {
      const total = sum(row);
      const sizes = row.map(({ size }) => size * scale);
      return Math.max(
        (short * short * Math.max(...sizes)) / (total * total),
        (total * total) / (short * short * Math.min(...sizes))
      );
    };
    let count = 1;
    while (count < rest.length && worst(rest.slice(0, count + 1)) <= worst(rest.slice(0, count))) {
      count += 1;
    }
    const row = rest.slice(0, count);
    const total = sum(row);

    if (width >= height) {
      const column = total / height;
      let top = y;
      for (const item of row) {
        const tall = (item.size * scale) / column;
        tiles.push({ ...item, x, y: top, width: column, height: tall });
        top += tall;
      }
      x += column;
      width -= column;
    } else {
      const band = total / width;
      let left = x;
      for (const item of row) {
        const wide = (item.size * scale) / band;
        tiles.push({ ...item, x: left, y, width: wide, height: band });
        left += wide;
      }
      y += band;
      height -= band;
    }
    rest = rest.slice(count);
  }

  return tiles;
}

export interface Sizes {
  all: number;
  exports: { [name: string]: number };
  files: { [name: string]: number };
  typical: { imports: string[]; size: number; files: string[] };
}

/** What the filled tiles add up to inside the full bundle. */
const getTypicalBytes = (sizes: Sizes) =>
  sizes.typical.files.reduce((sum, name) => sum + sizes.files[name], 0);

const fileLabel = (name: string) =>
  name === 'exports' ? 'export list' : name === 'named colors' ? name : `${name}.ts`;

/**
 * The bundle as a treemap, one tile per source file. What a typical app
 * imports sits together on one side, so its share reads as an area.
 */
function layoutTreemap(sizes: Sizes, width: number, height: number) {
  const items = Object.keys(sizes.files).map((name) => ({
    name,
    size: sizes.files[name],
    typical: sizes.typical.files.includes(name),
  }));
  const typical = items.filter((item) => item.typical);
  const rest = items.filter((item) => !item.typical);
  const share = typical.reduce((sum, { size }) => sum + size, 0) / sizes.all;

  return width >= height
    ? squarify(typical, 0, 0, width * share, height).concat(
        squarify(rest, width * share, 0, width * (1 - share), height)
      )
    : squarify(typical, 0, 0, width, height * share).concat(
        squarify(rest, 0, height * share, width, height * (1 - share))
      );
}

function renderTiles(sizes: Sizes, width: number, height: number, className: string) {
  const percent = (value: number, of: number) => `${((value / of) * 100).toFixed(3)}%`;
  const share = getTypicalBytes(sizes) / sizes.all;
  // The tiles most apps import sit together, so one outline goes round them.
  const mark =
    width >= height ? `width:${percent(share, 1)};height:100%` : `width:100%;height:${percent(share, 1)}`;

  return `<div class="map ${className}" style="aspect-ratio:${width}/${height}">
            ${layoutTreemap(sizes, width, height)
              .map((tile) => {
                const style = `left:${percent(tile.x, width)};top:${percent(tile.y, height)};width:${percent(
                  tile.width,
                  width
                )};height:${percent(tile.height, height)}`;
                const label = fileLabel(tile.name);
                const part = `${((tile.size / sizes.all) * 100).toFixed(1)}%`;
                const fits = tile.width >= 84 && tile.height >= 40;
                const roomy = tile.width >= 44 && tile.height >= 44;
                const classes = `tile${tile.typical ? ' tile-typical' : ''}`;
                const inner = fits ? `<b>${label}</b><span>${tile.size} B</span>` : '';

                // Tiles too small to tap are still listed in the table below.
                return roomy
                  ? `<button type="button" class="${classes}" style="${style}" data-tile="${label}, ${tile.size} B, ${part} of the bundle" aria-label="${label}, ${tile.size} bytes, ${part} of the bundle">${inner}</button>`
                  : `<i class="${classes}" style="${style}" title="${label}, ${tile.size} B"></i>`;
              })
              .join('\n            ')}
            <p class="map-mark" style="${mark}"><span>≈2 kB, a typical import</span></p>
          </div>`;
}

export function renderTreemap(sizes: Sizes) {
  return `<figure class="treemap" id="treemap">
          ${renderTiles(sizes, 880, 470, 'map-wide')}
          ${renderTiles(sizes, 358, 560, 'map-tall')}
          <figcaption>
            <p class="map-readout" id="map-readout" role="status">Tap or hover a tile to read it.</p>
            <p class="map-key"><span><i class="tile-typical"></i>A typical import (${sizes.typical.imports.join(', ')}), ${getTypicalBytes(
              sizes
            ).toLocaleString('en-US')} B</span><span><i></i>What tree shaking drops</span></p>
          </figcaption>
        </figure>`;
}

// ---------------------------------------------------------------- themes

export interface Theme {
  key: string;
  name: string;
  about: string;
  codeHtml: string;
  lines: number;
  why: string[];
}

/** A small made-up screen painted with nothing but the theme's tokens. */
function renderSample(theme: Theme) {
  return `<div class="tp tp-${theme.key}">
            <p class="tp-top"><span class="tp-chip">New</span><span class="tp-muted">Muted text</span><i class="tp-extra"></i></p>
            <p class="tp-title">${theme.name}</p>
            <p class="tp-body">Body text sits on the page color, and this is a <span class="tp-link">link</span>.</p>
            <div class="tp-card">
              <p class="tp-card-text">Text on a card</p>
              <p class="tp-field">you@studio.com</p>
              <p class="tp-row"><button type="button" class="tp-btn tp-btn-ghost" data-say="That is a sample button. Nothing was cancelled.">Cancel</button><button type="button" class="tp-btn" data-say="That is a sample button. Nothing was saved.">Save</button></p>
            </div>
          </div>`;
}

export function renderThemes(
  themes: Theme[],
  models: any,
  color: string,
  intro: string,
  closing: string
) {
  return `<section class="prose">${intro}</section>
        ${themes
    .map((theme) => {
      const model = models.demos[`theme-${theme.key}`](color, {}, { bg: '#ffffff', dark: false });
      const slot = (key: string) => `<span data-t="${key}">${escapeHtml(model.text[key])}</span>`;

      return `<section class="fn theme" id="${theme.key}" aria-labelledby="${theme.key}-title">
          <header class="fn-head">
            <h2 id="${theme.key}-title"><a href="#${theme.key}">${theme.name}</a></h2>
            <div class="fn-sum">${theme.about}</div>
          </header>
          <div class="demo demo-theme" data-demo="theme-${theme.key}">
            <div class="theme-top">
              ${renderSample(theme)}
              <div class="theme-side">
                <h3>What it decided about your color</h3>
                <ul class="why">
                  ${theme.why
                    .map(
                      (code, index) =>
                        `<li><p data-t="why${index}">${escapeHtml(model.text[`why${index}`])}</p><code>${escapeHtml(
                          code
                        )}</code></li>`
                    )
                    .join('\n                  ')}
                </ul>
                <p class="ratios">
                  <span>Text ${slot('textRatio')}</span>
                  <span>Button ${slot('buttonRatio')}</span>
                  <span>Chip ${slot('chipRatio')}</span>
                </p>
              </div>
            </div>
            <h3>The fourteen tokens it returned</h3>
            <div class="tokens">
              ${models.TOKENS.map(
                (name: string) =>
                  `<button type="button" class="token" data-k="t-${models.kebab(name)}"><i class="chk"><i style="background:var(--t-${models.kebab(
                    name
                  )})"></i></i><b>${name}</b><code data-t="${name}">${escapeHtml(model.text[name])}</code></button>`
              ).join('\n              ')}
            </div>
            <div class="call">
              <code class="call-in" data-t="code">${escapeHtml(model.text.code)}</code>
            </div>
          </div>
          <details class="more">
            <summary>The whole builder, ${theme.lines} lines</summary>
            ${theme.codeHtml}
          </details>
        </section>`;
    })
    .join('\n        ')}
        <section class="prose">${closing}</section>`;
}

// ------------------------------------------------------------- functions

export interface FunctionEntry {
  doc: DocInfo;
  display: string;
  summary: string;
  descriptionHtml: string;
  signatureHtml: string;
  size: number;
  /** The function's anchor on the old one-page site. */
  legacy?: string;
}

function renderParams(doc: DocInfo, inline: (markdown: string) => string) {
  if (!doc.params.length) return '';

  return `<h3>${doc.kind === 'class' ? 'Constructor parameters' : 'Parameters'}</h3>
            <dl class="params">
              ${doc.params
                .map(
                  ({ name, type, description, rest }) =>
                    `<div><dt><code>${rest ? '...' : ''}${escapeHtml(name)}</code> <code class="type">${escapeHtml(
                      type
                    )}</code></dt><dd>${inline(description)}</dd></div>`
                )
                .join('\n              ')}
            </dl>`;
}

export function renderFunction(
  entry: FunctionEntry,
  models: any,
  color: string,
  inline: (markdown: string) => string
) {
  const { doc } = entry;
  const name = doc.functionName;

  return `<section class="fn" data-fn="${name}" id="${name}" aria-labelledby="${name}-title">
          ${entry.legacy ? `<span id="${entry.legacy}"></span>` : ''}
          <header class="fn-head">
            <h2 id="${name}-title"><a href="#${name}">${name}</a><code>${escapeHtml(
              entry.display.slice(name.length)
            )}</code></h2>
            <p class="fn-sum">${inline(entry.summary)}</p>
          </header>
          <div class="fn-body">
            ${renderDemo(name, { models, color })}
            <div class="ref">
              ${entry.signatureHtml}
              ${entry.descriptionHtml}
              ${renderParams(doc, inline)}
              ${
                doc.kind === 'function'
                  ? `<h3>Returns</h3>
              <p><code class="type">${escapeHtml(doc.returnType)}</code> ${inline(doc.returnsDescription || '')}</p>`
                  : ''
              }
              <p class="ref-foot">
                <span>${formatBytes(entry.size)} imported alone</span>
                <a href="https://github.com/ricokahler/color2k/blob/main/src/${name}.ts">Source</a>
              </p>
            </div>
          </div>
        </section>`;
}

// -------------------------------------------------------------- overview

export interface GroupCard {
  title: string;
  id: string;
  line: string;
  names: string[];
}

const pictures: { [group: string]: (text: { [key: string]: string }) => string } = {
  Parse: (text) =>
    `<span class="pic pic-parse"><code data-t="tuple">${escapeHtml(text.tuple)}</code><span class="pic-bars"><i style="transform:scaleX(var(--r))"></i><i style="transform:scaleX(var(--g))"></i><i style="transform:scaleX(var(--b))"></i><i style="transform:scaleX(var(--a))"></i></span></span>`,
  Convert: (text) =>
    `<span class="pic pic-convert"><code data-t="hex">${escapeHtml(text.hex)}</code><code data-t="rgb">${escapeHtml(
      text.rgb
    )}</code><code data-t="hsl">${escapeHtml(text.hsl)}</code></span>`,
  Adjust: () =>
    `<span class="pic pic-strip chk">${Array.from(
      { length: 7 },
      (_, index) => `<i style="background:var(--a${index})"></i>`
    ).join('')}</span>`,
  Mix: () => '<span class="pic pic-ribbon chk"><i style="background:var(--ribbon)"></i></span>',
  Contrast: () =>
    `<span class="pic pic-strip pic-flip">${Array.from(
      { length: 5 },
      (_, index) => `<i style="background:var(--k${index});color:var(--k${index}-on)">Aa</i>`
    ).join('')}</span>`,
  Utilities: () =>
    '<span class="pic pic-clamp"><i></i><b></b><code>guard(0, 1, 1.3)</code></span>',
};

interface OverviewOptions {
  groups: GroupCard[];
  models: any;
  color: string;
  whyHtml: string;
}

export function renderOverview({ groups, models, color, whyHtml }: OverviewOptions) {
  const model = models.demos.overview(color, {}, { bg: '#ffffff', dark: false });

  return `<section class="band">
          <div class="prose">${whyHtml}</div>
        </section>
        <section class="band" id="functions" aria-labelledby="functions-title">
          <span id="api"></span><span id="table-of-contents"></span>
          <header class="band-head">
            <h2 id="functions-title">Functions</h2>
            <p>Six groups. In each one, every function runs on your color.</p>
          </header>
          <div class="cards" data-demo="overview" style="${escapeHtml(styleOf(model.vars))}">
            ${groups
              .map(
                ({ title, id, line, names }) => `<a class="card card-group" href="#${id}">
              ${pictures[title](model.text)}
              <b>${title}</b>
              <span class="card-line">${line}</span>
              <span class="card-names">${names.map((name) => `<code>${name}</code>`).join(' ')}</span>
              ${icons.arrow}
            </a>`
              )
              .join('\n            ')}
          </div>
        </section>`;
}

// ------------------------------------------------------------------ size

interface SizeOptions {
  sizes: Sizes;
  comparison: Array<{ name: string; size: number }>;
  costsHtml: string;
  othersHtml: string;
  smallHtml: string;
  alternativeHtml: string;
}

export function renderSize({
  sizes,
  comparison,
  costsHtml,
  othersHtml,
  smallHtml,
  alternativeHtml,
}: SizeOptions) {
  const largest = Math.max(...comparison.map(({ size }) => size));
  const files = Object.keys(sizes.files)
    .map((name) => ({ name, size: sizes.files[name] }))
    .sort((a, b) => b.size - a.size);

  return `<section class="band">
          ${renderTreemap(sizes)}
          <p class="note">
            One tile for each source file, sized by the gzipped bytes it adds to the bundle.
            The filled tiles are the files that stay after tree shaking when an app imports
            ${sizes.typical.imports.map((name) => `<code>${name}</code>`).join(', ')}.
            Inside the full bundle those tiles add up to ${getTypicalBytes(sizes).toLocaleString('en-US')} bytes.
            Bundled on their own, the same six imports come to ${sizes.typical.size.toLocaleString(
              'en-US'
            )} bytes, because the bundle then needs its own export list and gzip has less to share.
          </p>
          <details class="more">
            <summary>The same numbers as a table</summary>
            <div class="table-scroll"><table>
              <thead><tr><th scope="col">File</th><th scope="col">Gzipped size it adds</th><th scope="col">Kept by the six imports</th></tr></thead>
              <tbody>
                ${files
                  .map(
                    ({ name, size }) =>
                      `<tr><th scope="row"><code>${fileLabel(name)}</code></th><td>${size} B</td><td>${
                        sizes.typical.files.includes(name) ? 'Yes' : 'No'
                      }</td></tr>`
                  )
                  .join('\n                ')}
              </tbody>
            </table></div>
          </details>
        </section>
        <section class="prose">
          ${smallHtml}
          ${costsHtml}
          ${othersHtml}
          <ul class="bars">
            ${comparison
              .map(
                ({ name, size }) =>
                  `<li${name === 'color2k' ? ' class="bars-us"' : ''}><span>${escapeHtml(name)}</span><b>${size.toFixed(
                    1
                  )} kB</b><i style="--w:${(size / largest).toFixed(3)}"></i></li>`
              )
              .join('\n            ')}
          </ul>
          ${alternativeHtml}
        </section>`;
}
