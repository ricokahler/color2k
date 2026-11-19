import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import template from './template';
import {
  generateLlmsFullTxt,
  generateLlmsTxt,
  generateReadme,
  getAllDocs,
  getDisplayName,
  getGroupedDocs,
  getReadmeBody,
  RESULT_PATTERN,
  slugify,
} from './docs';
import * as color2k from '../src';

const showcase = require('./showcase');

const MarkdownIt = require('markdown-it');

interface Heading {
  slug: string;
  title: string;
  level: number;
}

const { minify } = require('terser');

// The color the page opens on, and the favorites next to the picker.
const STUDIO_COLOR = '#ff8fb8';
const STUDIO_PRESETS = [
  { name: 'Blush', color: '#ff8fb8' },
  { name: 'Lilac', color: '#b69cff' },
  { name: 'Butter', color: '#ffd966' },
  { name: 'Mint', color: '#6fe0c0' },
  { name: 'Sky', color: '#6cb8ff' },
  { name: 'Tomato', color: 'tomato' },
  { name: 'Ink', color: '#1f2a44' },
];
const THEMES = [
  {
    key: 'soft',
    name: 'Soft',
    builder: 'softTheme',
    how: 'One hue, many lightnesses. The page reads as a single pastel wash, and the second color is its neighbor on the wheel.',
    uses: ['hsla', 'mix', 'adjustHue'],
  },
  {
    key: 'serious',
    name: 'Serious',
    builder: 'seriousTheme',
    how: 'Grays that keep 8% of your hue, so the page feels like yours without shouting. The color shows up once, on the button.',
    uses: ['desaturate', 'readableColor', 'transparentize'],
  },
  {
    key: 'bold',
    name: 'Bold',
    builder: 'boldTheme',
    how: 'Your color is the page. Text is black or white, whichever reads, and the button comes from the far side of the wheel.',
    uses: ['saturate', 'adjustHue', 'readableColor'],
  },
];
const FIELD_COLUMNS = 24;

function repoPath(...parts: string[]) {
  return path.resolve(__dirname, '..', ...parts);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createSlugger() {
  const seen = new Map<string, number>();

  return (title: string) => {
    const base = slugify(title);
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

function getHeadingTitle(token: any) {
  return (token.children || [])
    .map((child: { content?: string }) => child.content || '')
    .join('');
}

function getLanguage(lang: string) {
  const normalized = (lang || 'text').trim().toLowerCase();
  const aliases: { [name: string]: string } = {
    js: 'javascript',
    jsx: 'jsx',
    shell: 'bash',
    sh: 'bash',
    ts: 'typescript',
  };

  return aliases[normalized] || normalized || 'text';
}

// A few of the themes' colors are too faint for our backgrounds (below 4.5:1),
// including the comment gray, and comments are where examples show results.
const colorReplacements = {
  'github-light': {
    '#6a737d': '#59616e',
    '#d73a49': '#c2273a',
    '#22863a': '#1a6f2e',
    '#e36209': '#b34e04',
  },
  'github-dark': { '#6a737d': '#9aa3b2' },
};

async function renderMarkdown(markdown: string) {
  const { createHighlighter } = await import('shiki');
  const highlighter = await createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: [
      'bash',
      'html',
      'javascript',
      'json',
      'jsx',
      'shellscript',
      'text',
      'tsx',
      'typescript',
    ],
  });
  const slug = createSlugger();
  const headingQueue: Heading[] = [];
  const headings: Heading[] = [];
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
    highlight(code: string, lang: string) {
      const language = getLanguage(lang);

      try {
        return highlighter.codeToHtml(code, {
          lang: language,
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultColor: false,
          colorReplacements,
        });
      } catch {
        return `<pre><code>${escapeHtml(code)}</code></pre>`;
      }
    },
  });

  const defaultHeadingOpen =
    md.renderer.rules.heading_open ||
    ((tokens: any[], idx: number, options: object, env: object, self: any) =>
      self.renderToken(tokens, idx, options));
  const defaultHeadingClose =
    md.renderer.rules.heading_close ||
    ((tokens: any[], idx: number, options: object, env: object, self: any) =>
      self.renderToken(tokens, idx, options));

  md.renderer.rules.heading_open = (
    tokens: any[],
    idx: number,
    options: object,
    env: object,
    self: any
  ) => {
    const title = getHeadingTitle(tokens[idx + 1]);
    const id = slug(title);
    tokens[idx].attrSet('id', id);
    const heading = { slug: id, title, level: Number(tokens[idx].tag.slice(1)) };
    headingQueue.push(heading);
    headings.push(heading);
    return defaultHeadingOpen(tokens, idx, options, env, self);
  };

  md.renderer.rules.heading_close = (
    tokens: any[],
    idx: number,
    options: object,
    env: object,
    self: any
  ) => {
    const heading = headingQueue.shift();
    const anchor = heading
      ? `<a class="heading-anchor" href="#${heading.slug}" aria-label="Permalink to ${escapeHtml(
          heading.title
        )}">#</a>`
      : '';
    return `${anchor}${defaultHeadingClose(tokens, idx, options, env, self)}`;
  };

  // Wide tables scroll inside their own box instead of widening the page.
  md.renderer.rules.table_open = () => '<div class="table-scroll"><table>\n';
  md.renderer.rules.table_close = () => '</table></div>\n';

  // The theme code on the home page sits on dark cards in both color schemes.
  const highlight = (code: string) =>
    highlighter.codeToHtml(code, {
      lang: 'javascript',
      theme: 'github-dark',
      colorReplacements,
    }) as string;

  return { html: md.render(markdown) as string, headings, highlight };
}

/** Sections, with the recipes and API entries nested under theirs. */
function getToc(headings: Heading[]) {
  const toc: Array<Heading & { children: Heading[] }> = [];

  for (const heading of headings) {
    if (heading.level === 2) {
      toc.push({ ...heading, children: [] });
    } else if (heading.level === 3 && toc.length) {
      toc[toc.length - 1].children.push({
        ...heading,
        // `darken(color, amount)` is listed as `darken`.
        title: heading.title.replace(/\(.*\)$/, ''),
      });
    }
  }

  return toc;
}

/**
 * Each recipe's result, drawn by `scripts/readme-assets.js` from the recipe's
 * own code. The README links to the SVG; the site inlines it under the code.
 */
function inlineResults(markdown: string) {
  return markdown.replace(RESULT_PATTERN, (match, file: string) => {
    const svg = fs
      .readFileSync(repoPath('docs/readme', file), { encoding: 'utf8' })
      .trim();
    return `<figure class="result">${svg}</figure>`;
  });
}

/**
 * Netlify's `_headers` file. Scripts may only come from this site and nothing
 * loads from anywhere else. Deploy previews also allow the toolbar Netlify
 * adds to them; production frames nothing.
 */
function getHeaders() {
  const isPreview = process.env.CONTEXT === 'deploy-preview';
  const policy = [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'unsafe-inline'",
    "img-src 'self' data:",
    "manifest-src 'self'",
    ...(isPreview ? ['frame-src https://app.netlify.com'] : []),
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ');

  return [
    '/*',
    `  Content-Security-Policy: ${policy}`,
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    ...['/llms.txt', '/llms-full.txt'].flatMap((file) => [
      file,
      '  Content-Type: text/plain; charset=utf-8',
      '  Access-Control-Allow-Origin: *',
    ]),
    '',
  ].join('\n');
}

/**
 * The theme builders, lifted out of the README recipes that define them. The
 * site shows this exact text and runs it, so the page, the README and the
 * tests are all looking at one piece of code.
 */
function getThemeSources(readme: string) {
  return THEMES.map((theme) => {
    const match = new RegExp(
      `^function ${theme.builder}\\([\\s\\S]*?^}$`,
      'm'
    ).exec(readme);
    if (!match) throw new Error(`README.md has no ${theme.builder} recipe`);
    return { ...theme, source: match[0] };
  });
}

/** `var darken = color2k.darken, ...` for code written with imports. */
const scope = `var ${Object.keys(color2k)
  .map((name) => `${name} = color2k.${name}`)
  .join(', ')};`;

function buildTheme(source: string, builder: string) {
  return new Function('color2k', `${scope}\n${source}\nreturn ${builder};`)(
    color2k
  ) as (color: string, dark?: boolean) => { [token: string]: string };
}

async function minifyScript(code: string) {
  const result = await minify(code, { compress: { passes: 2 }, mangle: true });
  return `${result.code}\n`;
}

/** The page's script: the themes, the demos, and one call to start them. */
function getSiteScript(themes: Array<{ key: string; builder: string; source: string }>) {
  const showcaseSource = fs
    .readFileSync(path.resolve(__dirname, './showcase.js'), {
      encoding: 'utf8',
    })
    .replace(/\nif \(typeof module[^\n]*\n?$/, '\n');

  return minifyScript(
    [
      '(function () {',
      scope,
      ...themes.map(({ source }) => source),
      showcaseSource,
      `showcase.start(color2k, { ${themes
        .map(({ key, builder }) => `${key}: ${builder}`)
        .join(', ')} });`,
      '})();',
    ].join('\n')
  );
}

/** The UMD build, minified, served as `/color2k.js`. It runs the whole page. */
function getBrowserBundle() {
  const bundle = repoPath('dist/index.unpkg.umd.js');
  if (!fs.existsSync(bundle)) {
    execFileSync(repoPath('scripts/build'), { cwd: repoPath(), stdio: 'inherit' });
  }
  return minifyScript(
    fs
      .readFileSync(bundle, { encoding: 'utf8' })
      .replace(/\n\/\/# sourceMappingURL=.*\n?$/, '\n')
  );
}

/** The "Next to the others" table in the README, as numbers. */
function getComparison(readme: string) {
  const start = readme.indexOf('### Next to the others');
  const rows = Array.from(
    readme
      .slice(start, readme.indexOf('\n## ', start))
      .matchAll(/^\| (.+?) \| .*?([\d.]+) kB.*\|$/gm),
    ([, label, size]) => ({
      name: label.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*/g, ''),
      size: Number(size),
    })
  );
  if (rows.length < 4) throw new Error('Could not read the size comparison');
  return rows;
}

const formatBytes = (bytes: number) =>
  bytes < 1000 ? `${bytes} B` : `${(bytes / 1000).toFixed(2)} kB`;

function getStructuredData() {
  const pkg = JSON.parse(
    fs.readFileSync(repoPath('package.json'), { encoding: 'utf8' })
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: pkg.name,
    description: pkg.description,
    keywords: pkg.keywords.join(', '),
    author: {
      '@type': 'Person',
      name: 'Rico Kahler',
      url: 'https://rico.codes',
    },
    codeRepository: pkg.repository.url.replace(/^git\+/, ''),
    programmingLanguage: 'TypeScript',
    runtimePlatform: 'JavaScript',
    license: 'https://github.com/ricokahler/color2k/blob/main/LICENSE',
    url: 'https://color2k.com/',
    sameAs: [
      'https://www.npmjs.com/package/color2k',
      'https://github.com/ricokahler/color2k',
      'https://rico.codes',
    ],
  };
}

async function render() {
  await generateReadme();

  const readme = fs.readFileSync(repoPath('README.md'), {
    encoding: 'utf8',
  });
  const css = fs.readFileSync(path.resolve(__dirname, './App.css'), {
    encoding: 'utf8',
  });
  const pkg = JSON.parse(
    fs.readFileSync(repoPath('package.json'), { encoding: 'utf8' })
  );
  // The README's logo and badges are for GitHub and npm; the site has a hero.
  const { html: bodyHtml, headings, highlight } = await renderMarkdown(
    inlineResults(getReadmeBody(readme))
  );
  const groups = getGroupedDocs();
  const sizes = JSON.parse(
    fs.readFileSync(repoPath('docs/sizes.json'), { encoding: 'utf8' })
  );
  const themes = getThemeSources(readme);
  const browserBundle = await getBrowserBundle();
  const buildFolder = repoPath('build');

  await fs.promises.rm(buildFolder, { recursive: true, force: true });
  await fs.promises.mkdir(buildFolder, { recursive: true });

  const write = (file: string, contents: string) =>
    fs.promises.writeFile(path.resolve(buildFolder, file), contents);

  await write(
    'index.html',
    template({
      bodyHtml,
      chip: showcase.heroChip(color2k),
      comparison: getComparison(readme),
      css,
      description: pkg.description,
      exportCount: getAllDocs().length,
      fieldColumns: FIELD_COLUMNS,
      fieldRows: showcase.fieldRows(),
      fieldSvg: showcase.fieldSvg(color2k, FIELD_COLUMNS),
      galleryGroups: groups.map(({ title }) => title),
      galleryHtml: showcase.galleryHtml(
        color2k,
        groups.map(({ title, docs }) => ({
          title,
          items: docs.map((doc) => ({
            name: doc.functionName,
            link: `#${slugify(getDisplayName(doc))}`,
            size: formatBytes(sizes.exports[doc.functionName]),
          })),
        })),
        STUDIO_COLOR
      ),
      sizes: {
        all: formatBytes(sizes.all),
        bytes: sizes.all.toLocaleString('en-US'),
        rounded: (sizes.all / 1000).toFixed(1),
        exports: Object.entries(sizes.exports as { [name: string]: number })
          .sort((one, other) => other[1] - one[1])
          .map(([name, bytes]) => ({ name, size: formatBytes(bytes) })),
      },
      structuredData: getStructuredData(),
      studioColor: STUDIO_COLOR,
      studioPresets: STUDIO_PRESETS,
      themes: themes.map((theme) => {
        const build = buildTheme(theme.source, theme.builder);
        const light = build(STUDIO_COLOR, false);
        return {
          ...theme,
          codeHtml: highlight(theme.source),
          lightStyle: showcase.tokenStyle(light),
          darkStyle: showcase.tokenStyle(build(STUDIO_COLOR, true)),
          ratios: showcase.themeRatios(color2k, light),
          tokens: Object.keys(light),
        };
      }),
      toc: getToc(headings),
    })
  );
  await write('_headers', getHeaders());
  await write('color2k.js', browserBundle);
  await write('site.js', await getSiteScript(themes));
  await write('llms.txt', generateLlmsTxt(readme, pkg));
  await write('llms-full.txt', generateLlmsFullTxt(readme, pkg));

  await write(
    'robots.txt',
    ['User-agent: *', 'Allow: /', '', 'Sitemap: https://color2k.com/sitemap.xml', ''].join('\n')
  );

  await write(
    'sitemap.xml',
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...['', 'llms.txt', 'llms-full.txt'].flatMap((page) => [
        '  <url>',
        `    <loc>https://color2k.com/${page}</loc>`,
        '  </url>',
      ]),
      '</urlset>',
      '',
    ].join('\n')
  );

  const staticFiles = await fs.promises.readdir(
    path.resolve(__dirname, './static')
  );

  for (const staticFile of staticFiles) {
    await fs.promises.copyFile(
      path.resolve(__dirname, `./static/${staticFile}`),
      path.resolve(buildFolder, staticFile)
    );
  }
}

export default render;
