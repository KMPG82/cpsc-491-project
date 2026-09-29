import { PaperProvider } from 'react-native-paper';

import AppTabs from '@/components/app-tabs';

export default function TabLayout() {
  return (
    <PaperProvider>
      <AppTabs/>
    </PaperProvider>
  );
}
