// Prints `true` when commits since the last release tag would make
// semantic-release publish, otherwise `false`. Used by the Release workflow so
// pushes with nothing to release don't request an npm-publish approval.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { analyzeCommits } from '@semantic-release/commit-analyzer';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const config = JSON.parse(readFileSync('.releaserc.json', 'utf8'));
const analyzer = config.plugins.find(
  (p) => (Array.isArray(p) ? p[0] : p) === '@semantic-release/commit-analyzer',
);
const pluginConfig = Array.isArray(analyzer) ? analyzer[1] : {};

let range = 'HEAD';
try {
  range = `${git('describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*')}..HEAD`;
} catch {
  // No release tag yet: every commit counts.
}

const log = git('log', '--format=%H%x00%B%x1e', range);
const commits = log
  .split('\x1e')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const [hash, message] = entry.split('\0');
    return { hash, message };
  });

const silent = { log() {}, warn() {}, error() {}, success() {} };
const type = await analyzeCommits(pluginConfig, {
  cwd: process.cwd(),
  env: process.env,
  commits,
  logger: silent,
});

console.error(
  `${commits.length} commit(s) in ${range}; release type: ${type ?? 'none'}`,
);
console.log(type ? 'true' : 'false');
