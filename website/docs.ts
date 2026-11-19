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

export function generateApiMarkdown(docs: DocInfo[] = getAllDocs()) {
  return [
    '## API',
    '',
    'This section is generated from the JSDoc comments in `src/*.ts`.',
    '',
    renderIndex(docs),
    ...docs.flatMap((doc) => [
      `### ${getDisplayName(doc)}`,
      '',
      '```ts',
      doc.signature,
      '```',
      '',
      doc.description,
      '',
      renderParams(doc),
      renderReturns(doc),
      `[Source](https://github.com/ricokahler/color2k/blob/main/src/${doc.functionName}.ts)`,
      '',
    ]),
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();
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
 * The README without its GitHub-only header (logo, tagline, badges). The
 * website and `llms-full.txt` both start from the first `## ` heading.
 */
export function getReadmeBody(readme: string) {
  const firstSection = readme.search(/^## /m);
  if (firstSection === -1) throw new Error('README.md has no `## ` heading');
  return readme.slice(firstSection);
}

/**
 * A recipe result as `scripts/readme-assets.js` writes it into the README.
 * The first group is the SVG file and the second is its text description.
 */
export const RESULT_PATTERN =
  /<!-- RESULT: .+ -->\n<p><img src="\.\/docs\/readme\/([\w-]+\.svg)"[^>]* alt="([^"]*)" \/><\/p>\n<!-- RESULT-END -->/g;

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

/** Removes the generator markers, which sit on lines of their own. */
function stripComments(markdown: string) {
  return markdown.replace(/^<!--.*-->\n/gm, '');
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
  return [
    '# color2k',
    '',
    `> ${pkg.description}`,
    '',
    between(readme, AGENT_NOTES_START, AGENT_NOTES_END),
    '',
    '## Docs',
    '',
    `- [Full documentation](${SITE_URL}/llms-full.txt): install, recipes and the complete API in one Markdown file`,
    `- [Website](${SITE_URL}/): the same documentation as HTML, with a live demo of every function on its own anchor`,
    `- [README](${REPO_URL}/blob/main/README.md): the source of all of the above`,
    `- [Quickstart](${SITE_URL}/quickstart/): install, first calls, and use without a bundler`,
    `- [Themes](${SITE_URL}/themes/): three theme builders that turn one color into fourteen tokens, for light or dark`,
    `- [Recipes](${SITE_URL}/recipes/): hover states, readable text, contrast checks, scales and palettes`,
    `- [Supported colors](${SITE_URL}/colors/): what the parser reads, what each function returns, and known edges`,
    `- [Size](${SITE_URL}/size/): what each import costs and where the bytes go`,
    `- [Project](${SITE_URL}/project/): publishing, contributing and credits`,
    '',
    ...getGroupedDocs(docs).flatMap(({ title, docs: groupDocs }) => [
      `## API: ${title}`,
      '',
      ...groupDocs.map((doc) => {
        const name = getDisplayName(doc);
        return `- [${name}](${getFunctionUrl(title, doc.functionName)}): \`${
          doc.signature
        }\`. ${getSummary(doc)}`;
      }),
      '',
    ]),
    '## Optional',
    '',
    `- [Source code](${REPO_URL}): one small TypeScript file per function in \`src/\``,
    `- [npm package](https://www.npmjs.com/package/color2k): versions and provenance`,
    `- [Releases](${REPO_URL}/releases): changelog`,
    `- [Contributing](${REPO_URL}/blob/main/CONTRIBUTING.md): how to work on color2k`,
    '',
  ].join('\n');
}

/** `llms-full.txt`: the whole README (recipes and API) as plain Markdown. */
export function generateLlmsFullTxt(readme: string, pkg: Package) {
  return [
    '# color2k',
    '',
    `> ${pkg.description}`,
    '',
    `Website: ${SITE_URL}/ | Source: ${REPO_URL} | npm: https://www.npmjs.com/package/color2k`,
    '',
    stripComments(resultsAsText(getReadmeBody(readme))).trim(),
    '',
  ].join('\n');
}
