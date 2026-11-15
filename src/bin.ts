#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { runCli } from './cli.js';

process.exitCode = runCli(process.argv.slice(2), {
  stdout: (t) => process.stdout.write(t),
  stderr: (t) => process.stderr.write(t),
  writeFile: (path, content) => writeFileSync(path, content, 'utf8'),
  now: () => new Date(),
});
