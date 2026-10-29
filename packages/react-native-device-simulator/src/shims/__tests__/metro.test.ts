
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withDevicePreview, SHIMS_DIR } = require('../../../metro') as typeof import('../../../metro');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path') as { join(...parts: string[]): string };

type Resolution = { type: 'sourceFile'; filePath: string } | { type: 'empty' } | { type: 'assetFiles'; filePaths: string[] };
type ResolveRequest = (context: Context, moduleName: string, platform: string | null) => Resolution;
interface Context {
  originModulePath: string;
  resolveRequest: ResolveRequest;
}

const NM = '/app/node_modules';
const FILES: Record<string, Record<string, string>> = {
  ios: {
    'react-native-safe-area-context': `${NM}/react-native-safe-area-context/src/index.tsx`,
    './Libraries/Text/Text': `${NM}/react-native/Libraries/Text/Text.js`,
    './Libraries/Components/TextInput/TextInput': `${NM}/react-native/Libraries/Components/TextInput/TextInput.js`,
    '../Text/Text': `${NM}/react-native/Libraries/Text/Text.js`,
    'react-native/Libraries/Text/Text': `${NM}/react-native/Libraries/Text/Text.js`,
    'react-native/Libraries/Components/TextInput/TextInput': `${NM}/react-native/Libraries/Components/TextInput/TextInput.js`,
    './Libraries/Components/View/View': `${NM}/react-native/Libraries/Components/View/View.js`,
    './Libraries/Components/Keyboard/KeyboardAvoidingView': `${NM}/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js`,
  },
  web: {
    'react-native-safe-area-context': `${NM}/react-native-safe-area-context/lib/module/index.js`,
    './exports/Text': `${NM}/react-native-web/dist/exports/Text/index.js`,
    './exports/TextInput': `${NM}/react-native-web/dist/exports/TextInput/index.js`,
    './exports/KeyboardAvoidingView': `${NM}/react-native-web/dist/exports/KeyboardAvoidingView/index.js`,
    './exports/View': `${NM}/react-native-web/dist/exports/View/index.js`,
    'react-native-web/dist/exports/Text': `${NM}/react-native-web/dist/exports/Text/index.js`,
    'react-native-web/dist/exports/KeyboardAvoidingView': `${NM}/react-native-web/dist/exports/KeyboardAvoidingView/index.js`,
  },
  'web-node': {
    './exports/Text': `${NM}/react-native-web/dist/cjs/exports/Text/index.js`,
    './exports/TextInput': `${NM}/react-native-web/dist/cjs/exports/TextInput/index.js`,
    './exports/KeyboardAvoidingView': `${NM}/react-native-web/dist/cjs/exports/KeyboardAvoidingView/index.js`,
  },
};

const defaultResolve: ResolveRequest = (_context, moduleName, platform) => {
  const filePath = FILES[platform ?? 'ios']?.[moduleName];
  if (!filePath) throw new Error(`Unable to resolve ${moduleName}`);
  return { type: 'sourceFile', filePath };
};

const APP_FILE = '/app/src/App.tsx';
const RN_INDEX = `${NM}/react-native/index.js`;
const RNW_INDEX = `${NM}/react-native-web/dist/index.js`;

type AnyConfig = { resolver?: Record<string, unknown> };

function resolverOf(config: AnyConfig): ResolveRequest {
  return config.resolver!.resolveRequest as ResolveRequest;
}

function resolve(
  config: AnyConfig,
  moduleName: string,
  platform: string,
  originModulePath = APP_FILE,
): Resolution {
  return resolverOf(config)({ originModulePath, resolveRequest: defaultResolve }, moduleName, platform);
}

const shim = (file: string) => ({ type: 'sourceFile', filePath: path.join(SHIMS_DIR, file) });

describe('withDevicePreview', () => {
  const config = withDevicePreview({ projectRoot: '/app', resolver: { sourceExts: ['ts', 'tsx', 'js'] } });

  it('keeps the rest of the config', () => {
    expect(config.projectRoot).toBe('/app');
    expect(config.resolver.sourceExts).toEqual(['ts', 'tsx', 'js']);
  });

  it('points the shims directory at src/shims', () => {
    expect(SHIMS_DIR.replace(/\\/g, '/')).toMatch(/\/packages\/react-native-device-simulator\/src\/shims$/);
  });

  describe('safe area', () => {
    it.each(['ios', 'web'])('redirects react-native-safe-area-context on %s', (platform) => {
      expect(resolve(config, 'react-native-safe-area-context', platform)).toEqual(shim('safe-area-context.tsx'));
    });

    it('lets the shim import the real module', () => {
      expect(
        resolve(config, 'react-native-safe-area-context', 'web', path.join(SHIMS_DIR, 'safe-area-context.tsx')),
      ).toEqual({ type: 'sourceFile', filePath: FILES.web!['react-native-safe-area-context'] });
    });

    it('fails like the original when the package is not installed', () => {
      const missing = withDevicePreview({ resolver: { resolveRequest: () => { throw new Error('Unable to resolve'); } } });
      expect(() => resolve(missing, 'react-native-safe-area-context', 'ios')).toThrow('Unable to resolve');
    });
  });

  describe('text scaling', () => {
    it('redirects react-native Text and TextInput, from the index and from anywhere else', () => {
      expect(resolve(config, './Libraries/Text/Text', 'ios', RN_INDEX)).toEqual(shim('native/Text.ts'));
      expect(resolve(config, './Libraries/Components/TextInput/TextInput', 'ios', RN_INDEX)).toEqual(
        shim('native/TextInput.ts'),
      );
      // e.g. Animated.Text
      expect(resolve(config, '../Text/Text', 'ios', `${NM}/react-native/Libraries/Animated/components/AnimatedText.js`)).toEqual(
        shim('native/Text.ts'),
      );
      expect(resolve(config, 'react-native/Libraries/Text/Text', 'ios')).toEqual(shim('native/Text.ts'));
    });

    it('redirects react-native-web Text and TextInput (ES modules and CommonJS)', () => {
      expect(resolve(config, './exports/Text', 'web', RNW_INDEX)).toEqual(shim('web/Text.ts'));
      expect(resolve(config, './exports/TextInput', 'web', RNW_INDEX)).toEqual(shim('web/TextInput.ts'));
      expect(resolve(config, './exports/Text', 'web-node', RNW_INDEX)).toEqual(shim('web-cjs/Text.ts'));
      expect(resolve(config, './exports/TextInput', 'web-node', RNW_INDEX)).toEqual(shim('web-cjs/TextInput.ts'));
    });

    it('lets the shims import the originals', () => {
      expect(resolve(config, 'react-native/Libraries/Text/Text', 'ios', path.join(SHIMS_DIR, 'native/Text.ts'))).toEqual({
        type: 'sourceFile',
        filePath: FILES.ios!['react-native/Libraries/Text/Text'],
      });
      expect(resolve(config, 'react-native-web/dist/exports/Text', 'web', path.join(SHIMS_DIR, 'web/Text.ts'))).toEqual({
        type: 'sourceFile',
        filePath: FILES.web!['react-native-web/dist/exports/Text'],
      });
    });

    it('leaves other modules alone', () => {
      expect(resolve(config, './Libraries/Components/View/View', 'ios', RN_INDEX)).toEqual({
        type: 'sourceFile',
        filePath: FILES.ios!['./Libraries/Components/View/View'],
      });
      expect(resolve(config, './exports/View', 'web', RNW_INDEX)).toEqual({
        type: 'sourceFile',
        filePath: FILES.web!['./exports/View'],
      });
    });
  });

  describe('KeyboardAvoidingView', () => {
    it('redirects react-native-web only (React Native has a working implementation)', () => {
      expect(resolve(config, './exports/KeyboardAvoidingView', 'web', RNW_INDEX)).toEqual(
        shim('web/KeyboardAvoidingView.ts'),
      );
      expect(resolve(config, './exports/KeyboardAvoidingView', 'web-node', RNW_INDEX)).toEqual(
        shim('web-cjs/KeyboardAvoidingView.ts'),
      );
      expect(resolve(config, './Libraries/Components/Keyboard/KeyboardAvoidingView', 'ios', RN_INDEX)).toEqual({
        type: 'sourceFile',
        filePath: FILES.ios!['./Libraries/Components/Keyboard/KeyboardAvoidingView'],
      });
    });
  });

  describe('options', () => {
    it('can disable each redirect', () => {
      const off = withDevicePreview({}, { safeArea: false, textScaling: false, keyboardAvoidingView: false });
      expect(resolve(off, 'react-native-safe-area-context', 'ios')).toEqual({
        type: 'sourceFile',
        filePath: FILES.ios!['react-native-safe-area-context'],
      });
      expect(resolve(off, './Libraries/Text/Text', 'ios', RN_INDEX)).toEqual({
        type: 'sourceFile',
        filePath: FILES.ios!['./Libraries/Text/Text'],
      });
      expect(resolve(off, './exports/KeyboardAvoidingView', 'web', RNW_INDEX)).toEqual({
        type: 'sourceFile',
        filePath: FILES.web!['./exports/KeyboardAvoidingView'],
      });
    });

    it('can disable only text scaling', () => {
      const noText = withDevicePreview({}, { textScaling: false });
      expect(resolve(noText, './Libraries/Text/Text', 'ios', RN_INDEX).type).toBe('sourceFile');
      expect((resolve(noText, './Libraries/Text/Text', 'ios', RN_INDEX) as { filePath: string }).filePath).toBe(
        FILES.ios!['./Libraries/Text/Text'],
      );
      expect(resolve(noText, 'react-native-safe-area-context', 'ios')).toEqual(shim('safe-area-context.tsx'));
    });
  });

  describe('chaining', () => {
    it('runs an existing resolveRequest and redirects what it resolves', () => {
      const calls: string[] = [];
      const custom: ResolveRequest = (context, moduleName, platform) => {
        calls.push(moduleName);
        if (moduleName === 'my-text') return { type: 'sourceFile', filePath: `${NM}/react-native/Libraries/Text/Text.js` };
        return context.resolveRequest(context, moduleName, platform);
      };
      const chained = withDevicePreview({ resolver: { resolveRequest: custom } });
      expect(resolve(chained, 'my-text', 'ios')).toEqual(shim('native/Text.ts'));
      expect(resolve(chained, 'react-native-safe-area-context', 'ios')).toEqual(shim('safe-area-context.tsx'));
      expect(calls).toEqual(['my-text', 'react-native-safe-area-context']);
    });

    it('passes non-file resolutions through', () => {
      const empty = withDevicePreview({ resolver: { resolveRequest: () => ({ type: 'empty' }) } });
      expect(resolve(empty, 'react-native-safe-area-context', 'ios')).toEqual({ type: 'empty' });
    });

    it('is not applied twice', () => {
      expect(withDevicePreview(config)).toBe(config);
    });

    it('handles Windows paths', () => {
      const win = withDevicePreview({
        resolver: {
          resolveRequest: () => ({ type: 'sourceFile', filePath: 'C:\\app\\node_modules\\react-native\\Libraries\\Text\\Text.js' }),
        },
      });
      // Only meaningful where path.sep is "\\", but the suffix match must not depend on it.
      const result = resolve(win, './Libraries/Text/Text', 'ios', RN_INDEX) as { filePath: string };
      expect(result.filePath).toBe(path.join(SHIMS_DIR, 'native/Text.ts'));
    });
  });
});
