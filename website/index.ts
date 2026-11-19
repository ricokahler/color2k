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

const GALLERY_COLOR = '#5e60ce';
const GALLERY_PRESETS = [
  'tomato',
  'gold',
  '#2ec4b6',
  'rebeccapurple',
  'hsl(210, 100%, 50%)',
];

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

  return { html: md.render(markdown) as string, headings };
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

/** The page's script: the demos, started with the library's global. */
function getSiteScript() {
  return fs
    .readFileSync(path.resolve(__dirname, './showcase.js'), {
      encoding: 'utf8',
    })
    .replace(
      /\nif \(typeof module[^\n]*\n?$/,
      '\nshowcase.start(color2k);\n'
    );
}

/** The UMD build, served as `/color2k.js` for the demos. */
function getBrowserBundle() {
  const bundle = repoPath('dist/index.unpkg.umd.js');
  if (!fs.existsSync(bundle)) {
    execFileSync(repoPath('scripts/build'), { cwd: repoPath(), stdio: 'inherit' });
  }
  return fs
    .readFileSync(bundle, { encoding: 'utf8' })
    .replace(/\n\/\/# sourceMappingURL=.*\n?$/, '\n');
}

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
  const { html: bodyHtml, headings } = await renderMarkdown(
    inlineResults(getReadmeBody(readme))
  );
  const groups = getGroupedDocs();
  const buildFolder = repoPath('build');

  await fs.promises.rm(buildFolder, { recursive: true, force: true });
  await fs.promises.mkdir(buildFolder, { recursive: true });

  const write = (file: string, contents: string) =>
    fs.promises.writeFile(path.resolve(buildFolder, file), contents);

  await write(
    'index.html',
    template({
      bodyHtml,
      css,
      description: pkg.description,
      exportCount: getAllDocs().filter(({ kind }) => kind === 'function').length,
      galleryColor: GALLERY_COLOR,
      galleryGroups: groups.map(({ title }) => title),
      galleryHtml: showcase.galleryHtml(
        color2k,
        groups.map(({ title, docs }) => ({
          title,
          items: docs.map((doc) => ({
            name: doc.functionName,
            link: `#${slugify(getDisplayName(doc))}`,
          })),
        })),
        GALLERY_COLOR
      ),
      galleryPresets: GALLERY_PRESETS,
      heroHtml: showcase.heroHtml(color2k),
      structuredData: getStructuredData(),
      toc: getToc(headings),
    })
  );
  await write('_headers', getHeaders());
  await write('color2k.js', getBrowserBundle());
  await write('site.js', getSiteScript());
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
