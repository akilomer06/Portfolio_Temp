import fs from 'node:fs/promises';
import path from 'node:path';
import { EOL } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createCMS } from './cms-server.mjs';
import { publicCopyPaths } from './public-copy.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const seed = JSON.parse(await fs.readFile(path.join(root, '../cms.seed.json'), 'utf8'));
const memory = new Map();
const storage = {
  read: async (name, fallback) => structuredClone(memory.get(name) ?? fallback),
  write: async (name, value) => memory.set(name, structuredClone(value))
};
const cms = await createCMS({ root, dataDirectory: '/build-data', storage });
const pages = [
  ...seed.pages.filter(page => page.visible !== false).map(page => page.path),
  ...seed.projects.filter(project => project.status === 'published').map(project => '/work/' + project.id + '/'),
  ...publicCopyPaths
];
const templates = new Map();
for (const route of new Set(pages.map(route => cms.templatePath(route)))) {
  templates.set(route, await fs.readFile(path.join(root, '.' + route, 'index.html'), 'utf8'));
}
for (const route of new Set(pages)) {
  const url = new URL(route, 'http://localhost');
  const html = cms.renderHTML(templates.get(cms.templatePath(route)), route, { headers: {} }, url);
  const destination = path.join(root, '.' + route, 'index.html');
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, html.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n/g, EOL));
}
console.log(`Built ${new Set(pages).size} public HTML pages from the CMS seed.`);
