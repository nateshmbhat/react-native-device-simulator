import * as React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DeviceSimulator } from '../../DeviceSimulator';
import { deviceSimulator } from '../../../core/store';
import { defaultSettings } from '../../../core/simulation';

let mounts = 0;
function App() {
  React.useEffect(() => {
    mounts++;
  }, []);
  return <Text>app content</Text>;
}

beforeEach(() => {
  mounts = 0;
  deviceSimulator.update(defaultSettings);
});

async function renderPreview() {
  return await render(
    <DeviceSimulator enabled storage={null}>
      <App />
    </DeviceSimulator>,
  );
}

describe('Toolbar', () => {
  it('switches tabs and persists the selection in settings', async () => {
    await renderPreview();
    await fireEvent.press(screen.getAllByRole('tab', { name: 'Display' })[0]!);
    expect(deviceSimulator.getSettings().toolbar.tab).toBe('display');
    expect(screen.getByText('Appearance')).toBeTruthy();
    await fireEvent.press(screen.getAllByRole('radio', { name: 'Dark' })[0]!);
    expect(deviceSimulator.getSettings().colorScheme).toBe('dark');
  });

  it('selects a device from the picker', async () => {
    await renderPreview();
    const target = deviceSimulator.getPresets().find((p) => p.id !== deviceSimulator.getSettings().deviceId)!;
    await fireEvent.press(screen.getAllByRole('button', { name: new RegExp(`^${target.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},`) })[0]!);
    expect(deviceSimulator.getSettings().deviceId).toBe(target.id);
  });

  it('never remounts the app when the toolbar moves, hides or the simulation toggles', async () => {
    await renderPreview();
    expect(mounts).toBe(1);
    await act(() => deviceSimulator.update({ toolbar: { ...deviceSimulator.getSettings().toolbar, position: 'left' } }));
    await act(() => deviceSimulator.update({ toolbar: { ...deviceSimulator.getSettings().toolbar, position: 'bottom' } }));
    await act(() => deviceSimulator.update({ toolbar: { ...deviceSimulator.getSettings().toolbar, visible: false } }));
    await act(() => deviceSimulator.setEnabled(false));
    expect(screen.getByRole('button', { name: 'Turn device simulator on' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Turn device simulator on' }));
    expect(deviceSimulator.getSettings().isEnabled).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: 'Show device simulator toolbar' }));
    expect(deviceSimulator.getSettings().toolbar.visible).toBe(true);
    await act(() => deviceSimulator.setDevice(deviceSimulator.getPresets()[0]!.id));
    await act(() => deviceSimulator.toggleOrientation());
    expect(screen.getByText('app content')).toBeTruthy();
    expect(mounts).toBe(1);
  });
});
