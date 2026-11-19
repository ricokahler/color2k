import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { NavGroup, Page, renderHero, shell } from './template';
import { escapeHtml, styleOf } from './demos';
import {
  FunctionEntry,
  renderFunction,
  renderOverview,
  renderSize,
  renderThemes,
  renderThemeTeaser,
  renderTreemap,
  Sizes,
  Theme,
} from './pages';
import {
  API_DOCS_START,
  generateLlmsFullTxt,
  generateLlmsTxt,
  generateReadme,
  getAllDocs,
  getDisplayName,
  getFunctionUrl,
  getGroupedDocs,
  getReadmeBody,
  getSummary,
  RESULT_PATTERN,
  slugify,
} from './docs';
import * as color2k from '../src';

const createModels = require('./models');
const MarkdownIt = require('markdown-it');
const { minify } = require('terser');

const THEMES = [
  { key: 'soft', name: 'Soft', builder: 'softTheme' },
  { key: 'serious', name: 'Serious', builder: 'seriousTheme' },
  { key: 'bold', name: 'Bold', builder: 'boldTheme' },
];

// What each group is for, in a line, on its card and at the top of its page.
const GROUP_LINES: { [title: string]: [string, string] } = {
  Parse: [
    'Read a color string into numbers.',
    'Two functions that read a color string into numbers. Everything else in color2k starts here.',
  ],
  Convert: [
    'Write a color as hex, rgb or hsl.',
    'Write a color in another format, or build one from numbers.',
  ],
  Adjust: [
    'Lighten, darken, fade or turn the hue.',
    'Each of these moves one channel of your color and leaves the others alone.',
  ],
  Mix: [
    'Blend two colors, or draw a scale through many.',
    'Blend two colors, or draw a scale through as many as you like.',
  ],
  Contrast: [
    'Measure contrast and pick text that reads.',
    'Measure how well two colors read together, and pick text that works.',
  ],
  Utilities: [
    'A clamp, and the error color2k throws.',
    'The clamp color2k uses inside, and the error it throws when it cannot read a color.',
  ],
};

function repoPath(...parts: string[]) {
  return path.resolve(__dirname, '..', ...parts);
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

interface Heading {
  slug: string;
  title: string;
  level: number;
}

async function createRenderer() {
  const { createHighlighter } = await import('shiki');
  const highlighter = await createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: ['bash', 'html', 'javascript', 'json', 'jsx', 'shellscript', 'text', 'tsx', 'typescript'],
  });
  let seen = new Map<string, number>();
  let headings: Heading[] = [];
  let queue: Heading[] = [];

  const highlight = (code: string, lang: string) => {
    try {
      return highlighter.codeToHtml(code, {
        lang: getLanguage(lang),
        themes: { light: 'github-light', dark: 'github-dark' },
        defaultColor: false,
        colorReplacements,
      }) as string;
    } catch {
      return `<pre><code>${escapeHtml(code)}</code></pre>`;
    }
  };
  const md = new MarkdownIt({ html: true, linkify: true, typographer: false, highlight });
  const renderToken = (tokens: any[], idx: number, options: object, env: object, self: any) =>
    self.renderToken(tokens, idx, options);

  md.renderer.rules.heading_open = (tokens: any[], idx: number, ...rest: [object, object, any]) => {
    const title = (tokens[idx + 1].children || [])
      .map((child: { content?: string }) => child.content || '')
      .join('');
    const base = slugify(title);
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    const heading = {
      slug: count === 0 ? base : `${base}-${count}`,
      title,
      level: Number(tokens[idx].tag.slice(1)),
    };
    tokens[idx].attrSet('id', heading.slug);
    queue.push(heading);
    headings.push(heading);
    return renderToken(tokens, idx, ...rest);
  };
  md.renderer.rules.heading_close = (tokens: any[], idx: number, ...rest: [object, object, any]) => {
    const heading = queue.shift();
    const anchor = heading
      ? `<a class="heading-anchor" href="#${heading.slug}" aria-label="Permalink to ${escapeHtml(
          heading.title
        )}">#</a>`
      : '';
    return `${anchor}${renderToken(tokens, idx, ...rest)}`;
  };
  // Wide tables scroll inside their own box instead of widening the page.
  md.renderer.rules.table_open = () => '<div class="table-scroll"><table>\n';
  md.renderer.rules.table_close = () => '</table></div>\n';

  return {
    highlight,
    inline: (markdown: string) => md.renderInline(markdown) as string,
    /** One page's worth of Markdown. Heading anchors start over each time. */
    render(markdown: string) {
      seen = new Map();
      headings = [];
      queue = [];
      return { html: md.render(markdown) as string, headings };
    },
  };
}

/**
 * Each recipe's result, drawn by `scripts/readme-assets.js` from the recipe's
 * own code. The README links to the SVG; the site inlines it under the code.
 */
function inlineResults(markdown: string) {
  return markdown.replace(RESULT_PATTERN, (match, file: string) => {
    const svg = fs.readFileSync(repoPath('docs/readme', file), { encoding: 'utf8' }).trim();
    return `<figure class="result">${svg}</figure>`;
  });
}

/** A doc comment without its first sentence, which is shown as the summary. */
function afterSummary(description: string) {
  const first = description.split(/\n\s*\n/)[0];
  const end = first.search(/\.(\s|$)/);
  return description.slice(end === -1 ? first.length : end + 1).trim();
}

/** Runs `change` on every line that is not inside a code fence. */
function outsideFences(markdown: string, change: (line: string) => string) {
  let fenced = false;
  return markdown
    .split('\n')
    .map((line) => {
      if (/^```/.test(line)) {
        fenced = !fenced;
        return line;
      }
      return fenced ? line : change(line);
    })
    .join('\n');
}

/** `### Title` becomes `## Title`, for a README section that is now a page. */
const promote = (markdown: string) =>
  outsideFences(markdown, (line) => line.replace(/^#(#+ )/, '$1'));

/** Splits Markdown at headings of one level: `{ title: body }`, in order. */
function splitAt(markdown: string, level: number) {
  const sections = new Map<string, string>();
  const marker = `${'#'.repeat(level)} `;
  let title = '';
  let lines: string[] = [];
  let fenced = false;

  for (const line of markdown.split('\n')) {
    if (/^```/.test(line)) fenced = !fenced;
    if (!fenced && line.startsWith(marker)) {
      sections.set(title, lines.join('\n').trim());
      title = line.slice(marker.length).trim();
      lines = [];
    } else {
      lines.push(line);
    }
  }
  sections.set(title, lines.join('\n').trim());
  return sections;
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
    "font-src 'self'",
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

/** `var darken = color2k.darken, ...` for code written with imports. */
const scope = `var ${Object.keys(color2k)
  .map((name) => `${name} = color2k.${name}`)
  .join(', ')};`;

type Builder = (color: string, dark?: boolean) => { [token: string]: any };

/**
 * The theme builders, lifted out of the README recipes that define them. The
 * site shows this exact text and runs it, so the page, the README and the
 * tests are all looking at one piece of code.
 */
function getThemeSources(recipe: string) {
  return THEMES.map((theme) => {
    const source = new RegExp(`^function ${theme.builder}\\([\\s\\S]*?^}$`, 'm').exec(recipe);
    const about = new RegExp(`^\\*\\*${theme.name}\\*\\* .+$`, 'm').exec(recipe);
    if (!source || !about) throw new Error(`README.md has no ${theme.builder} recipe`);
    return {
      ...theme,
      about: about[0],
      source: source[0],
      build: new Function('color2k', `${scope}\n${source[0]}\nreturn ${theme.builder};`)(
        color2k
      ) as Builder,
    };
  });
}

async function minifyScript(code: string) {
  const result = await minify(code, { compress: { passes: 2 }, mangle: true });
  return `${result.code}\n`;
}

const readSource = (file: string) =>
  fs
    .readFileSync(path.resolve(__dirname, file), { encoding: 'utf8' })
    .replace(/\nif \(typeof module[^\n]*\n?$/, '\n');

/** The page's script: the themes, the models, and the code that runs them. */
function getSiteScript(themes: Array<{ key: string; builder: string; source: string }>) {
  return minifyScript(
    [
      '(function () {',
      scope,
      ...themes.map(({ source }) => source),
      readSource('./models.js'),
      `var models = c2kModels(color2k, { ${themes
        .map(({ key, builder }) => `${key}: ${builder}`)
        .join(', ')} });`,
      readSource('./client.js'),
      '})();',
    ].join('\n')
  );
}

/** The UMD build, minified, served as `/color2k.js`. It runs the whole site. */
function getBrowserBundle() {
  const bundle = repoPath('dist/index.unpkg.umd.js');
  if (!fs.existsSync(bundle)) {
    execFileSync(repoPath('scripts/build'), { cwd: repoPath(), stdio: 'inherit' });
  }
  return minifyScript(
    fs.readFileSync(bundle, { encoding: 'utf8' }).replace(/\n\/\/# sourceMappingURL=.*\n?$/, '\n')
  );
}

/** The "Next to the others" table in the README, as numbers. */
function getComparison(markdown: string) {
  const rows = Array.from(
    markdown.matchAll(/^\| (.+?) \| .*?([\d.]+) kB.*\|$/gm),
    ([, label, size]) => ({
      name: label.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*/g, ''),
      size: Number(size),
    })
  );
  if (rows.length < 4) throw new Error('Could not read the size comparison');
  return rows;
}

function getStructuredData(pkg: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: pkg.name,
    description: pkg.description,
    keywords: pkg.keywords.join(', '),
    author: { '@type': 'Person', name: 'Rico Kahler', url: 'https://rico.codes' },
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

/**
 * The site's own colors as CSS: the light set, then the dark set twice, once
 * for a visitor whose system is dark and once for one who chose Dark.
 */
function getTokenCss(models: any) {
  const block = (dark: boolean) =>
    `color-scheme:${dark ? 'dark' : 'light'};${styleOf(
      models.tokenVars(models.site(models.DEFAULT, dark))
    )};--light:${dark ? ' ' : 'initial'};--dark:${dark ? 'initial' : ' '}`;
  // The theme samples are painted from CSS too, so a dark page never shows
  // a light sample while the script loads.
  const samples = (dark: boolean, root: string) => models.sampleCss(models.DEFAULT, dark, root);

  return [
    `:root{${block(false)}}`,
    samples(false, ''),
    `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${block(true)}}${samples(
      true,
      ':root:not([data-theme="light"]) '
    )}}`,
    `:root[data-theme="dark"]{${block(true)}}`,
    samples(true, ':root[data-theme="dark"] '),
  ].join('\n');
}

async function render() {
  await generateReadme();

  const readme = fs.readFileSync(repoPath('README.md'), { encoding: 'utf8' });
  const pkg = JSON.parse(fs.readFileSync(repoPath('package.json'), { encoding: 'utf8' }));
  const sizes: Sizes = JSON.parse(
    fs.readFileSync(repoPath('docs/sizes.json'), { encoding: 'utf8' })
  );
  const groups = getGroupedDocs();
  // The docs find exports by reading src/index.ts. Hold that against what the
  // module really exports, so one written in another shape cannot slip past
  // the function pages and the llms files.
  const documented = getAllDocs().map(({ functionName }) => functionName);
  const missing = Object.keys(color2k).filter((name) => !documented.includes(name));
  if (missing.length) {
    throw new Error(
      `src/index.ts exports ${missing.join(', ')} in a form the docs cannot read. Use one \`export { default as name } from './name';\` line per export.`
    );
  }

  // The README, cut into the pieces each page shows.
  const body = getReadmeBody(readme);
  const sections = splitAt(body.slice(0, body.indexOf(API_DOCS_START)), 2);
  const section = (title: string) => {
    const markdown = sections.get(title);
    if (!markdown) throw new Error(`README.md lost its "${title}" section`);
    return markdown;
  };
  const why = splitAt(section('Why color2k'), 3);
  const recipes = splitAt(section('Recipes'), 3);
  const themeRecipe = recipes.get('A whole theme from one color');
  if (!themeRecipe || !why.get('What it costs') || !why.get('Next to the others')) {
    throw new Error('README.md lost a section the site shows');
  }

  const themeSources = getThemeSources(themeRecipe);
  const models = createModels(
    color2k,
    Object.fromEntries(themeSources.map(({ key, build }) => [key, build]))
  );
  const color: string = models.DEFAULT;
  const { highlight, inline, render: renderMarkdown } = await createRenderer();

  const css = fs
    .readFileSync(path.resolve(__dirname, './App.css'), { encoding: 'utf8' })
    .replace('/* TOKENS */', getTokenCss(models));

  // ------------------------------------------------------------ pages

  // Where every README heading lives on the site, so a link written for the
  // README (`#known-edges`) can be pointed at the right page.
  const moved: { [slug: string]: string } = { api: '/#functions', 'why-color2k': '/size/' };
  const pages: Page[] = [];

  const docPage = (
    page: Pick<Page, 'path' | 'title' | 'parent' | 'lede'> & { heading?: string },
    markdown: string,
    extra = ''
  ) => {
    const { html, headings } = renderMarkdown(inlineResults(markdown));
    for (const { slug } of headings) moved[slug] = `${page.path}#${slug}`;
    pages.push({
      ...page,
      body: `<article class="prose">${html}</article>${extra}`,
      anchors: headings
        .filter(({ level }) => level === 2)
        .map(({ slug, title }) => ({ id: slug, title })),
    });
  };

  // Functions, one page per group.
  const groupPages = groups.map(({ title, docs }) => {
    const pagePath = `/${title.toLowerCase()}/`;
    const entries: FunctionEntry[] = docs.map((doc) => {
      const display = getDisplayName(doc);
      moved[slugify(display)] = getFunctionUrl(title, doc.functionName, '');
      return {
        doc,
        display,
        summary: getSummary(doc),
        descriptionHtml: renderMarkdown(afterSummary(doc.description)).html,
        signatureHtml: highlight(doc.signature, 'ts'),
        size: sizes.exports[doc.functionName],
      };
    });

    return {
      path: pagePath,
      title,
      parent: 'Functions',
      lede: GROUP_LINES[title][1],
      anchors: docs.map(({ functionName }) => ({ id: functionName, title: functionName })),
      body: `<ul class="jump" aria-label="On this page">
          ${entries
            .map(({ doc }) => `<li><a href="#${doc.functionName}">${doc.functionName}</a></li>`)
            .join('\n          ')}
        </ul>
        ${entries.map((entry) => renderFunction(entry, models, color, inline)).join('\n        ')}`,
    };
  });

  // Themes.
  const themes: Theme[] = themeSources.map((theme) => ({
    key: theme.key,
    name: theme.name,
    about: renderMarkdown(theme.about).html,
    codeHtml: highlight(theme.source, 'js'),
    lines: theme.source.split('\n').length,
    // Each decision, with the line of the builder that makes it.
    why: models.WHY[theme.key].map(({ line }: { line: string }) => {
      const code = new RegExp(`^ *(?:const|let) ${line} =[^;]*;`, 'm').exec(theme.source);
      if (!code) throw new Error(`${theme.builder} has no "${line}" line`);
      return code[0].replace(/\s+/g, ' ').trim();
    }),
  }));
  const themeClosing = themeRecipe.slice(themeRecipe.indexOf('The text pairs in all three'));
  if (themeClosing.length < 100) throw new Error('README.md theme recipe lost its closing');
  moved['a-whole-theme-from-one-color'] = '/themes/';

  recipes.delete('A whole theme from one color');
  const recipeMarkdown = Array.from(recipes, ([title, markdown]) =>
    title ? `## ${title}\n\n${markdown}` : markdown
  ).join('\n\n');

  // The overview.
  const [hue, saturation, lightness, alpha] = color2k.parseToHsla(color);
  pages.push({
    path: '/',
    title: 'Overview',
    parent: 'Start',
    lede: pkg.description,
    hero: renderHero({
      size: (sizes.all / 1000).toFixed(1),
      wheel: {
        rings: models.RINGS,
        wedges: models.WEDGES,
        vars: models.wheel(saturation, lightness, alpha),
        hue,
        color,
      },
    }),
    body: renderOverview({
      groups: groups.map(({ title, docs }) => ({
        title,
        path: `/${title.toLowerCase()}/`,
        line: GROUP_LINES[title][0],
        names: docs.map(({ functionName }) => functionName),
      })),
      models,
      color,
      themeTeaser: renderThemeTeaser(themes, models, color),
      treemap: renderTreemap(sizes, true),
      sizes,
      quickstartHtml: renderMarkdown(
        section('Quickstart').slice(0, section('Quickstart').indexOf('Colors go in as CSS strings'))
      ).html,
    }),
  });

  docPage(
    {
      path: '/quickstart/',
      title: 'Quickstart',
      parent: 'Start',
      lede: 'Install it, import a function and pass it a color.',
    },
    promote(section('Quickstart'))
  );
  pages.push(...groupPages);
  pages.push({
    path: '/themes/',
    title: 'Themes',
    parent: 'Guides',
    heading: 'A whole theme from one color',
    lede: `Three builders, each about ${
      Math.round(themes.reduce((sum, { lines }) => sum + lines, 0) / themes.length / 5) * 5
    } lines of color2k. They take your color and return fourteen tokens, for light or for dark. Switch the mode in the menu and they rebuild.`,
    anchors: themes.map(({ key, name }) => ({ id: key, title: name })),
    body: renderThemes(themes, models, color, renderMarkdown(themeClosing).html),
  });
  docPage(
    {
      path: '/recipes/',
      title: 'Recipes',
      parent: 'Guides',
      lede: 'Everyday color jobs, each done in a few calls.',
    },
    recipeMarkdown
  );
  docPage(
    {
      path: '/colors/',
      title: 'Supported colors',
      parent: 'Reference',
      lede: 'What color2k reads and what it hands back.',
    },
    promote(section('Supported colors'))
  );

  // Size.
  const sizeParts = {
    small: renderMarkdown(`## How it stays small\n\n${section('How it stays small')}`),
    costs: renderMarkdown(`## What it costs\n\n${why.get('What it costs')}`),
    others: renderMarkdown(`## Next to the others\n\n${why.get('Next to the others')}`),
  };
  for (const slug of ['how-it-stays-small', 'what-it-costs', 'next-to-the-others']) {
    moved[slug] = `/size/#${slug}`;
  }
  pages.push({
    path: '/size/',
    title: 'Size',
    parent: 'Reference',
    heading: 'Small on purpose',
    lede: `color2k is ${sizes.all.toLocaleString(
      'en-US'
    )} bytes, minified and gzipped. That is every function on this site. Import six common ones and you ship ${sizes.typical.size.toLocaleString(
      'en-US'
    )} bytes.`,
    anchors: [
      { id: 'treemap', title: 'Where the bytes go' },
      { id: 'boring-on-purpose', title: 'Boring on purpose' },
      { id: 'how-it-stays-small', title: 'How it stays small' },
      { id: 'what-it-costs', title: 'What it costs' },
      { id: 'next-to-the-others', title: 'Next to the others' },
    ],
    body: renderSize({
      sizes,
      comparison: getComparison(why.get('Next to the others')!),
      smallHtml: sizeParts.small.html,
      costsHtml: sizeParts.costs.html,
      othersHtml: sizeParts.others.html,
    }),
  });
  docPage(
    {
      path: '/project/',
      title: 'Project',
      parent: 'Reference',
      lede: 'Who makes color2k, how it ships and how to help.',
    },
    ['For AI agents', 'Trust and publishing', 'Contributing', 'Credits']
      .map((title) => `## ${title}\n\n${section(title)}`)
      .join('\n\n')
  );

  // The menu, in the order the pages were made.
  const item = (pagePath: string) => {
    const page = pages.find((candidate) => candidate.path === pagePath);
    if (!page) throw new Error(`No page at ${pagePath}`);
    return { path: page.path, title: page.title, anchors: page.anchors };
  };
  const nav: NavGroup[] = [
    { title: 'Start', items: [item('/'), item('/quickstart/')] },
    { title: 'Functions', items: groupPages.map(({ path: pagePath }) => item(pagePath)) },
    { title: 'Guides', items: [item('/themes/'), item('/recipes/')] },
    { title: 'Reference', items: [item('/colors/'), item('/size/'), item('/project/')] },
  ];

  // ----------------------------------------------------------- output

  const buildFolder = repoPath('build');
  await fs.promises.rm(buildFolder, { recursive: true, force: true });
  await fs.promises.mkdir(buildFolder, { recursive: true });

  const write = async (file: string, contents: string) => {
    const target = path.resolve(buildFolder, file);
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.writeFile(target, contents);
  };

  const site = {
    css,
    color,
    description: pkg.description,
    nav,
    presets: models.PRESETS,
    structuredData: getStructuredData(pkg),
  };

  for (const page of pages) {
    const html = shell(page, site)
      // Links written for the README point at headings on one long page.
      .replace(/href="#([^"]+)"/g, (match, slug: string) => {
        if (new RegExp(`\\sid="${slug}"`).test(page.body + (page.hero || '')) || slug === 'content' || slug === 'menu') {
          return match;
        }
        if (!moved[slug]) throw new Error(`${page.path} links to #${slug}, which is nowhere on the site`);
        return `href="${moved[slug]}"`;
      })
      // An old link such as `/#darkencolor-amount` is forwarded by `client.js`.
      .replace('<body class="is-home">', `<body class="is-home" data-moved="${escapeHtml(JSON.stringify(moved))}">`);

    await write(path.join(page.path.slice(1), 'index.html'), html);
  }

  await write('_headers', getHeaders());
  await write('color2k.js', await getBrowserBundle());
  await write('site.js', await getSiteScript(themeSources));
  await write('theme.js', await minifyScript(readSource('./theme.js')));
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
      ...pages
        .map(({ path: pagePath }) => pagePath.slice(1))
        .concat(['llms.txt', 'llms-full.txt'])
        .flatMap((page) => ['  <url>', `    <loc>https://color2k.com/${page}</loc>`, '  </url>']),
      '</urlset>',
      '',
    ].join('\n')
  );

  const staticFiles = await fs.promises.readdir(path.resolve(__dirname, './static'));

  for (const staticFile of staticFiles) {
    await fs.promises.copyFile(
      path.resolve(__dirname, `./static/${staticFile}`),
      path.resolve(buildFolder, staticFile)
    );
  }
}

export default render;
