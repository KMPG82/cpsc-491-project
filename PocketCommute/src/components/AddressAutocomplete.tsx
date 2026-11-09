import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AddressAutocompleteState } from '@/hooks/useAddressAutocomplete';

type Props = {
  label: string;
  placeholder?: string;
  autocomplete: AddressAutocompleteState;
};

// Controlled by a separate hook instance for each pickup/destination field.
export default function AddressAutocomplete({ label, placeholder, autocomplete }: Props) {
  const { text, onChangeText, suggestions, selectedLocation, selectSuggestion, loading, error, hasSearched } = autocomplete;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholder={placeholder}
        placeholderTextColor="#666"
        value={text}
        onChangeText={onChangeText}
        autoCapitalize="words"
        autoCorrect={false}
        style={styles.input}
      />
      {loading && (
        <View style={styles.status}>
          <ActivityIndicator accessibilityLabel={`Searching ${label}`} color="#2458a6" />
          <Text style={styles.text}>Searching addresses…</Text>
        </View>
      )}
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {!loading && !error && hasSearched && !selectedLocation && suggestions.length === 0 && (
        <Text accessibilityLiveRegion="polite" style={styles.text}>
          No addresses found. Add a street number, city, or postal code.
        </Text>
      )}
      {suggestions.slice(0, 5).map((location, index) => (
        <Pressable
          key={`${location.placeId ?? `${location.latitude},${location.longitude}`}-${index}`}
          accessibilityRole="button"
          accessibilityLabel={`Select ${label}: ${location.formattedAddress}`}
          onPress={() => selectSuggestion(location)}
          style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
        >
          <Text style={styles.text}>{location.formattedAddress}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, marginVertical: 8 },
  label: { color: '#222', fontSize: 16, fontWeight: '600' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#777', borderRadius: 8, padding: 12, color: '#222', backgroundColor: '#fff', fontSize: 16 },
  suggestion: { minHeight: 48, justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#fff' },
  pressed: { backgroundColor: '#e8eef7' },
  text: { color: '#222', fontSize: 16 },
  error: { color: '#a01818', fontSize: 16 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
