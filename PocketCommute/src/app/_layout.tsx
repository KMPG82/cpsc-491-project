import { DefaultTheme, ThemeProvider } from 'expo-router';

import AppTabs from '@/components/app-tabs';

export default function TabLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <AppTabs />
    </ThemeProvider>
  );
}
