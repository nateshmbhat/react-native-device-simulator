/**
 * The package ships TypeScript source, so the consuming app's Babel config
 * compiles it. A bare React Native app uses only `@react-native/babel-preset`
 * (no `babel-preset-expo`), which lacks some plugins Expo adds, e.g.
 * `@babel/plugin-transform-export-namespace-from` for `export * as X`.
 * Every source file must compile with that preset alone (issue #1).
 */

// Node and Babel are required with inline types: the tsconfig has no Node types (as in metro.test.ts).
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs') as {
  readdirSync(dir: string, options: { withFileTypes: true }): { name: string; isDirectory(): boolean }[];
};
const path = require('path') as { join(...parts: string[]): string; relative(from: string, to: string): string };
const babel = require('@babel/core') as { transformFileSync(file: string, options: object): unknown };
const presetPath = (require as unknown as { resolve(id: string): string }).resolve('@react-native/babel-preset');
/* eslint-enable @typescript-eslint/no-require-imports */

declare const __dirname: string;
export {};

const packageRoot = path.join(__dirname, '..', '..');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return /\.(ts|tsx|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [full] : [];
  });
}

const files = [...sourceFiles(path.join(packageRoot, 'src')), ...sourceFiles(path.join(packageRoot, 'metro'))];

describe('compiles with @react-native/babel-preset alone (bare React Native)', () => {
  it('finds the source files', () => {
    expect(files.length).toBeGreaterThan(10);
    expect(files).toContain(path.join(packageRoot, 'src', 'index.ts'));
  });

  it.each(files.map((file) => [path.relative(packageRoot, file), file]))('%s', (_name, file) => {
    expect(() =>
      babel.transformFileSync(file, { babelrc: false, configFile: false, presets: [presetPath] }),
    ).not.toThrow();
  });
});
