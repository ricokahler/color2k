import fs from 'fs';
import path from 'path';
import getDocInfo, { DocInfo } from './getDocInfo';

export const API_DOCS_START = '<!-- API-DOCS-START -->';
export const API_DOCS_END = '<!-- API-DOCS-END -->';

interface PublicExport {
  name: string;
  source: string;
  file: string;
}

function repoPath(...parts: string[]) {
  return path.resolve(__dirname, '..', ...parts);
}

export function getPublicExports(): PublicExport[] {
  const index = fs.readFileSync(repoPath('src/index.ts'), {
    encoding: 'utf8',
  });

  return Array.from(index.matchAll(/export \{ default as (\w+) \} from '(.+)';/g))
    .map(([, name, source]) => ({
      name,
      source,
      file: repoPath(`src/${source}.ts`),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getAllDocs(): DocInfo[] {
  return getPublicExports().map(({ file, name }) => {
    const doc = getDocInfo(fs.readFileSync(file, { encoding: 'utf8' }));

    if (doc.functionName !== name) {
      throw new Error(`Expected ${name}, received ${doc.functionName}`);
    }

    return doc;
  });
}

function escapeTableCell(value: string) {
  return value.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
}

export function getDisplayName(doc: DocInfo) {
  if (doc.kind === 'class') return doc.functionName;
  return `${doc.functionName}(${doc.params
    .map(({ name, rest }) => `${rest ? '...' : ''}${name}`)
    .join(', ')})`;
}

/**
 * Turns a heading into its anchor the same way GitHub does, so the links in
 * the generated index work in the README and on the website.
 */
export function slugify(title: string) {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s/g, '-') || 'section'
  );
}

/** Where a function lives on the website: its group's page, at its name. */
export function getFunctionUrl(group: string, name: string, base = 'https://color2k.com') {
  return `${base}/${group.toLowerCase()}/#${name}`;
}

/** The first sentence of a doc comment, on one line. */
export function getSummary(doc: DocInfo) {
  const firstParagraph = doc.description.split(/\n\s*\n/)[0].replace(/\s+/g, ' ');
  const sentenceEnd = firstParagraph.search(/\.(\s|$)/);
  return sentenceEnd === -1
    ? firstParagraph
    : firstParagraph.slice(0, sentenceEnd + 1);
}

/**
 * Every public export belongs to exactly one group. `getGroupedDocs` throws
 * when an export is missing so a new function can't be left out of the index.
 */
export const API_GROUPS: Array<{ title: string; names: string[] }> = [
  { title: 'Parse', names: ['parseToRgba', 'parseToHsla'] },
  { title: 'Convert', names: ['toHex', 'toRgba', 'toHsla', 'rgba', 'hsla'] },
  {
    title: 'Adjust',
    names: [
      'darken',
      'lighten',
      'saturate',
      'desaturate',
      'adjustHue',
      'complement',
      'invert',
      'opacify',
      'transparentize',
    ],
  },
  { title: 'Mix', names: ['mix', 'getScale'] },
  {
    title: 'Contrast',
    names: [
      'getContrast',
      'getLuminance',
      'hasBadContrast',
      'readableColor',
      'readableColorIsBlack',
    ],
  },
  { title: 'Utilities', names: ['guard', 'ColorError'] },
];

export function getGroupedDocs(docs: DocInfo[] = getAllDocs()) {
  const byName = new Map(docs.map((doc) => [doc.functionName, doc]));
  const grouped = API_GROUPS.map(({ title, names }) => ({
    title,
    docs: names.map((name) => {
      const doc = byName.get(name);
      if (!doc) throw new Error(`API_GROUPS lists unknown export ${name}`);
      byName.delete(name);
      return doc;
    }),
  }));

  if (byName.size) {
    throw new Error(
      `Add ${Array.from(byName.keys()).join(', ')} to API_GROUPS in website/docs.ts`
    );
  }

  return grouped;
}

function renderIndex(docs: DocInfo[]) {
  return [
    '| Group | Function | What it does |',
    '| --- | --- | --- |',
    ...getGroupedDocs(docs).flatMap(({ title, docs: groupDocs }) =>
      groupDocs.map((doc, index) => {
        const name = getDisplayName(doc);
        return `| ${index === 0 ? `**${title}**` : ''} | [\`${name}\`](#${slugify(
          name
        )}) | ${escapeTableCell(getSummary(doc))} |`;
      })
    ),
    '',
  ].join('\n');
}

function renderParams(doc: DocInfo) {
  if (doc.params.length === 0) return '';

  const heading =
    doc.kind === 'class' ? '#### Constructor Parameters' : '#### Parameters';

  return [
    heading,
    '',
    '| Name | Type | Description |',
    '| --- | --- | --- |',
    ...doc.params.map(
      ({ name, type, description }) =>
        `| \`${name}\` | \`${escapeTableCell(type)}\` | ${escapeTableCell(
          description
        )} |`
    ),
    '',
  ].join('\n');
}

function renderReturns(doc: DocInfo) {
  if (doc.kind !== 'function') return '';

  return [
    '#### Returns',
    '',
    `\`${doc.returnType}\` - ${doc.returnsDescription}`,
    '',
  ].join('\n');
}

/** One export's full entry: signature, description, parameters and return. */
function renderEntry(doc: DocInfo, level = '###') {
  return [
    `${level} ${getDisplayName(doc)}`,
    '',
    '```ts',
    doc.signature,
    '```',
    '',
    doc.description,
    '',
    renderParams(doc).replace(/^####/gm, `${level}#`),
    renderReturns(doc).replace(/^####/gm, `${level}#`),
    `[Source](https://github.com/ricokahler/color2k/blob/main/src/${doc.functionName}.ts)`,
    '',
  ];
}

const tidy = (lines: string[]) =>
  lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();

export function generateApiMarkdown(docs: DocInfo[] = getAllDocs()) {
  return tidy([
    '## API',
    '',
    'This section is generated from the JSDoc comments in `src/*.ts`.',
    '',
    renderIndex(docs),
    ...docs.flatMap((doc) => renderEntry(doc)),
  ]);
}

export function applyGeneratedApi(readme: string, apiMarkdown = generateApiMarkdown()) {
  const generatedBlock = `${API_DOCS_START}\n${apiMarkdown}\n${API_DOCS_END}`;

  if (readme.includes(API_DOCS_START) && readme.includes(API_DOCS_END)) {
    const before = readme.slice(0, readme.indexOf(API_DOCS_START));
    const after = readme.slice(
      readme.indexOf(API_DOCS_END) + API_DOCS_END.length
    );

    return `${before}${generatedBlock}${after.startsWith('\n') ? after : `\n${after}`}`;
  }

  const oldDocsEnd = '<!-- DOCS-END -->';
  if (readme.includes(oldDocsEnd)) {
    return `${readme.slice(0, readme.indexOf(oldDocsEnd)).trimEnd()}\n\n${generatedBlock}\n`;
  }

  return `${readme.trimEnd()}\n\n${generatedBlock}\n`;
}

export async function generateReadme({ check = false } = {}) {
  const readmePath = repoPath('README.md');
  const current = fs.readFileSync(readmePath, { encoding: 'utf8' });
  const next = applyGeneratedApi(current);

  if (check) {
    if (current !== next) {
      throw new Error('README.md generated API docs are out of date');
    }
    return;
  }

  fs.writeFileSync(readmePath, next);
}

interface Package {
  description: string;
}

const SITE_URL = 'https://color2k.com';
const REPO_URL = 'https://github.com/ricokahler/color2k';
export const AGENT_NOTES_START = '<!-- AGENT-NOTES-START -->';
export const AGENT_NOTES_END = '<!-- AGENT-NOTES-END -->';

function between(text: string, start: string, end: string) {
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`README.md is missing ${start} ... ${end}`);
  }

  return text.slice(startIndex + start.length, endIndex).trim();
}

/**
 * The README without its GitHub-only header (title, banner, badges). The
 * website and the llms files both start from the first `## ` heading.
 */
export function getReadmeBody(readme: string) {
  const firstSection = readme.search(/^## /m);
  if (firstSection === -1) throw new Error('README.md has no `## ` heading');
  return readme.slice(firstSection);
}

/** Splits Markdown at headings of one level: `{ title: body }`, in order. */
export function splitAt(markdown: string, level: number) {
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
 * A recipe result as `scripts/readme-assets.js` writes it into the README.
 * The first group is the SVG file and the second is its text description.
 */
export const RESULT_PATTERN =
  /<!-- RESULT: .+ -->\n<p><img src="https:\/\/raw\.githubusercontent\.com\/ricokahler\/color2k\/main\/docs\/readme\/([\w-]+\.svg)"[^>]* alt="([^"]*)" \/><\/p>\n<!-- RESULT-END -->/g;

/** Replaces each result picture with the values it shows, as a list. */
function resultsAsText(markdown: string) {
  return markdown.replace(RESULT_PATTERN, (match, file: string, alt: string) => {
    const values = alt
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .split('; ');
    return ['Result:', '', ...values.map((value) => `- ${value}`)].join('\n');
  });
}

/** Plain Markdown for agents: no generator markers, results as text. */
const forAgents = (markdown: string) =>
  resultsAsText(markdown)
    .replace(/^<!--.*-->\n/gm, '')
    // Links written for the README's one page point at the site instead.
    .replace(/\]\(#([\w-]+)\)/g, `](${SITE_URL}/#$1)`)
    .trim();

/** `### Title` becomes `## Title`, outside code fences. */
function shift(markdown: string, by: number) {
  let fenced = false;
  return markdown
    .split('\n')
    .map((line) => {
      if (/^```/.test(line)) fenced = !fenced;
      if (fenced || !/^#+ /.test(line)) return line;
      return by < 0 ? line.slice(-by) : '#'.repeat(by) + line;
    })
    .join('\n');
}

export interface Section {
  /** The anchor on the page: `https://color2k.com/#adjust`. */
  id: string;
  /** The Markdown twin: `https://color2k.com/adjust.md`. */
  file: string;
  title: string;
  about: string;
  markdown: string;
}

/** The anchor of a function group's section. `mix` is taken by the function. */
export const groupId = (title: string) => (title === 'Mix' ? 'mixing' : title.toLowerCase());

/**
 * Every section of the site as a Markdown file of its own, cut from the
 * README and the JSDoc. The site serves each as `/<file>` and `llms.txt`
 * links to them, so an agent can fetch one part without the rest.
 */
export function getSections(readme: string, docs: DocInfo[] = getAllDocs()): Section[] {
  const body = getReadmeBody(readme);
  const sections = splitAt(body.slice(0, body.indexOf(API_DOCS_START)), 2);
  const get = (title: string) => {
    const markdown = sections.get(title);
    if (!markdown) throw new Error(`README.md lost its "${title}" section`);
    return markdown;
  };
  const recipes = splitAt(get('Recipes'), 3);
  const themes = recipes.get('A whole theme from one color');
  if (!themes) throw new Error('README.md lost its theme recipe');
  recipes.delete('A whole theme from one color');
  const page = (title: string, markdown: string) => `# color2k: ${title}\n\n${forAgents(markdown)}\n`;
  const whole = (titles: string[]) => titles.map((title) => `## ${title}\n\n${get(title)}`).join('\n\n');

  return [
    {
      id: 'quickstart',
      file: 'quickstart.md',
      title: 'Quickstart',
      about: 'install, first calls, use without a bundler, browser and Node support',
      markdown: page('Quickstart', shift(get('Quickstart'), -1)),
    },
    ...getGroupedDocs(docs).map(({ title, docs: groupDocs }) => ({
      id: groupId(title),
      file: `${title.toLowerCase()}.md`,
      title,
      about: groupDocs.map(({ functionName }) => functionName).join(', '),
      markdown: page(title, tidy(groupDocs.flatMap((doc) => renderEntry(doc, '##')))),
    })),
    {
      id: 'themes',
      file: 'themes.md',
      title: 'Themes',
      about: 'three theme builders that turn one color into fourteen tokens, for light or dark',
      markdown: page('A whole theme from one color', themes),
    },
    {
      id: 'recipes',
      file: 'recipes.md',
      title: 'Recipes',
      about: 'hover states, readable text, contrast checks, scales and palettes',
      markdown: page(
        'Recipes',
        Array.from(recipes, ([title, markdown]) =>
          title ? `## ${title}\n\n${markdown}` : markdown
        ).join('\n\n')
      ),
    },
    {
      id: 'supported-colors',
      file: 'supported-colors.md',
      title: 'Supported colors',
      about: 'what the parser reads, what each function returns, and known edges',
      markdown: page('Supported colors', shift(get('Supported colors'), -1)),
    },
    {
      id: 'size',
      file: 'size.md',
      title: 'Size',
      about: 'what each import costs, other libraries, and moving from TinyColor or Polished',
      markdown: page(
        'Size',
        whole(['Why color2k', 'How it stays small'])
      ),
    },
    {
      id: 'project',
      file: 'project.md',
      title: 'Project',
      about: 'credits, contributing, and how releases are published',
      markdown: page('Project', whole(['Credits', 'Contributing', 'Trust and publishing'])),
    },
  ];
}

/**
 * `llms.txt` in the llmstxt.org format: a title, a one-line summary, the
 * rules an agent needs before writing code, then links.
 */
export function generateLlmsTxt(
  readme: string,
  pkg: Package,
  docs: DocInfo[] = getAllDocs()
) {
  const sections = getSections(readme, docs);
  const groups = getGroupedDocs(docs);

  return [
    '# color2k',
    '',
    `> ${pkg.description}`,
    '',
    between(readme, AGENT_NOTES_START, AGENT_NOTES_END),
    '',
    '## Docs',
    '',
    `- [Full documentation](${SITE_URL}/llms-full.txt): quickstart, the complete API, supported colors and recipes in one Markdown file`,
    ...sections
      .filter(({ title }) => !groups.some((group) => group.title === title))
      .map(({ file, title, about }) => `- [${title}](${SITE_URL}/${file}): ${about}`),
    `- [Website](${SITE_URL}/): the same documentation as one HTML page, with a live demo of every function`,
    '',
    ...groups.flatMap(({ title, docs: groupDocs }) => [
      `## API: ${title}`,
      '',
      ...groupDocs.map((doc) => {
        const name = getDisplayName(doc);
        return `- [${name}](${SITE_URL}/${title.toLowerCase()}.md): \`${
          doc.signature
        }\`. ${getSummary(doc)}`;
      }),
      '',
    ]),
    '## Optional',
    '',
    `- [Source code](${REPO_URL}): one small TypeScript file per function in \`src/\``,
    `- [README](${REPO_URL}/blob/main/README.md): the source of all of the above`,
    `- [AGENTS.md](${REPO_URL}/blob/main/AGENTS.md): rules for coding agents working on color2k itself`,
    `- [npm package](https://www.npmjs.com/package/color2k): versions and provenance`,
    `- [Releases](${REPO_URL}/releases): changelog`,
    `- [Contributing](${REPO_URL}/blob/main/CONTRIBUTING.md): how to work on color2k`,
    '',
  ].join('\n');
}

/**
 * `llms-full.txt`: what an agent needs to write code with color2k, in the
 * order it needs it. The rules, the quickstart, one entry per export, the
 * color formats and their edges, then the recipes. The theme builders, the
 * size tables and the project notes are long and rarely needed, so they are
 * linked as files of their own.
 */
export function generateLlmsFullTxt(
  readme: string,
  pkg: Package,
  docs: DocInfo[] = getAllDocs()
) {
  const sections = getSections(readme, docs);
  const part = (id: string) => {
    const section = sections.find((candidate) => candidate.id === id)!;
    // Under this file's own title, each section sits one level down.
    return shift(section.markdown.replace(/^# color2k: /, '# '), 1).trim();
  };
  const link = (id: string) => {
    const { file, title, about } = sections.find((candidate) => candidate.id === id)!;
    return `- [${title}](${SITE_URL}/${file}): ${about}`;
  };

  return [
    '# color2k',
    '',
    `> ${pkg.description}`,
    '',
    `Website: ${SITE_URL}/ | Source: ${REPO_URL} | npm: https://www.npmjs.com/package/color2k`,
    '',
    '## Rules',
    '',
    between(readme, AGENT_NOTES_START, AGENT_NOTES_END),
    '',
    part('quickstart'),
    '',
    '## API',
    '',
    tidy(
      docs.flatMap((doc) => [
        `### ${getDisplayName(doc)}`,
        '',
        '```ts',
        doc.signature,
        '```',
        '',
        doc.description,
        '',
        doc.kind === 'function' ? `Returns \`${doc.returnType}\`: ${doc.returnsDescription}` : '',
        '',
      ])
    ),
    '',
    part('supported-colors'),
    '',
    part('recipes'),
    '',
    '## More',
    '',
    link('themes'),
    link('size'),
    link('project'),
    '',
  ].join('\n');
}
