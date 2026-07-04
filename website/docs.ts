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

function getDisplayName(doc: DocInfo) {
  if (doc.kind === 'class') return doc.functionName;
  return `${doc.functionName}(${doc.params.map(({ name }) => name).join(', ')})`;
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
