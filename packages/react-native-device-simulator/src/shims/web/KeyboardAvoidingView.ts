// Metro redirects react-native-web's `exports/KeyboardAvoidingView` here (see /metro).
import { createKeyboardAvoidingView } from '../keyboard-avoiding-view';
import { interopDefault } from '../interop';

const View = interopDefault(require('react-native-web/dist/exports/View'));
const Keyboard = interopDefault(require('react-native-web/dist/exports/Keyboard'));

export default createKeyboardAvoidingView(View, Keyboard);
