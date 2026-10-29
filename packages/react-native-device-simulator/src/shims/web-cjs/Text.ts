// Metro redirects react-native-web's `exports/Text` here (see /metro).
import { interopDefault } from '../interop';
import { createScaledText } from '../text-scaling';

const Text = interopDefault(require('react-native-web/dist/cjs/exports/Text'));
const TextAncestorContext = interopDefault(require('react-native-web/dist/cjs/exports/Text/TextAncestorContext'));
const StyleSheet = interopDefault(require('react-native-web/dist/cjs/exports/StyleSheet'));

export default createScaledText(Text, {
  textAncestorContext: TextAncestorContext,
  flattenStyle: (style) => StyleSheet.flatten(style),
  displayName: 'Text',
});
