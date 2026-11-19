// Generates the pictures in README.md, using color2k itself:
//
// - `docs/readme/banner.svg`, the animated banner at the top. Every color in
//   it is computed by color2k and baked into CSS keyframes (no JavaScript).
// - One SVG per `<!-- RESULT: kind expression -->` marker. The expression is
//   evaluated in the scope of the code block above the marker, so each picture
//   is drawn from the values that recipe really produced.
//
// `node scripts/readme-assets.js` rewrites the files and the README markers.
// With `--check` it fails if anything is out of date.
const fs = require('fs');
const path = require('path');
const { color2k: c, getBlocks, root, run } = require('./examples');

const check = process.argv.includes('--check');
const readmePath = path.resolve(root, 'README.md');
const assetDir = path.resolve(root, 'docs/readme');

const SANS =
  "system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO =
  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace";
const INK = '#10131f';
const STRIPES = ['#ff2d6f', '#ff9500', '#ffe100', '#00dcc0', '#6a5cff'];

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const round = (n) => Math.round(n * 10) / 10;

/** Black or white, whichever reads better on `color` over a light backdrop. */
function inkOn(color) {
  const [r, g, b, a] = c.parseToRgba(color);
  const over = (channel) => channel * a + 255 * (1 - a);
  return c.readableColor(c.rgba(over(r), over(g), over(b), 1));
}

function contrastLevel(color, background) {
  if (!c.hasBadContrast(color, 'aaa', background)) return 'AAA';
  if (!c.hasBadContrast(color, 'aa', background)) return 'AA';
  if (!c.hasBadContrast(color, 'readable', background)) return 'AA large';
  return 'fails AA';
}

function slugify(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

// ---------------------------------------------------------------------------
// Recipe results
// ---------------------------------------------------------------------------

function svg(id, width, height, label, body) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(
      label
    )}" font-family="${SANS}">`,
    `<defs><pattern id="${id}-checker" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#fff"/><path d="M0 0h8v8H0zM8 8h8v8H8z" fill="#d5d8e0"/></pattern></defs>`,
    body,
    '</svg>',
    '',
  ].join('\n');
}

/** Lays cells out left to right, wrapping at about the README's width. */
function grid(count, cellWidth, cellHeight, gap = 8, maxWidth = 840) {
  const columns = Math.max(
    1,
    Math.min(count, Math.floor((maxWidth + gap) / (cellWidth + gap)))
  );
  const rows = Math.ceil(count / columns);

  return {
    width: columns * cellWidth + (columns - 1) * gap,
    height: rows * cellHeight + (rows - 1) * gap,
    at: (index) => [
      (index % columns) * (cellWidth + gap),
      Math.floor(index / columns) * (cellHeight + gap),
    ],
  };
}

function swatchRect(id, color, width, height, radius = 10) {
  const transparent = c.parseToRgba(color)[3] < 1;
  return [
    transparent
      ? `<rect width="${width}" height="${height}" rx="${radius}" fill="url(#${id}-checker)"/>`
      : '',
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${radius}" fill="${escapeXml(
      color
    )}" stroke="#808080" stroke-opacity="0.35"/>`,
  ].join('');
}

const renderers = {
  // An object of named colors, or an array of colors.
  swatches(value, id) {
    const items = Array.isArray(value)
      ? value.map((color) => ({ color }))
      : Object.entries(value).map(([label, color]) => ({ label, color }));
    const labelled = items.some(({ label }) => label);
    const cellWidth = Math.max(
      64,
      ...items.map(({ color }) => Math.ceil(String(color).length * 6.7) + 20),
      ...items.map(({ label = '' }) => Math.ceil(label.length * 7.8) + 24)
    );
    const cellHeight = labelled ? 72 : 56;
    const layout = grid(items.length, cellWidth, cellHeight);
    const alt = items
      .map(({ label, color }) => (label ? `${label}: ${color}` : color))
      .join('; ');

    const body = items
      .map(({ label, color }, index) => {
        const [x, y] = layout.at(index);
        const ink = inkOn(color);
        return [
          `<g transform="translate(${x} ${y})">`,
          swatchRect(id, color, cellWidth, cellHeight),
          label
            ? `<text x="10" y="26" font-size="13" font-weight="700" fill="${ink}">${escapeXml(
                label
              )}</text>`
            : '',
          `<text x="10" y="${cellHeight - 14}" font-family="${MONO}" font-size="11" fill="${ink}">${escapeXml(
            color
          )}</text>`,
          '</g>',
        ].join('');
      })
      .join('\n');

    return { alt, svg: svg(id, layout.width, layout.height, alt, body) };
  },

  // An array of `{ color, background, label?, state?, ring? }`: text on a
  // background, annotated with its WCAG contrast ratio.
  samples(value, id) {
    const pad = 6;
    const cellWidth = 196;
    const cellHeight = 84;
    const layout = grid(value.length, cellWidth + pad * 2, cellHeight + pad * 2, 0);
    const described = value.map((item) => {
      for (const color of [item.color, item.background]) {
        if (c.parseToRgba(color)[3] !== 1) {
          throw new Error(
            `${id}: ${color} is see-through, so its contrast depends on what is behind it`
          );
        }
      }
      // A recipe can promise a standard with `passes`; hold it to that.
      if (item.passes && c.hasBadContrast(item.color, item.passes, item.background)) {
        throw new Error(
          `${id}: ${item.color} on ${item.background} does not pass ${item.passes}`
        );
      }
      const ratio = c.getContrast(item.color, item.background).toFixed(2);
      const level = contrastLevel(item.color, item.background);
      return { label: 'Aa Text', ...item, ratio, level };
    });
    const alt = described
      .map(
        ({ label, state, color, background, ratio, level, ring }) =>
          `${label}${state ? ` (${state})` : ''}: ${color} on ${background}, contrast ${ratio}:1 (${level})${
            ring ? `, ring ${ring}` : ''
          }`
      )
      .join('; ');

    const body = described
      .map(({ label, state, color, background, ratio, level, ring }, index) => {
        const [x, y] = layout.at(index);
        return [
          `<g transform="translate(${x + pad} ${y + pad})">`,
          ring
            ? `<rect x="-4" y="-4" width="${cellWidth + 8}" height="${cellHeight + 8}" rx="14" fill="${escapeXml(
                ring
              )}"/>`
            : '',
          swatchRect(id, background, cellWidth, cellHeight),
          `<text x="16" y="38" font-size="20" font-weight="700" fill="${escapeXml(
            color
          )}">${escapeXml(label)}</text>`,
          `<text x="16" y="64" font-family="${MONO}" font-size="11" fill="${inkOn(
            background
          )}" fill-opacity="0.85">${escapeXml(
            [state, `${ratio}:1`, level].filter(Boolean).join(' · ')
          )}</text>`,
          '</g>',
        ].join('');
      })
      .join('\n');

    return { alt, svg: svg(id, layout.width, layout.height, alt, body) };
  },

  // The CSS a styled component resolved to: default, hover and focus states.
  css(value, id) {
    const find = (pattern) => {
      const match = pattern.exec(value);
      if (!match) throw new Error(`Could not read the styles from:\n${value}`);
      return match[1].trim();
    };
    const background = find(/background:\s*([^;]+);/);
    const color = find(/\bcolor:\s*([^;]+);/);
    const hover = find(/:hover\s*{\s*background:\s*([^;]+);/);
    const ring = find(/box-shadow:\s*0 0 0 3px\s*([^;]+);/);

    return renderers.samples(
      [
        { label: 'Save', state: 'default', color, background },
        { label: 'Save', state: 'hover', color, background: hover },
        { label: 'Save', state: 'focus', color, background, ring },
      ],
      id
    );
  },

  // React elements with an inline `style`.
  elements(value, id) {
    return renderers.samples(
      value.map(({ props }) => {
        const ring = /(rgba?\([^)]*\)|hsla?\([^)]*\)|#[0-9a-f]+)\s*$/i.exec(
          props.style.boxShadow || ''
        );
        return {
          label: [].concat(props.children).join(''),
          color: props.style.color,
          background: props.style.background,
          ...(ring ? { ring: ring[1] } : {}),
        };
      }),
      id
    );
  },

  // `{ light, dark, build }`: a theme in both modes, and the function that
  // made it. The function is swept through a few hundred colors first, so the
  // README can promise its text pairs always pass AA.
  theme(value, id) {
    const pairs = [
      ['text', 'bg'],
      ['muted', 'bg'],
      ['onSurface', 'surface'],
      ['onAccent', 'accent'],
      ['onAccent', 'accentHover'],
      ['onSoft', 'soft'],
    ];
    const sweep = [
      'white',
      'black',
      '#808080',
      'gold',
      'tomato',
      '#ffd1e8',
      // See-through picks have to work too.
      'transparent',
      'rgba(255, 143, 184, 0.5)',
      'rgba(0, 0, 0, 0.5)',
      '#0d6efd80',
    ];
    const variants = [[1, 0.5], [0.7, 0.6], [0.5, 0.3], [0.9, 0.85], [0.2, 0.5], [1, 0.15], [0.6, 0.93]];
    for (let hue = 0; hue < 360; hue += 2) {
      for (const [saturation, lightness] of variants) {
        sweep.push(c.toHex(c.hsla(hue, saturation, lightness, 1)));
      }
    }
    for (const color of sweep) {
      for (const dark of [false, true]) {
        const { why, ...tokens } = value.build(color, dark);
        if (!why) throw new Error(`${id}: a theme has to return its decisions as \`why\``);
        Object.values(tokens).forEach((token) => c.parseToRgba(token));
        // A theme that sets links in the accent has to keep it readable.
        const checks = /^serious/i.test(value.build.name)
          ? pairs.concat([['accent', 'bg']])
          : pairs;
        for (const [front, back] of checks) {
          if (c.hasBadContrast(tokens[front], 'aa', tokens[back])) {
            throw new Error(
              `${id}: ${front} on ${back} fails AA for ${color}${dark ? ' (dark)' : ''}`
            );
          }
        }
      }
    }

    const width = 412;
    const height = 168;
    const gap = 16;
    const panel = (tokens, x, name) =>
      [
        `<g transform="translate(${x} 0)">`,
        `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="14" fill="${tokens.bg}" stroke="#808080" stroke-opacity="0.35"/>`,
        `<circle cx="${width - 34}" cy="34" r="14" fill="${tokens.extra}"/>`,
        `<circle cx="${width - 54}" cy="34" r="14" fill="${tokens.accent}"/>`,
        `<text x="20" y="40" font-size="22" font-weight="800" fill="${tokens.text}">${name}</text>`,
        `<text x="20" y="62" font-size="12" fill="${tokens.muted}">Muted text on the background</text>`,
        `<rect x="20" y="78" width="62" height="24" rx="12" fill="${tokens.soft}"/>`,
        `<text x="51" y="94" font-size="11" font-weight="700" text-anchor="middle" fill="${tokens.onSoft}">Chip</text>`,
        `<rect x="20.5" y="114.5" width="${width - 41}" height="38" rx="9" fill="${tokens.surface}" stroke="${tokens.border}"/>`,
        `<text x="34" y="138" font-size="12" font-weight="600" fill="${tokens.onSurface}">Text on a card</text>`,
        `<rect x="${width - 196}" y="118" width="80" height="31" rx="8" fill="${escapeXml(tokens.ring)}"/>`,
        `<rect x="${width - 193}" y="121" width="74" height="25" rx="6" fill="${tokens.accent}"/>`,
        `<text x="${width - 156}" y="138" font-size="11" font-weight="700" text-anchor="middle" fill="${tokens.onAccent}">Focus</text>`,
        `<rect x="${width - 106}" y="121" width="74" height="25" rx="6" fill="${tokens.accentHover}"/>`,
        `<text x="${width - 69}" y="138" font-size="11" font-weight="700" text-anchor="middle" fill="${tokens.onAccent}">Hover</text>`,
        '</g>',
      ].join('');
    const alt = ['light', 'dark']
      .flatMap((mode) =>
        Object.entries(value[mode]).flatMap(([name, token]) =>
          name === 'why'
            ? Object.entries(token).map(
                ([decision, answer]) => `${mode} decision ${decision}: ${answer}`
              )
            : [`${mode} ${name}: ${token}`]
        )
      )
      .join('; ');

    return {
      alt,
      svg: svg(
        id,
        width * 2 + gap,
        height,
        alt,
        panel(value.light, 0, 'Light') + panel(value.dark, width + gap, 'Dark')
      ),
    };
  },

  // An array of `[input, boolean]`.
  checks(value, id) {
    const cellHeight = 44;
    const cellWidth = Math.max(
      ...value.map(([input]) => Math.ceil(String(input).length * 7.3) + 62)
    );
    const layout = grid(value.length, cellWidth, cellHeight);
    const alt = value
      .map(([input, ok]) => `${input}: ${ok ? 'parses' : 'throws'}`)
      .join('; ');

    const body = value
      .map(([input, ok], index) => {
        const [x, y] = layout.at(index);
        const fill = ok ? '#137a52' : '#b3243b';
        return [
          `<g transform="translate(${x} ${y})">`,
          `<rect width="${cellWidth}" height="${cellHeight}" rx="10" fill="${fill}"/>`,
          `<path d="${
            ok ? 'M15 23l5 5 10-11' : 'M16 16l12 12M28 16L16 28'
          }" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
          `<text x="42" y="27" font-family="${MONO}" font-size="12" fill="#fff">${escapeXml(
            input
          )}</text>`,
          '</g>',
        ].join('');
      })
      .join('\n');

    return { alt, svg: svg(id, layout.width, layout.height, alt, body) };
  },
};

const SIZES_START = '<!-- SIZES-START -->';
const SIZES_END = '<!-- SIZES-END -->';

const formatBytes = (bytes) =>
  bytes < 1000 ? `${bytes} B` : `${(bytes / 1000).toFixed(2)} kB`;

/** The "What it costs" table, from the measurements in docs/sizes.json. */
function generateSizes(readme) {
  const start = readme.indexOf(SIZES_START);
  const end = readme.indexOf(SIZES_END);
  if (start === -1 || end < start) throw new Error(`README.md is missing ${SIZES_START}`);

  const sizes = JSON.parse(
    fs.readFileSync(path.resolve(root, 'docs/sizes.json'), 'utf8')
  );
  if ((sizes.all / 1000).toFixed(1) !== '2.5') {
    throw new Error(
      `The bundle is ${formatBytes(sizes.all)} now. Update every "2.5 kB" in the README, website and package.json.`
    );
  }

  const entries = Object.entries(sizes.exports).sort(
    (one, other) => other[1] - one[1] || one[0].localeCompare(other[0])
  );
  const columns = 3;
  const rows = Math.ceil(entries.length / columns);
  const table = [
    `| ${Array(columns).fill('Import | Alone').join(' | ')} |`,
    `| ${Array(columns).fill('--- | ---').join(' | ')} |`,
    ...Array.from({ length: rows }, (_, row) => {
      const cells = Array.from({ length: columns }, (_, column) => {
        const entry = entries[column * rows + row];
        return entry ? `\`${entry[0]}\` | ${formatBytes(entry[1])}` : ' | ';
      });
      return `| ${cells.join(' | ')} |`;
    }),
  ];
  const block = [
    SIZES_START,
    `All ${entries.length} exports together are **${formatBytes(sizes.all)}**, minified and gzipped. Import one and this is what lands in your bundle:`,
    '',
    ...table,
    '',
    `The parser is about ${(sizes.exports.parseToRgba / 1000).toFixed(1)} kB and nearly every function needs it. So the first import costs the most, and each one after it adds very little. \`scripts/sizes.js\` measures these with Rollup, Terser and gzip, and CI fails if they change without the table.`,
    SIZES_END,
  ].join('\n');

  return readme.slice(0, start) + block + readme.slice(end + SIZES_END.length);
}

const RESULT_START = /^<!-- RESULT: (\w+) (.+) -->$/;
const RESULT_END = '<!-- RESULT-END -->';

function generateResults(readme) {
  const blocks = getBlocks(readme);
  const lines = readme.split('\n');
  const files = {};
  const output = [];
  const seen = new Map();
  let heading = 'result';

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const headingMatch = /^#{2,3} (.+)$/.exec(line);
    if (headingMatch) heading = headingMatch[1];

    const match = RESULT_START.exec(line);
    if (!match) {
      output.push(line);
      continue;
    }

    const end = lines.indexOf(RESULT_END, index);
    const block = blocks.filter((candidate) => candidate.end < index).pop();
    const [, kind, expression] = match;

    if (end === -1) throw new Error(`README.md:${index + 1} has no ${RESULT_END}`);
    if (!renderers[kind]) throw new Error(`README.md:${index + 1} unknown result kind "${kind}"`);
    if (!block) throw new Error(`README.md:${index + 1} has no code block above it`);

    const count = (seen.get(heading) || 0) + 1;
    seen.set(heading, count);
    const id = slugify(heading) + (count > 1 ? `-${count}` : '');
    const { captured } = run(block, { capture: expression });
    const result = renderers[kind](captured, id);
    const width = /width="(\d+)"/.exec(result.svg)[1];

    files[`${id}.svg`] = result.svg;
    output.push(
      line,
      `<p><img src="https://raw.githubusercontent.com/ricokahler/color2k/main/docs/readme/${id}.svg" width="${width}" alt="${escapeXml(
        result.alt
      )}" /></p>`,
      RESULT_END
    );
    index = end;
  }

  return { files, readme: output.join('\n') };
}

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

const BANNER_SECONDS = 24;
const BANNER_STEPS = 12;

/** The banner's color at a point in its loop, from 0 to 1. */
function bannerColor(position) {
  return c.toHex(
    c.hsla(
      (232 + position * 360) % 360,
      0.82,
      0.56 + 0.2 * Math.sin(position * 4 * Math.PI),
      1
    )
  );
}

/** One row of the banner's palette per function, nine cells each. */
const BANNER_ROWS = [
  ['getScale', (x, i) => c.getScale('#fff', x, '#000')((i + 1) / 10)],
  ['lighten', (x, i) => c.lighten(x, (8 - i) * 0.045)],
  ['darken', (x, i) => c.darken(x, i * 0.045)],
  ['desaturate', (x, i) => c.desaturate(x, i * 0.1)],
  ['adjustHue', (x, i) => c.adjustHue(x, i * 40)],
  ['mix', (x, i) => c.mix(x, 'gold', i / 8)],
  ['transparentize', (x, i) => c.transparentize(x, i / 9)],
];

function generateBanner() {
  const width = 1200;
  const height = 440;
  const positions = Array.from(
    { length: BANNER_STEPS + 1 },
    (_, step) => step / BANNER_STEPS
  );
  const keyframes = [];
  const rules = [];
  const percent = (position) => `${round(position * 100)}%`;

  const animate = (name, colors, selector) => {
    keyframes.push(
      `@keyframes ${name}{${colors
        .map((color, step) => `${percent(positions[step])}{fill:${color}}`)
        .join('')}}`
    );
    rules.push(`${selector}{animation:${name} ${BANNER_SECONDS}s linear infinite}`);
  };

  // The big swatch.
  const bases = positions.map(bannerColor);
  animate('base', bases, '.base');

  // The palette grid.
  const gridX = 764;
  const gridY = 168;
  const cellWidth = 38;
  const cellHeight = 24;
  const gap = 6;
  const cells = [];

  BANNER_ROWS.forEach(([label, cell], row) => {
    const y = gridY + row * (cellHeight + gap);
    cells.push(
      `<text x="${gridX - 16}" y="${y + 17}" text-anchor="end" font-family="${MONO}" font-size="14" fill="#a2a9bd">${label}</text>`
    );

    for (let column = 0; column < 9; column++) {
      const name = `c${row}${column}`;
      const colors = bases.map((base) => {
        const color = cell(base, column);
        const [r, g, b, a] = c.parseToRgba(color);
        return a < 1 ? `rgba(${r},${g},${b},${round(a * 100) / 100})` : c.toHex(color);
      });
      const x = gridX + column * (cellWidth + gap);

      animate(name, colors, `.${name}`);
      cells.push(
        `<rect class="${name}" x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" rx="5" fill="${colors[0]}"/>`
      );
    }
  });

  // Text that flips between black and white, and a contrast ratio that keeps
  // up. The browser fades the swatch in a straight line between keyframes, so
  // work out the color it really shows at any moment, then switch the text at
  // the moments that keep it at 4.5:1 or better all the way around the loop.
  const channels = bases.map((base) => c.parseToRgba(base));
  const shown = (position) => {
    const at = Math.min(position, 1) * BANNER_STEPS;
    const step = Math.min(Math.floor(at), BANNER_STEPS - 1);
    const blend = (channel) =>
      channels[step][channel] +
      (channels[step + 1][channel] - channels[step][channel]) * (at - step);
    return c.rgba(blend(0), blend(1), blend(2), 1);
  };
  const SLICES = BANNER_SECONDS * 50;
  const inks = Array.from({ length: SLICES }, (_, slice) => {
    const ends = [shown(slice / SLICES), shown((slice + 1) / SLICES)];
    const [contrast, ink] = ['#000', '#fff']
      .map((candidate) => [
        Math.min(...ends.map((end) => c.getContrast(end, candidate))),
        candidate,
      ])
      .sort((one, other) => other[0] - one[0])[0];

    if (contrast < 4.5) {
      throw new Error(
        `Banner text drops to ${contrast.toFixed(2)}:1 at ${((slice / SLICES) * BANNER_SECONDS).toFixed(2)}s`
      );
    }

    return ink;
  });
  const inkAt = (position) => inks[Math.min(Math.floor(position * SLICES), SLICES - 1)];
  const flips = inks
    .map((ink, slice) => ({ ink, slice }))
    .filter(({ ink, slice }) => slice === 0 || ink !== inks[slice - 1]);

  const samples = Array.from({ length: BANNER_SECONDS }, (_, second) => {
    const position = (second + 0.5) / BANNER_SECONDS;
    const base = shown(position);
    const readable = inkAt(position);
    const level = contrastLevel(readable, base);
    return {
      readable,
      text: `${c.getContrast(base, readable).toFixed(2)}:1 ${level}`,
    };
  });

  keyframes.push(
    `@keyframes ink{${flips
      .map(
        ({ ink, slice }) =>
          `${Math.round((slice / SLICES) * 1e5) / 1e3}%{fill:${ink}}`
      )
      .join('')}}`,
    `@keyframes show{0%{opacity:1}${percent(1 / BANNER_SECONDS)}{opacity:0}100%{opacity:0}}`
  );
  rules.push(
    `.ink{animation:ink ${BANNER_SECONDS}s step-end infinite}`,
    `.ratio{opacity:0;animation:show ${BANNER_SECONDS}s step-end infinite}`,
    ...samples.map((_, second) => `.r${second}{animation-delay:${second}s}`),
    '@media (prefers-reduced-motion:reduce){*{animation:none!important}.r0{opacity:1}}'
  );

  const logo = fs
    .readFileSync(path.resolve(root, 'website/static/logo.svg'), 'utf8')
    .replace(/^<svg[^>]*>/, '')
    .replace(/<title[^>]*>.*?<\/title>/, '')
    .replace(/<\/svg>\s*$/, '');
  const label =
    'color2k. Fully dynamic colors in 2.5 kB. A palette computed by color2k drifts around the color wheel.';
  const [, logoWidth, logoHeight] = /viewBox="0 0 (\d+) (\d+)"/.exec(
    fs.readFileSync(path.resolve(root, 'website/static/logo.svg'), 'utf8')
  );

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(
      label
    )}" font-family="${SANS}">`,
    `<style>${keyframes.join('')}${rules.join('')}</style>`,
    '<defs>',
    `<clipPath id="card"><rect width="${width}" height="${height}" rx="28"/></clipPath>`,
    '<radialGradient id="glow1" cx="0.9" cy="-0.1" r="0.8"><stop offset="0" stop-color="#6a5cff" stop-opacity="0.5"/><stop offset="1" stop-color="#6a5cff" stop-opacity="0"/></radialGradient>',
    '<radialGradient id="glow2" cx="0" cy="1.1" r="0.7"><stop offset="0" stop-color="#ff2d6f" stop-opacity="0.3"/><stop offset="1" stop-color="#ff2d6f" stop-opacity="0"/></radialGradient>',
    '</defs>',
    '<g clip-path="url(#card)">',
    `<rect width="${width}" height="${height}" fill="${INK}"/>`,
    `<rect width="${width}" height="${height}" fill="url(#glow1)"/>`,
    `<rect width="${width}" height="${height}" fill="url(#glow2)"/>`,
    ...STRIPES.map(
      (stripe, index) =>
        `<rect x="${(index * width) / 5}" y="${height - 12}" width="${width / 5}" height="12" fill="${stripe}"/>`
    ),
    '</g>',
    `<svg x="46" y="48" width="430" height="${Math.round(
      (430 * logoHeight) / logoWidth
    )}" viewBox="0 0 ${logoWidth} ${logoHeight}">${logo}</svg>`,
    '<text x="60" y="228" font-size="35" font-weight="800" letter-spacing="-0.6" fill="#fff">Fully dynamic colors</text>',
    '<text x="60" y="272" font-size="35" font-weight="800" letter-spacing="-0.6" fill="#fff">in 2.5 kB.</text>',
    '<rect x="60" y="312" width="212" height="50" rx="11" fill="#fff" fill-opacity="0.08" stroke="#fff" stroke-opacity="0.2"/>',
    `<text x="80" y="343" font-family="${MONO}" font-size="18" fill="#fff"><tspan fill="#8d94aa">$ </tspan>npm i color2k</text>`,
    '<text x="296" y="343" font-size="17" fill="#a2a9bd">No dependencies</text>',
    `<rect class="base" x="632" y="52" width="522" height="92" rx="14" fill="${bases[0]}"/>`,
    `<text class="ink" x="656" y="96" font-size="26" font-weight="800" letter-spacing="-0.4" fill="${inks[0]}">Always readable</text>`,
    `<text class="ink" x="656" y="123" font-family="${MONO}" font-size="14" fill="${inks[0]}">readableColor(background)</text>`,
    ...samples.map(
      ({ text }, second) =>
        `<text class="ink ratio r${second}" x="1132" y="106" text-anchor="end" font-family="${MONO}" font-size="17" font-weight="700" fill="${inks[0]}">${text}</text>`
    ),
    ...cells,
    '</svg>',
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------

function main() {
  if (!fs.existsSync(path.resolve(root, 'dist'))) {
    throw new Error('Run `npm run build` first: the README pictures use dist.');
  }

  const current = fs.readFileSync(readmePath, 'utf8');
  const { files, readme } = generateResults(generateSizes(current));
  files['banner.svg'] = generateBanner();

  const existing = fs.existsSync(assetDir) ? fs.readdirSync(assetDir) : [];
  const stale = [
    ...(readme === current ? [] : ['README.md']),
    ...Object.keys(files).filter(
      (file) =>
        !existing.includes(file) ||
        fs.readFileSync(path.resolve(assetDir, file), 'utf8') !== files[file]
    ),
    ...existing.filter((file) => !(file in files)),
  ];

  if (check) {
    if (stale.length) {
      throw new Error(
        `README pictures are out of date (${stale.join(', ')}). Run \`npm run docs:generate\`.`
      );
    }
    console.log(
      `README pictures are up to date: banner and ${Object.keys(files).length - 1} recipe results.`
    );
    return;
  }

  fs.mkdirSync(assetDir, { recursive: true });
  for (const file of existing) {
    if (!(file in files)) fs.unlinkSync(path.resolve(assetDir, file));
  }
  for (const [file, contents] of Object.entries(files)) {
    fs.writeFileSync(path.resolve(assetDir, file), contents);
  }
  fs.writeFileSync(readmePath, readme);
  console.log(`Wrote ${Object.keys(files).length} README pictures.`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
