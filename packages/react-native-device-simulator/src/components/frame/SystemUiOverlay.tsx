import * as React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import type { EdgeInsets, Size, SystemUiSpec } from '../../types';
import { svgNaturalSize } from './svg';
import { SvgArtwork } from './SvgArtwork';

export interface SystemUiOverlayProps {
  spec: SystemUiSpec | undefined;
  /** Screen size, current orientation. */
  screenSize: Size;
  /** Safe area insets, current orientation. The bars fill the top/bottom insets. */
  insets: EdgeInsets;
  statusBarColor: string;
  navigationBarColor: string;
}

type Slot = 'leading' | 'center' | 'trailing';

/**
 * Status bar and navigation bar artwork, drawn over the app. Bars have no
 * height of their own: the status bar fills the top safe area, the navigation
 * bar the bottom one, so they follow the orientation (an iPhone in landscape
 * has no top inset, hence no status bar).
 */
export function SystemUiOverlay({ spec, screenSize, insets, statusBarColor, navigationBarColor }: SystemUiOverlayProps) {
  const status = spec?.statusBar;
  const nav = spec?.navigationBar;
  const edgeInset = status?.inset ?? 16;
  const showStatus = !!status && insets.top > 0;
  const showNav = !!nav && insets.bottom > 0;
  return (
    <View style={[StyleSheet.absoluteFill, styles.noTouch]}>
      {showStatus ? (
        <View key="status" style={[styles.bar, { top: 0, height: insets.top, width: screenSize.width }]}>
          <Artwork key="leading" xml={status.leading} slot="leading" inset={edgeInset} color={statusBarColor} />
          <Artwork key="center" xml={status.center} slot="center" inset={edgeInset} color={statusBarColor} />
          <Artwork key="trailing" xml={status.trailing} slot="trailing" inset={edgeInset} color={statusBarColor} />
        </View>
      ) : null}
      {showNav ? (
        <View key="nav" style={[styles.bar, { bottom: 0, height: insets.bottom, width: screenSize.width }]}>
          <Artwork key="leading" xml={nav.leading} slot="leading" inset={edgeInset} bottom={nav.bottomInset} color={navigationBarColor} />
          <Artwork key="center" xml={nav.center} slot="center" inset={edgeInset} bottom={nav.bottomInset} color={navigationBarColor} />
          <Artwork key="trailing" xml={nav.trailing} slot="trailing" inset={edgeInset} bottom={nav.bottomInset} color={navigationBarColor} />
        </View>
      ) : null}
    </View>
  );
}

interface ArtworkProps {
  xml: string | undefined;
  slot: Slot;
  inset: number;
  /** Distance from the bar's bottom edge; vertically centred when absent. */
  bottom?: number;
  color: string;
}

/** One piece of artwork at its natural size, never stretched. */
const Artwork = React.memo(function Artwork({ xml, slot, inset, bottom, color }: ArtworkProps) {
  const size = React.useMemo(() => (xml ? svgNaturalSize(xml) : null), [xml]);
  if (!xml || !size) return null;
  const horizontal: ViewStyle =
    slot === 'leading' ? { left: inset } : slot === 'trailing' ? { right: inset } : { left: 0, right: 0, alignItems: 'center' };
  const vertical: ViewStyle = bottom != null ? { bottom, height: size.height } : { top: 0, bottom: 0, justifyContent: 'center' };
  return (
    <View style={[styles.slot, horizontal, vertical]}>
      <SvgArtwork xml={xml} width={size.width} height={size.height} color={color} />
    </View>
  );
});

const styles = StyleSheet.create({
  noTouch: { pointerEvents: 'none' },
  bar: { position: 'absolute', left: 0 },
  slot: { position: 'absolute' },
});
