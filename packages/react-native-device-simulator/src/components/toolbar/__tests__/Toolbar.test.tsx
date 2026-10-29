import * as React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DevicePreview } from '../../DevicePreview';
import { devicePreview } from '../../../core/store';
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
  devicePreview.update(defaultSettings);
});

async function renderPreview() {
  return await render(
    <DevicePreview enabled storage={null}>
      <App />
    </DevicePreview>,
  );
}

describe('Toolbar', () => {
  it('switches tabs and persists the selection in settings', async () => {
    await renderPreview();
    await fireEvent.press(screen.getAllByRole('tab', { name: 'Display' })[0]!);
    expect(devicePreview.getSettings().toolbar.tab).toBe('display');
    expect(screen.getByText('Appearance')).toBeTruthy();
    await fireEvent.press(screen.getAllByRole('radio', { name: 'Dark' })[0]!);
    expect(devicePreview.getSettings().colorScheme).toBe('dark');
  });

  it('selects a device from the picker', async () => {
    await renderPreview();
    const target = devicePreview.getPresets().find((p) => p.id !== devicePreview.getSettings().deviceId)!;
    await fireEvent.press(screen.getAllByRole('button', { name: new RegExp(`^${target.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},`) })[0]!);
    expect(devicePreview.getSettings().deviceId).toBe(target.id);
  });

  it('never remounts the app when the toolbar moves, hides or the simulation toggles', async () => {
    await renderPreview();
    expect(mounts).toBe(1);
    await act(() => devicePreview.update({ toolbar: { ...devicePreview.getSettings().toolbar, position: 'left' } }));
    await act(() => devicePreview.update({ toolbar: { ...devicePreview.getSettings().toolbar, position: 'bottom' } }));
    await act(() => devicePreview.update({ toolbar: { ...devicePreview.getSettings().toolbar, visible: false } }));
    await act(() => devicePreview.setEnabled(false));
    expect(screen.getByRole('button', { name: 'Turn device preview on' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Turn device preview on' }));
    expect(devicePreview.getSettings().isEnabled).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: 'Show device preview toolbar' }));
    expect(devicePreview.getSettings().toolbar.visible).toBe(true);
    await act(() => devicePreview.setDevice(devicePreview.getPresets()[0]!.id));
    await act(() => devicePreview.toggleOrientation());
    expect(screen.getByText('app content')).toBeTruthy();
    expect(mounts).toBe(1);
  });
});
