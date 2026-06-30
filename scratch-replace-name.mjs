import fs from 'fs';
import path from 'path';

const searchPaths = ['./src', './public', './package.json', './package-lock.json', './README.md'];

const replacements = [
  { search: /MoneyFlow AI/g, replace: 'Cashtrack AI' },
  { search: /MoneyFlow/g, replace: 'Cashtrack' },
  { search: /moneyflow-ai/g, replace: 'cashtrack-ai' },
  { search: /moneyflow_/g, replace: 'cashtrack_' },
  { search: /moneyflow/g, replace: 'cashtrack' },
  { search: /MONEYFLOW/g, replace: 'CASHTRACK' }
];

function walk(p) {
  if (fs.statSync(p).isDirectory()) {
    const files = fs.readdirSync(p);
    for (const file of files) {
      walk(path.join(p, file));
    }
  } else {
    if (p.endsWith('.tsx') || p.endsWith('.ts') || p.endsWith('.json') || p.endsWith('.md') || p.endsWith('.js') || p.endsWith('.css') || p.endsWith('.html')) {
      let content = fs.readFileSync(p, 'utf8');
      let modified = content;
      
      for (const rule of replacements) {
        modified = modified.replace(rule.search, rule.replace);
      }
      
      if (modified !== content) {
        fs.writeFileSync(p, modified, 'utf8');
        console.log(`Updated ${p}`);
      }
    }
  }
}

for (const p of searchPaths) {
  if (fs.existsSync(p)) walk(p);
}
console.log('Replacement complete.');
