import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { PreviewScreenContext, type PreviewScreenContextValue } from '../../previewScreenContext';
import { defaultSettings, resolveSimulation } from '../../core/simulation';
import { allPresets } from '../../presets';
import { createScaledText, scaledTextStyle, textScalingFor, type TextScaling } from '../text-scaling';
import ScaledText from '../native/Text';
import ScaledTextInput from '../native/TextInput';

const flatten = (style: unknown) => StyleSheet.flatten(style as never) as Record<string, unknown>;

function previewValue(fontScale: number | null, options: { hostFontScale?: number; boldText?: boolean; active?: boolean } = {}) {
  const { hostFontScale = 1, boldText = false, active = true } = options;
  const simulation = resolveSimulation({ ...defaultSettings, fontScale }, allPresets);
  return {
    active,
    simulation,
    fontScaleMultiplier: active && fontScale != null ? fontScale / hostFontScale : 1,
    boldText: active && boldText,
  } satisfies PreviewScreenContextValue;
}

function Preview({ value, children }: { value: PreviewScreenContextValue | null; children: React.ReactNode }) {
  return <PreviewScreenContext.Provider value={value}>{children}</PreviewScreenContext.Provider>;
}

describe('textScalingFor', () => {
  it('is null outside a preview or when nothing changes', () => {
    expect(textScalingFor(null)).toBeNull();
    expect(textScalingFor(previewValue(null))).toBeNull();
  });

  it('derives the host scale from the multiplier', () => {
    expect(textScalingFor(previewValue(2, { hostFontScale: 1.25 }))).toEqual({ fontScale: 2, hostFontScale: 1.25, boldText: false });
    expect(textScalingFor(previewValue(null, { boldText: true }))).toEqual({ fontScale: 1, hostFontScale: 1, boldText: true });
  });
});

describe('scaledTextStyle', () => {
  const x2: TextScaling = { fontScale: 2, hostFontScale: 1, boldText: false };

  it('scales fontSize (14 by default), lineHeight and letterSpacing', () => {
    expect(scaledTextStyle({}, x2, false, flatten)).toEqual({ fontSize: 28 });
    expect(scaledTextStyle({ style: { fontSize: 20, lineHeight: 24, letterSpacing: 0.5 } }, x2, false, flatten)).toEqual({
      fontSize: 40,
      lineHeight: 48,
      letterSpacing: 1,
    });
    expect(scaledTextStyle({ style: [{ fontSize: 10 }, { lineHeight: 12 }] }, x2, false, flatten)).toEqual({
      fontSize: 20,
      lineHeight: 24,
    });
  });

  it('only scales what nested text sets itself', () => {
    expect(scaledTextStyle({}, x2, true, flatten)).toBeNull();
    expect(scaledTextStyle({ style: { fontSize: 10 } }, x2, true, flatten)).toEqual({ fontSize: 20 });
  });

  it('only applies the part of the scale the platform does not already apply', () => {
    // Host already scales by 1.5 natively.
    expect(scaledTextStyle({}, { fontScale: 3, hostFontScale: 1.5, boldText: false }, false, flatten)).toEqual({ fontSize: 28 });
  });

  it('respects allowFontScaling={false}', () => {
    expect(scaledTextStyle({ allowFontScaling: false, style: { fontSize: 20 } }, x2, false, flatten)).toBeNull();
  });

  it('caps the scale with maxFontSizeMultiplier', () => {
    expect(scaledTextStyle({ maxFontSizeMultiplier: 1.5 }, x2, false, flatten)).toEqual({ fontSize: 21 });
    // Host 1.25 is applied natively (below the cap); the result is capped at 1.5x.
    expect(
      scaledTextStyle({ maxFontSizeMultiplier: 1.5 }, { fontScale: 2, hostFontScale: 1.25, boldText: false }, false, flatten),
    ).toEqual({ fontSize: (14 * 1.5) / 1.25 });
    // 0 means "no cap".
    expect(scaledTextStyle({ maxFontSizeMultiplier: 0 }, x2, false, flatten)).toEqual({ fontSize: 28 });
    // A cap at or below the host scale leaves nothing to do.
    expect(scaledTextStyle({ maxFontSizeMultiplier: 1 }, x2, false, flatten)).toBeNull();
  });

  it('bolds text lighter than semibold', () => {
    const bold: TextScaling = { fontScale: 1, hostFontScale: 1, boldText: true };
    expect(scaledTextStyle({}, bold, false, flatten)).toEqual({ fontWeight: 'bold' });
    expect(scaledTextStyle({}, bold, true, flatten)).toBeNull(); // inherits
    expect(scaledTextStyle({ style: { fontWeight: '300' } }, bold, true, flatten)).toEqual({ fontWeight: 'bold' });
    expect(scaledTextStyle({ style: { fontWeight: 'normal' } }, bold, false, flatten)).toEqual({ fontWeight: 'bold' });
    expect(scaledTextStyle({ style: { fontWeight: 500 } }, bold, false, flatten)).toEqual({ fontWeight: 'bold' });
    expect(scaledTextStyle({ style: { fontWeight: '600' } }, bold, false, flatten)).toBeNull();
    expect(scaledTextStyle({ style: { fontWeight: 'bold' } }, bold, false, flatten)).toBeNull();
    expect(scaledTextStyle({ style: { fontWeight: 'heavy' } }, bold, false, flatten)).toBeNull();
  });

  it('ignores non-numeric lengths', () => {
    expect(scaledTextStyle({ style: { fontSize: '1rem' as never } }, x2, false, flatten)).toBeNull();
  });
});

describe('createScaledText', () => {
  const hostStyle = () => flatten(screen.getByTestId('t').props.style);

  it('passes the original props through outside a preview', async () => {
    const style = { color: 'red' };
    await render(
      <ScaledText testID="t" style={style}>
        Hello
      </ScaledText>,
    );
    expect(screen.getByTestId('t').props.style).toBe(style);
  });

  it('passes the original props through when the preview changes nothing', async () => {
    const style = { color: 'red' };
    await render(
      <Preview value={previewValue(null)}>
        <ScaledText testID="t" style={style}>
          Hello
        </ScaledText>
      </Preview>,
    );
    expect(screen.getByTestId('t').props.style).toBe(style);
  });

  it('scales and bolds text inside an active preview', async () => {
    await render(
      <Preview value={previewValue(2, { boldText: true })}>
        <ScaledText testID="t" style={{ fontSize: 16, color: 'red' }}>
          Hello
        </ScaledText>
      </Preview>,
    );
    expect(hostStyle()).toEqual({ fontSize: 32, color: 'red', fontWeight: 'bold' });
  });

  it('does nothing in an inactive preview', async () => {
    await render(
      <Preview value={previewValue(2, { active: false })}>
        <ScaledText testID="t" style={{ fontSize: 16 }}>
          Hello
        </ScaledText>
      </Preview>,
    );
    expect(hostStyle()).toEqual({ fontSize: 16 });
  });

  it('scales TextInput and keeps its statics', async () => {
    const { default: TextInput } = jest.requireActual<{ default: { State: unknown } }>(
      'react-native/Libraries/Components/TextInput/TextInput',
    );
    expect((ScaledTextInput as unknown as { State: unknown }).State).toBeDefined();
    expect((ScaledTextInput as unknown as { displayName: string }).displayName).toBe('TextInput');
    expect(TextInput).toBeDefined();
    await render(
      <Preview value={previewValue(1.5)}>
        <ScaledTextInput testID="t" style={{ fontSize: 20 }} />
      </Preview>,
    );
    expect(hostStyle()).toEqual({ fontSize: 30 });
  });

  it('forwards refs (ref as a prop) and copies statics and displayName', async () => {
    function Original({ ref, ...props }: { ref?: React.Ref<unknown>; style?: unknown; testID?: string }) {
      return <View ref={ref as never} {...(props as object)} />;
    }
    Original.displayName = 'Original';
    (Original as unknown as { helper: string }).helper = 'kept';
    const Scaled = createScaledText(Original, { flattenStyle: flatten, displayName: 'Fallback' });
    expect(Scaled.displayName).toBe('Original');
    expect((Scaled as unknown as { helper: string }).helper).toBe('kept');

    const ref = React.createRef<unknown>();
    await render(
      <Preview value={previewValue(2)}>
        <Scaled ref={ref} testID="t" />
      </Preview>,
    );
    expect(ref.current).not.toBeNull();
    expect(hostStyle()).toEqual({ fontSize: 28 });
  });

  it('treats text inside text as nested', async () => {
    const Ancestor = React.createContext(false);
    function Original({ children, ...props }: { children?: React.ReactNode; style?: unknown; testID?: string }) {
      return (
        <Ancestor.Provider value>
          <View {...(props as object)}>{children}</View>
        </Ancestor.Provider>
      );
    }
    const Scaled = createScaledText(Original, { flattenStyle: flatten, displayName: 'T', textAncestorContext: Ancestor });
    await render(
      <Preview value={previewValue(2)}>
        <Scaled testID="outer">
          <Scaled testID="inner" />
          <Scaled testID="sized" style={{ fontSize: 10 }} />
        </Scaled>
      </Preview>,
    );
    expect(flatten(screen.getByTestId('outer').props.style)).toEqual({ fontSize: 28 });
    expect(screen.getByTestId('inner').props.style).toBeUndefined();
    expect(flatten(screen.getByTestId('sized').props.style)).toEqual({ fontSize: 20 });
  });

  it('does not remount children when the preview is toggled', async () => {
    let mounts = 0;
    function Child() {
      React.useEffect(() => {
        mounts++;
      }, []);
      return null;
    }
    const tree = (value: PreviewScreenContextValue | null) => (
      <Preview value={value}>
        <ScaledText testID="t">
          <Child />
        </ScaledText>
      </Preview>
    );
    await render(tree(null));
    await screen.rerender(tree(previewValue(2, { boldText: true })));
    await screen.rerender(tree(null));
    expect(mounts).toBe(1);
  });
});
