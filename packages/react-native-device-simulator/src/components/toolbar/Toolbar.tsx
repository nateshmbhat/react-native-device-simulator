import * as React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import { useDevicePreviewSettings, useDevicePreviewSimulation } from '../../context';
import { devicePreview } from '../../core/store';
import type { DevicePreviewPlugin } from '../../plugins/types';
import type { Size } from '../../types';
import { IconButton, webTitle } from './controls';
import { getHostInsets } from './host';
import { Icon, kindIcon, type IconName } from './icons';
import { SIDE_PANEL_WIDTH, type ToolbarPlacement } from './logic';
import { palettes, pluginTheme, radius, space, ToolbarThemeContext, type, useToolbarTheme } from './theme';
import { AccessibilityTab } from './tabs/AccessibilityTab';
import { DeviceTab } from './tabs/DeviceTab';
import { DisplayTab } from './tabs/DisplayTab';
import { SettingsTab } from './tabs/SettingsTab';

type PressState = PressableStateCallbackType & { hovered?: boolean; focused?: boolean };

export interface ToolbarProps {
  /** Whether the simulation is on (`settings.isEnabled`). */
  active: boolean;
  /** Where the panel docks (already resolved from `settings.toolbar.position`). */
  placement: ToolbarPlacement;
  plugins: readonly DevicePreviewPlugin[];
  /** Real size of the area the preview occupies. */
  hostSize: Size;
}

interface TabDef {
  id: string;
  title: string;
  icon: IconName;
  /** Plugin glyph (emoji / character) shown instead of the icon. */
  glyph?: string;
  plugin?: DevicePreviewPlugin;
}

const BUILT_IN_TABS: readonly TabDef[] = [
  { id: 'device', title: 'Device', icon: 'phone' },
  { id: 'display', title: 'Display', icon: 'display' },
  { id: 'accessibility', title: 'Accessibility', icon: 'accessibility' },
  { id: 'settings', title: 'Settings', icon: 'settings' },
];

/** Above this many tabs the side panel's tab bar shows icons only. */
const COMPACT_TAB_LIMIT = 4;

const selectTab = (tab: string) => devicePreview.update((s) => ({ toolbar: { ...s.toolbar, tab } }));
const setToolbarVisible = (visible: boolean) => devicePreview.update((s) => ({ toolbar: { ...s.toolbar, visible } }));

/**
 * The control panel. Docked as a side panel or a bottom bar, collapsed to a
 * small floating handle, or (when the simulation is off) reduced to a handle
 * that turns it back on.
 */
export function Toolbar({ active, placement, plugins, hostSize }: ToolbarProps) {
  const settings = useDevicePreviewSettings();
  const palette = palettes[settings.theme] ?? palettes.dark;
  const tabs = React.useMemo<TabDef[]>(
    () => [
      ...BUILT_IN_TABS,
      ...plugins.map((plugin) => ({ id: plugin.id, title: plugin.title, icon: 'apps' as const, glyph: plugin.icon, plugin })),
    ],
    [plugins],
  );
  const current = tabs.find((t) => t.id === settings.toolbar.tab) ?? tabs[0]!;

  let content: React.ReactNode;
  if (!active) {
    content = (
      <FloatingHandle side="right" icon="phone" label="Turn device preview on" onPress={() => devicePreview.setEnabled(true)} subtle />
    );
  } else if (!settings.toolbar.visible) {
    content = (
      <FloatingHandle
        side={placement}
        icon={placement === 'left' ? 'panelLeft' : placement === 'bottom' ? 'panelBottom' : 'panelRight'}
        label="Show device preview toolbar"
        onPress={() => setToolbarVisible(true)}
      />
    );
  } else if (placement === 'bottom') {
    content = <BottomToolbar tabs={tabs} current={current} hostSize={hostSize} />;
  } else {
    content = <SidePanel tabs={tabs} current={current} placement={placement} />;
  }
  return <ToolbarThemeContext.Provider value={palette}>{content}</ToolbarThemeContext.Provider>;
}

// -----------------------------------------------------------------------------
// Side panel

function SidePanel({ tabs, current, placement }: { tabs: readonly TabDef[]; current: TabDef; placement: 'left' | 'right' }) {
  const p = useToolbarTheme();
  const insets = getHostInsets();
  return (
    <View
      accessibilityLabel="Device preview toolbar"
      style={[
        styles.side,
        {
          width: SIDE_PANEL_WIDTH + (placement === 'right' ? insets.right : insets.left),
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: placement === 'left' ? insets.left : 0,
          paddingRight: placement === 'right' ? insets.right : 0,
          backgroundColor: p.background,
          borderColor: p.border,
        },
        placement === 'right' ? styles.sideRight : styles.sideLeft,
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: p.accent }]}>
          <Icon name="phone" size={12} color={p.accentText} strokeWidth={2.2} />
        </View>
        <Text style={[type.title, styles.headerTitle, { color: p.text }]} numberOfLines={1}>
          Device Preview
          {tabs.length > COMPACT_TAB_LIMIT ? <Text style={{ color: p.textFaint, fontWeight: '400' }}>{`  /  ${current.title}`}</Text> : null}
        </Text>
        <IconButton
          icon={placement === 'left' ? 'chevronLeft' : 'chevronRight'}
          onPress={() => setToolbarVisible(false)}
          accessibilityLabel="Hide toolbar"
        />
      </View>
      <TabBar tabs={tabs} current={current} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TabContent tab={current} />
      </ScrollView>
    </View>
  );
}

function TabBar({ tabs, current }: { tabs: readonly TabDef[]; current: TabDef }) {
  const p = useToolbarTheme();
  // With plugins the labels no longer fit: icons only (the header names the tab).
  const compact = tabs.length > COMPACT_TAB_LIMIT;
  return (
    <View style={[styles.tabBar, { borderBottomColor: p.divider }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent} accessibilityRole="tablist">
        {tabs.map((t) => {
          const selected = t.id === current.id;
          const color = selected ? p.accent : p.textMuted;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="tab"
              accessibilityLabel={t.title}
              accessibilityState={{ selected }}
              onPress={() => selectTab(t.id)}
              ref={compact ? webTitle(t.title) : undefined}
              style={(s: PressState) => [
                styles.tab,
                compact && styles.tabCompact,
                webPointer,
                { backgroundColor: !selected && (s.hovered || s.pressed) ? p.surfaceHover : 'transparent' },
              ]}
            >
              <TabIcon tab={t} color={color} size={17} />
              {compact ? null : (
                <Text style={[type.small, styles.tabLabel, { color }, selected && styles.bold]} numberOfLines={1}>
                  {t.title}
                </Text>
              )}
              <View style={[styles.tabIndicator, { backgroundColor: selected ? p.accent : 'transparent' }]} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function TabIcon({ tab, color, size }: { tab: TabDef; color: string; size: number }) {
  if (tab.glyph) {
    return (
      <Text style={{ fontSize: size - 2, lineHeight: size + 1, height: size, color, textAlign: 'center' }} numberOfLines={1}>
        {tab.glyph}
      </Text>
    );
  }
  return <Icon name={tab.icon} size={size} color={color} />;
}

function TabContent({ tab }: { tab: TabDef }) {
  if (tab.plugin) return <PluginPanel plugin={tab.plugin} />;
  switch (tab.id) {
    case 'display':
      return <DisplayTab />;
    case 'accessibility':
      return <AccessibilityTab />;
    case 'settings':
      return <SettingsTab />;
    default:
      return <DeviceTab />;
  }
}

function PluginPanel({ plugin }: { plugin: DevicePreviewPlugin }) {
  const settings = useDevicePreviewSettings();
  const simulation = useDevicePreviewSimulation();
  const p = useToolbarTheme();
  return <>{plugin.render({ controller: devicePreview, settings, simulation, theme: pluginTheme(p) })}</>;
}

// -----------------------------------------------------------------------------
// Bottom toolbar

function BottomToolbar({ tabs, current, hostSize }: { tabs: readonly TabDef[]; current: TabDef; hostSize: Size }) {
  const p = useToolbarTheme();
  const simulation = useDevicePreviewSimulation();
  const insets = getHostInsets();
  const [expanded, setExpanded] = React.useState(false);
  // On phone-sized hosts the hide button moves into the sheet header to leave
  // room for the device name and every tab.
  const narrow = hostSize.width < 480;
  const sheetHeight = Math.round(Math.max(200, Math.min(hostSize.height * 0.55, 560)));

  const openTab = (id: string) => {
    if (expanded && id === current.id) {
      setExpanded(false);
    } else {
      selectTab(id);
      setExpanded(true);
    }
  };

  return (
    <View
      accessibilityLabel="Device preview toolbar"
      style={[
        styles.bottom,
        { backgroundColor: p.background, borderTopColor: p.border, paddingLeft: insets.left, paddingRight: insets.right },
      ]}
    >
      {expanded ? (
        <View style={[styles.sheet, { height: sheetHeight, borderBottomColor: p.divider }]}>
          <View style={styles.sheetHeader}>
            <TabIcon tab={current} color={p.accent} size={15} />
            <Text style={[type.title, styles.headerTitle, { color: p.text }]} numberOfLines={1}>
              {current.title}
            </Text>
            {narrow ? <IconButton icon="close" onPress={() => setToolbarVisible(false)} accessibilityLabel="Hide toolbar" /> : null}
            <IconButton icon="chevronDown" onPress={() => setExpanded(false)} accessibilityLabel="Collapse panel" />
          </View>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, styles.sheetContent]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TabContent tab={current} />
          </ScrollView>
        </View>
      ) : null}
      <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Device: ${simulation.preset.name}. Choose device`}
          onPress={() => openTab('device')}
          style={(s: PressState) => [
            styles.deviceButton,
            webPointer,
            { backgroundColor: s.hovered || s.pressed ? p.surfaceHover : p.surface, borderColor: p.border },
          ]}
        >
          <Icon name={kindIcon(simulation.preset.kind)} size={14} color={p.accent} />
          <Text style={[type.label, styles.deviceName, { color: p.text }]} numberOfLines={1}>
            {simulation.preset.name}
          </Text>
          <Icon name={expanded && current.id === 'device' ? 'chevronDown' : 'chevronUp'} size={12} color={p.textFaint} />
        </Pressable>
        {simulation.preset.kind !== 'desktop' ? (
          <IconButton icon="rotate" onPress={devicePreview.toggleOrientation} accessibilityLabel="Rotate device" size={32} />
        ) : null}
        <View style={styles.flex} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.barTabs, { maxWidth: Math.max(120, hostSize.width - 190) }]} contentContainerStyle={styles.barTabsContent}>
          {tabs
            .filter((t) => t.id !== 'device')
            .map((t) => {
              const selected = expanded && t.id === current.id;
              return (
                <Pressable
                  key={t.id}
                  accessibilityRole="tab"
                  accessibilityLabel={t.title}
                  accessibilityState={{ selected }}
                  onPress={() => openTab(t.id)}
                  ref={webTitle(t.title)}
                  style={(s: PressState) => [
                    styles.barTab,
                    webPointer,
                    { backgroundColor: selected ? p.accentSoft : s.hovered || s.pressed ? p.surfaceHover : 'transparent' },
                  ]}
                >
                  <TabIcon tab={t} color={selected ? p.accent : p.textMuted} size={17} />
                </Pressable>
              );
            })}
        </ScrollView>
        {narrow ? null : (
          <>
            <View style={[styles.separator, { backgroundColor: p.border }]} />
            <IconButton icon="close" onPress={() => setToolbarVisible(false)} accessibilityLabel="Hide toolbar" size={32} />
          </>
        )}
      </View>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Floating handle

/**
 * A small tab stuck to a window edge. Kept out of the way of app content
 * (vertically off-centre on the side edges, centred on the bottom edge) and
 * translucent until hovered.
 */
function FloatingHandle({
  side,
  icon,
  label,
  onPress,
  subtle,
}: {
  side: ToolbarPlacement;
  icon: IconName;
  label: string;
  onPress: () => void;
  subtle?: boolean;
}) {
  const p = useToolbarTheme();
  const insets = getHostInsets();
  const position =
    side === 'bottom'
      ? [styles.handleBottom, { bottom: insets.bottom }]
      : side === 'left'
        ? [styles.handleSide, styles.handleLeft, { left: insets.left }]
        : [styles.handleSide, styles.handleRight, { right: insets.right }];
  return (
    <View style={[side === 'bottom' ? styles.handleBottomWrap : StyleSheet.absoluteFill, styles.boxNone]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        ref={webTitle(label)}
        onPress={onPress}
        hitSlop={6}
        style={(s: PressState) => [
          styles.handle,
          position,
          webPointer,
          {
            backgroundColor: p.background,
            borderColor: p.border,
            shadowColor: p.shadow,
            opacity: s.hovered || s.pressed || s.focused ? 1 : subtle ? 0.5 : 0.85,
          },
        ]}
      >
        <Icon name={icon} size={14} color={p.accent} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

// -----------------------------------------------------------------------------

const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : undefined;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  boxNone: { pointerEvents: 'box-none' },
  bold: { fontWeight: '600' },
  side: { alignSelf: 'stretch', flexShrink: 0, zIndex: 2 },
  sideRight: { borderLeftWidth: StyleSheet.hairlineWidth },
  sideLeft: { borderRightWidth: StyleSheet.hairlineWidth },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + 2,
    height: 44,
    paddingLeft: space.lg,
    paddingRight: space.sm,
  },
  headerTitle: { flex: 1, minWidth: 0 },
  logo: { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  tabBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabBarContent: { flexGrow: 1, paddingHorizontal: space.sm },
  tab: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 62,
    alignItems: 'center',
    paddingTop: 7,
    gap: 3,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  tabCompact: { minWidth: 40, paddingTop: 10, gap: 5 },
  tabLabel: { fontSize: 10.5 },
  tabIndicator: { height: 2, alignSelf: 'stretch', marginHorizontal: 10, marginTop: 3, borderRadius: 1 },
  content: { padding: space.lg, paddingBottom: space.xl * 2 },
  bottom: { borderTopWidth: StyleSheet.hairlineWidth, flexShrink: 0, zIndex: 2 },
  sheet: { borderBottomWidth: StyleSheet.hairlineWidth },
  // Keeps the sheet readable when the bottom layout is forced on a wide window.
  sheetContent: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm, height: 40, paddingLeft: space.lg, paddingRight: space.sm },
  bar: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 48, paddingHorizontal: space.sm, paddingTop: 0 },
  deviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: 200,
  },
  deviceName: { flexShrink: 1, minWidth: 0 },
  separator: { width: StyleSheet.hairlineWidth, height: 20, marginHorizontal: 2 },
  barTabs: { flexGrow: 0, flexShrink: 0 },
  barTabsContent: { alignItems: 'center', gap: 2 },
  barTab: { width: 34, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  handle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  handleSide: { top: '42%', width: 22, height: 44 },
  handleRight: { borderTopLeftRadius: 10, borderBottomLeftRadius: 10, borderRightWidth: 0 },
  handleLeft: { borderTopRightRadius: 10, borderBottomRightRadius: 10, borderLeftWidth: 0 },
  handleBottomWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 24, alignItems: 'center' },
  handleBottom: { position: 'relative', width: 48, height: 22, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomWidth: 0 },
});
