// Metro redirects react-native's `Libraries/Text/Text` here (see /metro).
import type * as React from 'react';
import { interopDefault } from '../interop';
import { createScaledText } from '../text-scaling';

const Text = interopDefault(require('react-native/Libraries/Text/Text'));
// `TextAncestorContext` (RN >= 0.81) was called `TextAncestor` before. Metro
// treats requires inside try/catch as optional, so either layout bundles.
let TextAncestorContext: unknown;
try {
  TextAncestorContext = interopDefault(require('react-native/Libraries/Text/TextAncestorContext'));
} catch {
  TextAncestorContext = interopDefault(require('react-native/Libraries/Text/TextAncestor'));
}
const flattenStyle = interopDefault(require('react-native/Libraries/StyleSheet/flattenStyle'));

export default createScaledText(Text, { textAncestorContext: TextAncestorContext as React.Context<boolean>, flattenStyle, displayName: 'Text' });
