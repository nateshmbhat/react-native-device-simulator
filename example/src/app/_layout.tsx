import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { DeviceSimulator, screenshotPlugin, simulationInfoPlugin } from 'react-native-device-simulator';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

SplashScreen.preventAutoHideAsync();

const plugins = [screenshotPlugin(), simulationInfoPlugin()];

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <DeviceSimulator plugins={plugins}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <AppTabs />
      </ThemeProvider>
    </DeviceSimulator>
  );
}
