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
      <View style={styles.heading}>
        <Text style={styles.label}>{label}</Text>
        {selectedLocation && <Text style={styles.badge}>Selected</Text>}
      </View>
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
      {selectedLocation && (
        <Text selectable style={styles.selectedAddress}>{selectedLocation.formattedAddress}</Text>
      )}
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
  container: { gap: 10, padding: 16, borderWidth: 1, borderColor: '#E0E1E6', borderRadius: 16, backgroundColor: '#fff' },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  badge: { color: '#235c3b', backgroundColor: '#e9f4ed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12, fontWeight: '600' },
  selectedAddress: { color: '#222', fontSize: 15, lineHeight: 22 },
  label: { color: '#222', fontSize: 16, fontWeight: '600' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#b6b9c0', borderRadius: 10, padding: 12, color: '#222', backgroundColor: '#F0F0F3', fontSize: 16 },
  suggestion: { minHeight: 48, justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#fff' },
  pressed: { backgroundColor: '#e8eef7' },
  text: { color: '#222', fontSize: 16, lineHeight: 23 },
  error: { color: '#a01818', fontSize: 16 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
