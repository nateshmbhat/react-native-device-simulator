import * as React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { parse, SvgAst } from 'react-native-svg';

export interface SvgArtworkProps {
  xml: string;
  width: number;
  height: number;
  /** Resolves `currentColor`. */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Renders an SVG document string. Like `SvgXml`, but parses once per document
 * and does not forward the `xml` source to the host `<svg>` (on web `SvgXml`
 * copies the whole document into an attribute). Malformed artwork renders
 * nothing instead of throwing.
 */
export const SvgArtwork = React.memo(function SvgArtwork({ xml, width, height, color, style }: SvgArtworkProps) {
  const ast = React.useMemo(() => {
    try {
      return parse(xml);
    } catch {
      return null;
    }
  }, [xml]);
  if (!ast) return null;
  return <SvgAst ast={ast} override={{ width, height, color, style }} />;
});
