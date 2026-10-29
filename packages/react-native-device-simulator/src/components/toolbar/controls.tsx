import * as React from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Icon, type IconName } from './icons';
import { radius, space, type, useToolbarTheme, type ToolbarPalette } from './theme';

/** Pressable state, including the hover/focus flags react-native-web adds. */
type PressState = PressableStateCallbackType & { hovered?: boolean; focused?: boolean };

function surfaceFor(p: ToolbarPalette, state: PressState, base = p.surface): string {
  if (state.pressed) return p.surfacePressed;
  if (state.hovered) return p.surfaceHover;
  return base;
}

/**
 * Native tooltip on web (react-native-web does not forward `title`). Returns a
 * ref callback that sets the attribute on the DOM node; undefined elsewhere.
 */
export function webTitle(title: string): ((node: unknown) => void) | undefined {
  if (Platform.OS !== 'web') return undefined;
  return (node) => {
    (node as { setAttribute?: (k: string, v: string) => void } | null)?.setAttribute?.('title', title);
  };
}

const webOnly = <T,>(style: T): T | undefined => (Platform.OS === 'web' ? style : undefined);
const cursorPointer = webOnly({ cursor: 'pointer' } as ViewStyle);
const noSelect = webOnly({ userSelect: 'none' } as ViewStyle);

// -----------------------------------------------------------------------------
// Layout

export function Section({
  title,
  right,
  children,
  style,
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const p = useToolbarTheme();
  return (
    <View style={[styles.section, style]}>
      {title ? (
        <View style={styles.sectionHeader}>
          <Text style={[type.caption, { color: p.textFaint }]} accessibilityRole="header" numberOfLines={1}>
            {title}
          </Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** A labelled line: icon, label (+ description) on the left, a control on the right. */
export function Row({
  icon,
  label,
  description,
  children,
  disabled,
}: {
  icon?: IconName;
  label: string;
  description?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}) {
  const p = useToolbarTheme();
  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      {icon ? (
        <View style={styles.rowIcon}>
          <Icon name={icon} size={16} color={p.textMuted} />
        </View>
      ) : null}
      <View style={styles.rowText}>
        <Text style={[type.body, { color: p.text }]} numberOfLines={1}>
          {label}
        </Text>
        {description ? (
          <Text style={[type.small, { color: p.textMuted, marginTop: 1 }]} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/** A labelled switch line; the whole row toggles. */
export function SwitchRow({
  icon,
  label,
  description,
  value,
  onValueChange,
  disabled,
}: {
  icon?: IconName;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const p = useToolbarTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={(s: PressState) => [
        styles.pressRow,
        cursorPointer,
        { backgroundColor: !disabled && (s.hovered || s.pressed) ? p.surfaceHover : 'transparent' },
      ]}
    >
      <Row icon={icon} label={label} description={description} disabled={disabled}>
        <SwitchTrack value={value} disabled={disabled} />
      </Row>
    </Pressable>
  );
}

// -----------------------------------------------------------------------------
// Switch

function SwitchTrack({ value, disabled }: { value: boolean; disabled?: boolean }) {
  const p = useToolbarTheme();
  const [anim] = React.useState(() => new Animated.Value(value ? 1 : 0));
  React.useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 140, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [anim, value]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 14] });
  return (
    <View style={[styles.track, { backgroundColor: value ? p.accent : p.switchOff }, disabled && styles.disabled]}>
      <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
    </View>
  );
}

/** A custom-drawn switch that looks the same on every platform. */
export function Switch({
  value,
  onValueChange,
  disabled,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => onValueChange(!value)}
      style={cursorPointer}
    >
      <SwitchTrack value={value} disabled={disabled} />
    </Pressable>
  );
}

// -----------------------------------------------------------------------------
// Segmented control

export interface SegmentOption<T> {
  value: T;
  label: string;
  icon?: IconName;
  accessibilityLabel?: string;
}

function SegmentedControlInner<T>({
  options,
  value,
  onChange,
  compact,
  style,
  accessibilityLabel,
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const p = useToolbarTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.segmented, compact && styles.segmentedCompact, { backgroundColor: p.surface, borderColor: p.border }, style]}
    >
      {options.map((o) => {
        const selected = Object.is(o.value, value);
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityLabel={o.accessibilityLabel ?? o.label}
            accessibilityState={{ selected, checked: selected }}
            onPress={() => onChange(o.value)}
            style={(s: PressState) => [
              styles.segment,
              compact && styles.segmentCompact,
              cursorPointer,
              noSelect,
              selected
                ? [styles.segmentSelected, { backgroundColor: p.raised, shadowColor: p.shadow }]
                : (s.hovered || s.pressed) && { backgroundColor: p.surfaceHover },
            ]}
          >
            {o.icon ? <Icon name={o.icon} size={compact ? 12 : 14} color={selected ? p.text : p.textMuted} /> : null}
            {o.label ? (
              <Text
                numberOfLines={1}
                style={[compact ? type.small : type.label, { color: selected ? p.text : p.textMuted }, selected && styles.bold]}
              >
                {o.label}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export const SegmentedControl = React.memo(SegmentedControlInner) as typeof SegmentedControlInner;

// -----------------------------------------------------------------------------
// Chip

export function Chip({
  label,
  selected,
  onPress,
  icon,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  accessibilityLabel?: string;
}) {
  const p = useToolbarTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={(s: PressState) => [
        styles.chip,
        cursorPointer,
        noSelect,
        selected
          ? { backgroundColor: p.accentSoft, borderColor: p.accent }
          : { backgroundColor: surfaceFor(p, s, 'transparent'), borderColor: p.border },
      ]}
    >
      {icon ? <Icon name={icon} size={12} color={selected ? p.accent : p.textMuted} /> : null}
      <Text style={[type.label, { color: selected ? p.accent : p.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

// -----------------------------------------------------------------------------
// Buttons

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  active,
  disabled,
  size = 28,
  iconSize = 16,
  color,
  style,
}: {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  active?: boolean;
  disabled?: boolean;
  size?: number;
  iconSize?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const p = useToolbarTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active, disabled }}
      // Native tooltip on web.
      ref={webTitle(accessibilityLabel)}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={(s: PressState) => [
        styles.iconButton,
        { width: size, height: size },
        cursorPointer,
        { backgroundColor: active ? p.accentSoft : surfaceFor(p, s, 'transparent') },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon name={icon} size={iconSize} color={color ?? (active ? p.accent : p.textMuted)} />
    </Pressable>
  );
}

export function Button({
  label,
  icon,
  onPress,
  variant = 'default',
  accessibilityLabel,
  style,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  variant?: 'default' | 'danger' | 'accent';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const p = useToolbarTheme();
  const fg = variant === 'danger' ? p.danger : variant === 'accent' ? p.accentText : p.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={(s: PressState) => [
        styles.button,
        cursorPointer,
        noSelect,
        variant === 'accent'
          ? { backgroundColor: p.accent, opacity: s.pressed ? 0.85 : s.hovered ? 0.92 : 1, borderColor: p.accent }
          : variant === 'danger'
            ? { backgroundColor: s.hovered || s.pressed ? p.dangerSoft : 'transparent', borderColor: p.border }
            : { backgroundColor: surfaceFor(p, s), borderColor: p.border },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={14} color={fg} /> : null}
      <Text style={[type.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

// -----------------------------------------------------------------------------
// Stepper

export function Stepper({
  value,
  onDecrement,
  onIncrement,
  canDecrement = true,
  canIncrement = true,
  accessibilityLabel,
}: {
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
  canDecrement?: boolean;
  canIncrement?: boolean;
  accessibilityLabel: string;
}) {
  const p = useToolbarTheme();
  return (
    <View style={[styles.stepper, { backgroundColor: p.surface, borderColor: p.border }]}>
      <IconButton
        icon="minus"
        size={26}
        iconSize={13}
        onPress={onDecrement}
        disabled={!canDecrement}
        accessibilityLabel={`Decrease ${accessibilityLabel}`}
      />
      <Text style={[type.mono, styles.stepperValue, { color: p.text }]} accessibilityLabel={`${accessibilityLabel} ${value}`}>
        {value}
      </Text>
      <IconButton
        icon="plus"
        size={26}
        iconSize={13}
        onPress={onIncrement}
        disabled={!canIncrement}
        accessibilityLabel={`Increase ${accessibilityLabel}`}
      />
    </View>
  );
}

// -----------------------------------------------------------------------------
// Inputs

export function SearchInput({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  accessibilityLabel?: string;
}) {
  const p = useToolbarTheme();
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={[styles.input, { backgroundColor: p.surface, borderColor: focused ? p.accent : p.border }]}>
      <Icon name="search" size={14} color={p.textFaint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={p.textFaint}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        returnKeyType="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[type.body, styles.inputText, { color: p.text }]}
      />
      {value ? (
        <IconButton icon="close" size={20} iconSize={12} onPress={() => onChangeText('')} accessibilityLabel="Clear search" />
      ) : null}
    </View>
  );
}

/** A small text field with a caption. Commits on every valid change. */
export function TextField({
  label,
  value,
  onChangeText,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const p = useToolbarTheme();
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={[styles.field, style]}>
      <Text style={[type.small, { color: p.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={label}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          type.body,
          styles.fieldInput,
          { color: p.text, backgroundColor: p.surface, borderColor: focused ? p.accent : p.border },
        ]}
      />
    </View>
  );
}

/**
 * A numeric field. Keeps the typed text while editing and reports a value only
 * when it parses and lies within [min, max].
 */
export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 10000,
  decimals = 0,
  style,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  decimals?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const p = useToolbarTheme();
  const [text, setText] = React.useState(String(value));
  const [focused, setFocused] = React.useState(false);
  const parsed = parseNumber(text, { min, max, decimals });
  const invalid = parsed === null;
  // Follow external changes (reset, other controls) while not editing.
  const shown = focused ? text : String(value);
  return (
    <View style={[styles.field, style]}>
      <Text style={[type.small, { color: p.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
      <TextInput
        value={shown}
        onChangeText={(t) => {
          setText(t);
          const n = parseNumber(t, { min, max, decimals });
          if (n !== null && n !== value) onChange(n);
        }}
        onFocus={() => {
          setText(String(value));
          setFocused(true);
        }}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        keyboardType={decimals > 0 ? 'decimal-pad' : 'number-pad'}
        inputMode={decimals > 0 ? 'decimal' : 'numeric'}
        selectTextOnFocus
        style={[
          type.mono,
          styles.fieldInput,
          {
            color: p.text,
            backgroundColor: p.surface,
            borderColor: focused && invalid ? p.danger : focused ? p.accent : p.border,
          },
        ]}
      />
    </View>
  );
}

/** Parses user input into a number in [min, max] with at most `decimals` decimals. */
export function parseNumber(text: string, { min, max, decimals }: { min: number; max: number; decimals: number }): number | null {
  const t = text.trim().replace(',', '.');
  if (!/^\d+(\.\d*)?$/.test(t)) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

// -----------------------------------------------------------------------------
// List item

export const ListItem = React.memo(function ListItem({
  icon,
  title,
  subtitle,
  trailing,
  selected,
  onPress,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  trailing?: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const p = useToolbarTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={(s: PressState) => [
        styles.listItem,
        cursorPointer,
        noSelect,
        { backgroundColor: selected ? p.accentSoft : surfaceFor(p, s, 'transparent') },
      ]}
    >
      {icon ? <Icon name={icon} size={15} color={selected ? p.accent : p.textMuted} /> : null}
      <View style={styles.rowText}>
        <Text style={[type.body, styles.start, { color: selected ? p.accent : p.text }, selected && styles.bold]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {subtitle ? (
        <Text style={[type.mono, { color: selected ? p.accent : p.textFaint }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
      {trailing ? (
        <Text style={[type.small, { color: p.textFaint, minWidth: 28, textAlign: 'right' }]} numberOfLines={1}>
          {trailing}
        </Text>
      ) : null}
    </Pressable>
  );
});

// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  section: { gap: space.sm, marginBottom: space.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2, minHeight: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 32 },
  rowIcon: { width: 18, alignItems: 'center' },
  rowText: { flex: 1, minWidth: 0 },
  pressRow: { borderRadius: radius.md, paddingHorizontal: space.sm, paddingVertical: 3, marginHorizontal: -space.sm },
  disabled: { opacity: 0.4 },
  bold: { fontWeight: '600' },
  // Native names (Arabic, Hebrew...) would otherwise align right on web.
  start: { textAlign: 'left', writingDirection: 'ltr' },
  track: { width: 30, height: 18, borderRadius: 9, justifyContent: 'center' },
  knob: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 1.5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmented: { flexDirection: 'row', borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: 2, gap: 2 },
  segmentedCompact: { borderRadius: radius.sm, padding: 2 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 26,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
  },
  segmentCompact: { flexBasis: 'auto', minHeight: 22, paddingHorizontal: 5, borderRadius: 4 },
  segmentSelected: { shadowOpacity: 0.18, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  iconButton: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: 1 },
  stepperValue: { minWidth: 44, textAlign: 'center' },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingLeft: 9,
    paddingRight: 4,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  inputText: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    height: 28,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  field: { gap: 3, minWidth: 0 },
  fieldInput: {
    height: 28,
    paddingHorizontal: 8,
    paddingVertical: 0,
    borderRadius: radius.sm,
    borderWidth: 1,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', width: '100%' } as object) : null),
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    height: 32,
    paddingHorizontal: space.sm + 2,
    borderRadius: radius.sm,
  },
});
