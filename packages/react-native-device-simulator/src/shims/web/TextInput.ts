// Metro redirects react-native-web's `exports/TextInput` here (see /metro).
import { interopDefault } from '../interop';
import { createScaledText } from '../text-scaling';

const TextInput = interopDefault(require('react-native-web/dist/exports/TextInput'));
const StyleSheet = interopDefault(require('react-native-web/dist/exports/StyleSheet'));

export default createScaledText(TextInput, {
  isInput: true,
  flattenStyle: (style) => StyleSheet.flatten(style),
  displayName: 'TextInput',
});
