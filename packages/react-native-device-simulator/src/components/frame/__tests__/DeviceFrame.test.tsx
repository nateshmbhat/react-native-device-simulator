import * as React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { presetFromCustomDevice, defaultCustomDevice } from '../../../presets';
import { galaxyZFold8, iPhone17Pro, iPhoneSE3rdGen, largeDesktopWindow, pixel10 } from '../../../presets/generated';
import type { DevicePreset, Orientation } from '../../../types';
import { DeviceFrame, type DeviceFrameProps } from '../DeviceFrame';
import { paddingFor, screenSizeFor, keyboardHeightFor } from '../../../core/geometry';

let mounts = 0;
let unmounts = 0;

function App() {
  React.useEffect(() => {
    mounts += 1;
    return () => {
      unmounts += 1;
    };
  }, []);
  return <Text>app</Text>;
}

function propsFor(
  preset: DevicePreset,
  orientation: Orientation,
  options: { frame?: boolean; keyboard?: boolean; systemUi?: boolean; color?: string } = {},
): Omit<DeviceFrameProps, 'children'> {
  return {
    preset,
    orientation,
    screenSize: screenSizeFor(preset, orientation),
    insets: paddingFor(preset, orientation),
    showFrame: options.frame ?? true,
    showSystemUi: options.systemUi ?? true,
    keyboardHeight: options.keyboard ? (keyboardHeightFor(preset, orientation) ?? 300) : 0,
    systemUiColor: options.color ?? '#000000',
  };
}

beforeEach(() => {
  mounts = 0;
  unmounts = 0;
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('DeviceFrame', () => {
  it('never remounts the app across mode changes', async () => {
    const view = (props: Omit<DeviceFrameProps, 'children'>) => (
      <DeviceFrame {...props}>
        <App />
      </DeviceFrame>
    );
    await render(view(propsFor(iPhone17Pro, 'portrait')));
    expect(mounts).toBe(1);

    const custom = presetFromCustomDevice(defaultCustomDevice);
    const steps: Omit<DeviceFrameProps, 'children'>[] = [
      propsFor(iPhone17Pro, 'landscape'),
      propsFor(iPhone17Pro, 'landscape', { frame: false }),
      propsFor(iPhone17Pro, 'portrait', { frame: false, keyboard: true }),
      propsFor(iPhone17Pro, 'portrait', { keyboard: true }),
      propsFor(iPhone17Pro, 'portrait', { keyboard: true, systemUi: false, color: '#ffffff' }),
      propsFor(iPhoneSE3rdGen, 'portrait'),
      propsFor(pixel10, 'landscape', { keyboard: true }),
      propsFor(galaxyZFold8, 'portrait'),
      propsFor(galaxyZFold8, 'landscape', { frame: false }),
      propsFor(custom, 'portrait'),
      propsFor(custom, 'landscape', { keyboard: true }),
      propsFor(largeDesktopWindow, 'portrait'),
      { ...propsFor(largeDesktopWindow, 'portrait', { frame: false }), screenSize: { width: 1000, height: 700 } },
      propsFor(iPhone17Pro, 'portrait'),
    ];
    for (const props of steps) {
      await screen.rerender(view(props));
      await act(() => {
        jest.runOnlyPendingTimers();
      });
    }
    expect(screen.getByText('app')).toBeTruthy();
    expect(mounts).toBe(1);
    expect(unmounts).toBe(0);
  });

  it('renders the bare screen at exactly the screen size when the frame is hidden', async () => {
    await render(
      <DeviceFrame {...propsFor(iPhone17Pro, 'portrait', { frame: false, systemUi: false })}>
        <App />
      </DeviceFrame>,
    );
    const root = screen.toJSON() as unknown as { props: { style: unknown } };
    expect(flatten(root.props.style)).toMatchObject({ width: 402, height: 874 });
  });

  it('sizes the root to the rotated body in landscape', async () => {
    await render(
      <DeviceFrame {...propsFor(iPhone17Pro, 'landscape')}>
        <App />
      </DeviceFrame>,
    );
    const root = screen.toJSON() as unknown as { props: { style: unknown } };
    expect(flatten(root.props.style)).toMatchObject({ width: 908, height: 436 });
  });
});

function flatten(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatten));
  return (style as Record<string, unknown>) ?? {};
}
