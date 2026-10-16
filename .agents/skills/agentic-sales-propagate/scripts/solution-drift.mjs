import { execFileSync } from 'node:child_process';

const [starter, parent] = process.argv.slice(2);
const parentFiles = new Map();

function show(rev, path) {
  try {
    return execFileSync('git', ['show', `${rev}:${path}`], {
      encoding: 'utf8',
      maxBuffer: 100_000_000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return '';
  }
}

function parentFile(path) {
  if (!parentFiles.has(path)) {
    parentFiles.set(path, show(parent, path));
  }
  return parentFiles.get(path);
}

function pathsIn(heading) {
  const matches = [...heading.matchAll(/`([^`\s]+\/[^`\s]+)`/g)];
  return matches.map((match) => match[1]);
}

let todo = '';
let heading = '';
let paths = [];
let inCode = false;

for (const line of show(starter, 'solution.md').split('\n')) {
  const code = line.trim();
  const todoMatch = line.match(/^## (TODO #\d+)/);
  if (line.startsWith('```')) {
    inCode = !inCode;
  } else if (inCode) {
    if (code && !paths.some((path) => parentFile(path).includes(code))) {
      console.log(`${todo} (${paths.join(', ')}): ${code}`);
    }
  } else if (todoMatch) {
    todo = todoMatch[1];
    paths = [];
  } else if (/^Files?:/.test(line)) {
    heading = line;
  } else if (heading && code) {
    heading = `${heading} ${line}`;
  } else if (heading) {
    paths = pathsIn(heading);
    heading = '';
  }
}
