import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import * as esm from '../src/index.js';

const require = createRequire(import.meta.url);

describe('package entry points', () => {
  test('CommonJS build exposes the same API', () => {
    const cjs = require('../cjs/index.js') as typeof esm;
    assert.equal(typeof cjs.isHoliday, 'function');
    assert.equal(cjs.isHoliday('2026-12-16'), true);
    assert.equal(cjs.addBusinessDays('2026-12-14', 2), '2026-12-17');
    assert.deepEqual(Object.keys(cjs).sort(), Object.keys(esm).sort());
  });

  test('package.json has zero runtime dependencies and dual exports', () => {
    const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
    assert.equal(pkg.dependencies, undefined);
    assert.equal(pkg.exports['.'].import.default, './dist/src/index.js');
    assert.equal(pkg.exports['.'].require.default, './dist/cjs/index.js');
    assert.equal(pkg.author, 'Saizul Amin');
  });
});
