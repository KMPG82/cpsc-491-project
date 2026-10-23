import * as Location from 'expo-location';
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

type Destination = {
  address: string;
  latitude: number;
  longitude: number;
};

// TODO: open uber with destination
function openUber() {}

// TODO: open lyft with destination
function openLyft() {}

export default function HomeScreen() {
  const [input, setInput] = useState<string>('');
  const [destination, setDestination] = useState<Destination | null>(null);
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
      const results = await Location.geocodeAsync(address);
      if (!results.length) {
        setDestination(null);
        Alert.alert('Address not found', 'Try adding the city and state.');
        return;
      }
      const { latitude, longitude } = results[0];
      setDestination({ address, latitude, longitude });
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
          <Text style={styles.confirmed}>Going to: {destination.address}</Text>
          <View style={styles.btn}>
            <Button title="Open Uber" onPress={() => openUber()} />
          </View>
          <View style={styles.btn}>
            <Button title="Open Lyft" onPress={() => openLyft()} />
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