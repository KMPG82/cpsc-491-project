import { DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={DefaultTheme}>
      <AppTabs />
    </ThemeProvider>
  );
}
