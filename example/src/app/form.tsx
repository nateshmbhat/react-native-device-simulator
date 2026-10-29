import { SymbolView } from 'expo-symbols';
import { useRef, useState, type ComponentProps, type ComponentRef, type Ref } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Card } from '@/components/card';
import { ScreenHeader, useScreenPadding } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useKeyboard } from '@/hooks/use-keyboard';
import { useTheme } from '@/hooks/use-theme';

const times = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];

type TextInputHandle = ComponentRef<typeof TextInput>;
type FieldProps = ComponentProps<typeof TextInput> & { label: string; inputRef?: Ref<TextInputHandle> };

function Field({ label, inputRef, style, ...props }: FieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        ref={inputRef}
        placeholderTextColor={theme.textSecondary}
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.background,
            borderColor: focused ? theme.tint : theme.border,
          },
          style,
        ]}
      />
    </View>
  );
}

function Stepper({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  const theme = useTheme();
  const button = (delta: number, icon: 'remove' | 'add', sf: 'minus' | 'plus') => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={delta < 0 ? 'Fewer guests' : 'More guests'}
      disabled={value + delta < min || value + delta > max}
      onPress={() => onChange(value + delta)}
      style={({ pressed }) => [
        styles.stepperButton,
        { borderColor: theme.border, backgroundColor: theme.background },
        (pressed || value + delta < min || value + delta > max) && styles.pressed,
      ]}>
      <SymbolView name={{ ios: sf, android: icon, web: icon }} size={18} tintColor={theme.text} />
    </Pressable>
  );
  return (
    <View style={styles.stepper}>
      {button(-1, 'remove', 'minus')}
      <ThemedText type="smallBold" style={styles.stepperValue}>
        {value}
      </ThemedText>
      {button(1, 'add', 'plus')}
    </View>
  );
}

export default function FormScreen() {
  const theme = useTheme();
  const padding = useScreenPadding();
  const keyboard = useKeyboard();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState('19:30');
  const [submitted, setSubmitted] = useState(false);
  const emailRef = useRef<TextInputHandle>(null);
  const phoneRef = useRef<TextInputHandle>(null);
  const notesRef = useRef<TextInputHandle>(null);

  const valid = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, padding]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive">
        <View style={styles.inner}>
          <ScreenHeader
            title="Book a table"
            subtitle="Mesa · Lisbon"
            accessory={
              <ThemedView
                type="backgroundElement"
                style={[styles.keyboardPill, keyboard.visible && { backgroundColor: theme.tint }]}>
                <SymbolView
                  name={{ ios: 'keyboard', android: 'keyboard', web: 'keyboard' }}
                  size={14}
                  tintColor={keyboard.visible ? '#ffffff' : theme.textSecondary}
                />
                <ThemedText type="code" style={{ color: keyboard.visible ? '#ffffff' : theme.textSecondary }}>
                  {keyboard.visible ? `${Math.round(keyboard.height)} pt` : 'hidden'}
                </ThemedText>
              </ThemedView>
            }
          />

          {submitted ? (
            <Card title="You're booked! 🎉">
              <ThemedText>
                Table for {guests} at {time}, {name.trim()}. A confirmation was sent to {email.trim()}.
              </ThemedText>
              <Pressable onPress={() => setSubmitted(false)} style={({ pressed }) => pressed && styles.pressed}>
                <ThemedText type="linkPrimary">Make another booking</ThemedText>
              </Pressable>
            </Card>
          ) : null}

          <Card title="Guests & time">
            <View style={styles.rowBetween}>
              <ThemedText type="small">Guests</ThemedText>
              <Stepper value={guests} onChange={setGuests} min={1} max={12} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.times}>
              {times.map((t) => {
                const selected = t === time;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setTime(t)}
                    style={[
                      styles.time,
                      {
                        backgroundColor: selected ? theme.tint : theme.background,
                        borderColor: selected ? theme.tint : theme.border,
                      },
                    ]}>
                    <ThemedText type="smallBold" style={{ color: selected ? '#ffffff' : theme.text }}>
                      {t}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Card>

          <Card title="Your details">
            <Field
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Alex Morgan"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            <Field
              inputRef={emailRef}
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="alex@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            <Field
              inputRef={phoneRef}
              label="Phone (optional)"
              value={phone}
              onChangeText={setPhone}
              placeholder="+351 912 345 678"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => notesRef.current?.focus()}
            />
            <Field
              inputRef={notesRef}
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Allergies, high chair, a window seat…"
              multiline
              style={styles.notes}
            />
          </Card>

          <Pressable
            accessibilityRole="button"
            disabled={!valid}
            onPress={() => {
              Keyboard.dismiss();
              setSubmitted(true);
            }}
            style={({ pressed }) => [
              styles.submit,
              { backgroundColor: theme.tint },
              (!valid || pressed) && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={styles.submitText}>
              Reserve for {guests} at {time}
            </ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary" style={styles.footnote}>
            Focus a field: the simulated keyboard slides up and this form stays visible above it.
          </ThemedText>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { alignItems: 'center', flexGrow: 1 },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  keyboardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    marginBottom: Spacing.two,
  },
  field: { gap: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 44,
    // The border colour shows focus; drop the browser's focus ring on web.
    outlineWidth: 0,
  },
  notes: { minHeight: 96, textAlignVertical: 'top' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { minWidth: 24, textAlign: 'center', fontSize: 16 },
  times: { gap: Spacing.two, paddingVertical: Spacing.one },
  time: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 12, borderWidth: 1 },
  submit: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#ffffff', fontSize: 16 },
  footnote: { textAlign: 'center' },
  pressed: { opacity: 0.5 },
});
