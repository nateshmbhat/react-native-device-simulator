// Metro redirects react-native's `Libraries/Components/TextInput/TextInput` here (see /metro).
import { interopDefault } from '../interop';
import { createScaledText } from '../text-scaling';

const TextInput = interopDefault(require('react-native/Libraries/Components/TextInput/TextInput'));
const flattenStyle = interopDefault(require('react-native/Libraries/StyleSheet/flattenStyle'));

export default createScaledText(TextInput, { isInput: true, flattenStyle, displayName: 'TextInput' });
