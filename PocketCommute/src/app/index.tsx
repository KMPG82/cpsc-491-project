import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Searchbar, Text } from 'react-native-paper';
import { useState } from 'react';

export default function HomeScreen() {
  const [search, setSearch] = useState('');

  return (
      <SafeAreaView style={styles.safeArea}>
        <Searchbar
          placeholder="Search"
          onChangeText={setSearch}
          value={search}
        />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});