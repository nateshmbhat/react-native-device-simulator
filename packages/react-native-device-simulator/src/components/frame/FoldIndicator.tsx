import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { DisplayFeature, Orientation, Size } from '../../types';
import { orientFeatureBounds } from './layout';

export interface FoldIndicatorProps {
  features: readonly DisplayFeature[] | undefined;
  portraitScreen: Size;
  orientation: Orientation;
  /** Unique, XML-safe prefix for gradient ids. */
  idPrefix: string;
}

/** Half-width of the soft crease shading around a fold line. */
const CREASE = 9;

/**
 * A subtle crease along folds and a dark band over hinges, drawn over the app.
 * Display features are given in portrait and rotated with the device.
 */
export function FoldIndicator({ features, portraitScreen, orientation, idPrefix }: FoldIndicatorProps) {
  if (!features?.length) return null;
  return (
    <View style={[StyleSheet.absoluteFill, styles.noTouch]}>
      {features.map((feature, index) => {
        if (feature.type !== 'fold' && feature.type !== 'hinge') return null;
        const rect = orientFeatureBounds(feature, portraitScreen, orientation);
        const vertical = rect.height >= rect.width;
        const thickness = vertical ? rect.width : rect.height;
        if (feature.type === 'hinge' && thickness > 0) {
          return (
            <View
              key={index}
              style={[styles.hinge, { left: rect.x, top: rect.y, width: rect.width, height: rect.height }]}
            />
          );
        }
        const id = `${idPrefix}fold${index}`;
        const band = thickness + CREASE * 2;
        const width = vertical ? band : rect.width;
        const height = vertical ? rect.height : band;
        return (
          <View
            key={index}
            style={[
              styles.crease,
              vertical
                ? { left: rect.x - CREASE, top: rect.y, width, height }
                : { left: rect.x, top: rect.y - CREASE, width, height },
            ]}
          >
            <Svg width={width} height={height}>
              <Defs>
                <LinearGradient id={id} x1="0" y1="0" x2={vertical ? '1' : '0'} y2={vertical ? '0' : '1'}>
                  <Stop offset="0" stopColor="#000" stopOpacity={0} />
                  <Stop offset="0.38" stopColor="#000" stopOpacity={0.05} />
                  <Stop offset="0.5" stopColor="#000" stopOpacity={0.16} />
                  <Stop offset="0.56" stopColor="#fff" stopOpacity={0.1} />
                  <Stop offset="0.7" stopColor="#000" stopOpacity={0.04} />
                  <Stop offset="1" stopColor="#000" stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect x={0} y={0} width={width} height={height} fill={`url(#${id})`} />
            </Svg>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  noTouch: { pointerEvents: 'none' },
  hinge: { position: 'absolute', backgroundColor: '#0b0b0d' },
  crease: { position: 'absolute' },
});
