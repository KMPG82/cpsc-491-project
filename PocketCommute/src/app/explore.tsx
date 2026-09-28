import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {Text} from 'react-native';

export default function HomeScreen() {
  return (
      <SafeAreaView style={styles.safeArea}>
        <Text>
          RIDESHARE FACILITATION SCREEN
        </Text>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
