import { useEffect, useState } from 'react';
import { Appearance, Dimensions, PixelRatio } from 'react-native';

function read() {
  return {
    screen: Dimensions.get('screen'),
    window: Dimensions.get('window'),
    pixelRatio: PixelRatio.get(),
    fontScale: PixelRatio.getFontScale(),
    /** Layout size of a 100pt box, in physical pixels. */
    px100: PixelRatio.getPixelSizeForLayoutSize(100),
    appearance: Appearance.getColorScheme() ?? null,
  };
}

/**
 * Imperative APIs (`Dimensions.get`, `PixelRatio`, `Appearance`), re-read on
 * every `Dimensions` / `Appearance` change event.
 */
export function useDisplayMetrics() {
  const [metrics, setMetrics] = useState(read);
  useEffect(() => {
    const update = () => setMetrics(read());
    update();
    const dimensions = Dimensions.addEventListener('change', update);
    const appearance = Appearance.addChangeListener(update);
    return () => {
      dimensions.remove();
      appearance.remove();
    };
  }, []);
  return metrics;
}
