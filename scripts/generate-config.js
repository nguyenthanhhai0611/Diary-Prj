// scripts/generate-config.js
const fs = require('fs');
const path = require('path');

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';

const content = `// Auto-generated during build. Do NOT commit this file.
export const SUPABASE_URL = ${JSON.stringify(url)};
export const SUPABASE_ANON_KEY = ${JSON.stringify(key)};
`;

const outPath = path.join(__dirname, '..', 'config.js');

try {
  fs.writeFileSync(outPath, content, 'utf8');
  console.log(' Wrote config.js to', outPath);
} catch (err) {
  console.error('Failed to write config.js', err);
  process.exit(1);
}
