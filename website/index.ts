import fs from 'fs';
import path from 'path';
import template from './template';
import { generateReadme } from './docs';

const MarkdownIt = require('markdown-it');

interface Heading {
  slug: string;
  title: string;
}

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
    const base =
      title
        .trim()
        .toLowerCase()
        .replace(/<[^>]+>/g, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-') || 'section';
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

async function renderMarkdown(markdown: string) {
  const { createHighlighter } = await import('shiki');
  const highlighter = await createHighlighter({
    themes: ['github-light'],
    langs: [
      'bash',
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
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
    highlight(code: string, lang: string) {
      const language = getLanguage(lang);

      try {
        return highlighter.codeToHtml(code, {
          lang: language,
          theme: 'github-light',
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
    headingQueue.push({ slug: id, title });
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

  return md.render(markdown);
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
  const bodyHtml = await renderMarkdown(readme);
  const buildFolder = repoPath('build');

  await fs.promises.rm(buildFolder, { recursive: true, force: true });
  await fs.promises.mkdir(buildFolder, { recursive: true });

  await fs.promises.writeFile(
    path.resolve(buildFolder, './index.html'),
    template({ bodyHtml, css, structuredData: getStructuredData() })
  );

  await fs.promises.writeFile(
    path.resolve(buildFolder, './robots.txt'),
    ['User-agent: *', 'Allow: /', '', 'Sitemap: https://color2k.com/sitemap.xml', ''].join('\n')
  );

  await fs.promises.writeFile(
    path.resolve(buildFolder, './sitemap.xml'),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '  <url>',
      '    <loc>https://color2k.com/</loc>',
      '  </url>',
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
