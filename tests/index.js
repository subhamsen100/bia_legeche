// Entry point for `node --test tests/` (the package.json "test" script).
// On Node >= 21 a bare directory argument is not expanded by the test runner; Node resolves it as a
// module path and runs tests/index.js, so this file loads every tests/*.test.mjs into the same run.
// If the script is changed to `node --test "tests/*.test.mjs"`, this file is simply not used.
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
for (const f of readdirSync(dir).filter((n) => n.endsWith('.test.mjs')).sort()) {
  await import(pathToFileURL(dir + f).href);
}
