import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { t } = useLocale();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t.tabs.home}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="gallery">
        <NativeTabs.Trigger.Label>{t.tabs.gallery}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2.fill" md="grid_view" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="form">
        <NativeTabs.Trigger.Label>{t.tabs.form}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="event" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="world">
        <NativeTabs.Trigger.Label>{t.tabs.world}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="globe" md="language" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="inspector">
        <NativeTabs.Trigger.Label>{t.tabs.inspector}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="ruler" md="straighten" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
