import MapView from 'react-native-maps';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Searchbar, Text, IconButton, Portal, Modal, PaperProvider } from 'react-native-paper';
import { useState } from 'react';

export default function App() {
  const [search, setSearch] = useState('');
  const [preferences, setPreferences] = useState(false);
  
  const showPreferences = () => setPreferences(true);
  const hidePreferences = () => setPreferences(false);

  return (
    <PaperProvider>
       <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <IconButton
            icon="dots-vertical"
            size={28}
            onPress={() => showPreferences()}
          />

          <Searchbar
            placeholder="Search"
            onChangeText={setSearch}
            value={search}
            style={styles.searchBar}
          />

          <Button mode="contained" onPress={() => console.log('Hello, World')}>
            Confirm
          </Button>

          <Portal>
            <Modal visible={preferences} onDismiss={hidePreferences} contentContainerStyle={styles.preferencesModal}>
              <Text>Preferences</Text>
            </Modal>
          </Portal>
        </View>

        <MapView style={styles.map} />
       </SafeAreaView>
    </PaperProvider>

  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  safeArea: {
     flex: 1,
   },
   topBar:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingBottom: 5, 
   },
   searchBar: {
    flex: 1,
    marginRight: 5,
   },
   preferencesModal: {
    backgroundColor: 'white',
    padding: 20,
    height: '50%',
   }
});
