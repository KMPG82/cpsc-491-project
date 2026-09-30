import React from 'react';
import MapView from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Searchbar } from 'react-native-paper';
import { useState } from 'react';

export default function App() {
  const [search, setSearch] = useState('');

  return (
       <SafeAreaView style={styles.safeArea}>
         <Searchbar
           placeholder="Search"
           onChangeText={setSearch}
           value={search}
           style={styles.searchBar}
         />
        <MapView style={styles.map} />

       </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  safeArea: {
     flex: 1,
   },
   searchBar:{
    paddingBottom: 20,
   }
});
