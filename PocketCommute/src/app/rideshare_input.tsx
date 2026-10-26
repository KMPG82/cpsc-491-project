import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Keyboard,
  StyleSheet,
  Text, TextInput,
  View
} from 'react-native';

import type { Location } from '@/types/location';
import { geocodeDestination } from '@/utilities/location';
import { lyftUrls, openRideApp, uberUrls } from '@/utilities/rideshare';

export default function HomeScreen() {
  const [input, setInput] = useState<string>('');
  const [destination, setDestination] = useState<Location | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleConfirm = async () => {
    const address = input.trim();
    if (!address) {
      Alert.alert('Enter an address first');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    try {
      const result = await geocodeDestination(address);
      if (!result) {
        setDestination(null);
        Alert.alert('Address not found', 'Try adding the city and state.');
        return;
      }
      setDestination(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert('Could not look up that address', message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text: string) => {
    setInput(text);
    setDestination(null); // editing invalidates the confirmed address
  };

  const handleOpenRide = async (provider: 'Uber' | 'Lyft') => {
    if (!destination) return;

    try {
      const urls = provider === 'Uber' ? uberUrls(destination) : lyftUrls(destination);
      await openRideApp(urls);
    } catch {
      Alert.alert(
        `Could not open ${provider}`,
        'Could not open the app or its website. Please try again.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Destination</Text>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={handleChange}
        placeholder="e.g. 800 N State College Blvd, Fullerton, CA"
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={handleConfirm}
      />

      <View style={styles.btn}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Button title="Confirm" onPress={handleConfirm} />
        )}
      </View>

      {destination && (
        <>
          <Text style={styles.confirmed}>Going to: {destination.formattedAddress}</Text>
          <View style={styles.btn}>
            <Button title="Open Uber" onPress={() => handleOpenRide('Uber')} />
          </View>
          <View style={styles.btn}>
            <Button title="Open Lyft" onPress={() => handleOpenRide('Lyft')} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 12, fontSize: 16,
  },
  btn: { marginVertical: 8 },
  confirmed: { marginTop: 16, marginBottom: 8, textAlign: 'center', color: '#444' },
});
