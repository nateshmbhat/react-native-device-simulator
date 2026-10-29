import * as React from 'react';

/**
 * react-native-web's `KeyboardAvoidingView` is a plain `View`: browsers have
 * no keyboard events. The Metro helper replaces it on web with this port of
 * React Native's implementation, so `behavior="padding" | "height" |
 * "position"` reacts to the simulated keyboard (delivered through the patched
 * `Keyboard` module). Without a simulated keyboard no events arrive and it
 * renders like a plain `View`, so it is safe outside the preview too.
 */

interface KeyboardMetrics {
  screenY: number;
}
interface KeyboardEventLike {
  endCoordinates: KeyboardMetrics;
}
interface Layout {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface LayoutEvent {
  nativeEvent: { layout: Layout };
}

interface KeyboardLike {
  addListener(type: string, listener: (event: KeyboardEventLike) => void): { remove(): void } | undefined;
}

export interface KeyboardAvoidingViewProps {
  behavior?: 'height' | 'position' | 'padding' | null;
  contentContainerStyle?: unknown;
  enabled?: boolean | null;
  keyboardVerticalOffset?: number;
  style?: unknown;
  onLayout?: (event: LayoutEvent) => void;
  children?: React.ReactNode;
  [key: string]: unknown;
}

/** The part of a view at `frame` (parent coordinates) covered by the keyboard. */
export function relativeKeyboardHeight(
  frame: Layout | null,
  keyboard: KeyboardMetrics | null,
  behavior: KeyboardAvoidingViewProps['behavior'],
  keyboardVerticalOffset: number,
  currentBottom: number,
): number {
  if (!frame || !keyboard) return 0;
  const keyboardY = keyboard.screenY - keyboardVerticalOffset;
  if (behavior === 'height') return Math.max(currentBottom + frame.y + frame.height - keyboardY, 0);
  return Math.max(frame.y + frame.height - keyboardY, 0);
}

export function createKeyboardAvoidingView(
  View: React.ComponentType<Record<string, unknown>>,
  Keyboard: KeyboardLike,
): React.ComponentType<KeyboardAvoidingViewProps> {
  function KeyboardAvoidingView(props: KeyboardAvoidingViewProps) {
    const {
      behavior,
      children,
      contentContainerStyle,
      enabled = true,
      keyboardVerticalOffset = 0,
      style,
      onLayout,
      ...rest
    } = props;
    const [bottom, setBottomState] = React.useState(0);
    const [initialHeight, setInitialHeight] = React.useState(0);
    const state = React.useRef({
      frame: null as Layout | null,
      keyboard: null as KeyboardMetrics | null,
      bottom: 0,
      behavior,
      offset: keyboardVerticalOffset,
    });
    React.useEffect(() => {
      state.current.behavior = behavior;
      state.current.offset = keyboardVerticalOffset;
    });

    const update = React.useCallback(() => {
      const s = state.current;
      const next = relativeKeyboardHeight(s.frame, s.keyboard, s.behavior, s.offset, s.bottom);
      if (next === s.bottom) return;
      s.bottom = next;
      setBottomState(next);
    }, []);

    React.useEffect(() => {
      const show = (event: KeyboardEventLike) => {
        state.current.keyboard = event.endCoordinates;
        update();
      };
      const hide = () => {
        state.current.keyboard = null;
        update();
      };
      const subs = [Keyboard.addListener('keyboardWillShow', show), Keyboard.addListener('keyboardWillHide', hide)];
      return () => subs.forEach((sub) => sub?.remove());
    }, [update]);

    const handleLayout = (event: LayoutEvent) => {
      const s = state.current;
      const previous = s.frame;
      s.frame = event.nativeEvent.layout;
      setInitialHeight((h) => h || event.nativeEvent.layout.height);
      if (!previous || previous.height !== s.frame.height) update();
      onLayout?.(event);
    };

    const bottomHeight = enabled === false ? 0 : bottom;
    switch (behavior) {
      case 'height': {
        // Only constrain the height while the keyboard is present, otherwise
        // the view could never grow back.
        const heightStyle =
          initialHeight > 0 && bottomHeight > 0 ? { height: initialHeight - bottomHeight, flex: 0 } : null;
        return (
          <View style={[style, heightStyle]} onLayout={handleLayout} {...rest}>
            {children}
          </View>
        );
      }
      case 'position':
        return (
          <View style={style} onLayout={handleLayout} {...rest}>
            <View style={[contentContainerStyle, { bottom: bottomHeight }]}>{children}</View>
          </View>
        );
      case 'padding':
        return (
          <View style={[style, { paddingBottom: bottomHeight }]} onLayout={handleLayout} {...rest}>
            {children}
          </View>
        );
      default:
        return (
          <View style={style} onLayout={handleLayout} {...rest}>
            {children}
          </View>
        );
    }
  }
  KeyboardAvoidingView.displayName = 'KeyboardAvoidingView';
  return KeyboardAvoidingView;
}
