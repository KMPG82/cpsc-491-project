import { useRef, useState } from 'react';
import {
  Alert,
  Button,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useAddressAutocomplete, type AddressAutocompleteState } from '@/hooks/useAddressAutocomplete';
import type { Location } from '@/types/location';
import { lyftUrls, openRideApp, uberUrls } from '@/utilities/rideshare';

type RideLocations = { pickup: Location; destination: Location };

export default function HomeScreen() {
  const pickup = useAddressAutocomplete();
  const destination = useAddressAutocomplete();
  const [confirmed, setConfirmed] = useState<RideLocations | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const confirmedRef = useRef<RideLocations | null>(null);
  const handoffInProgress = useRef(false);
  const [openingProvider, setOpeningProvider] = useState(false);

  const invalidateConfirmation = () => {
    confirmedRef.current = null;
    setConfirmed(null);
    setShowDetails(false);
  };

  // Delegate searching and selection to the hook; edits also invalidate the pair
  // synchronously so a queued provider press cannot use an old confirmation.
  const fieldState = (field: AddressAutocompleteState): AddressAutocompleteState => ({
    ...field,
    onChangeText: (text) => {
      invalidateConfirmation();
      field.onChangeText(text);
    },
    selectSuggestion: (location) => {
      invalidateConfirmation();
      field.selectSuggestion(location);
    },
  });

  const handleConfirm = () => {
    if (handoffInProgress.current || confirmedRef.current) return;
    if (!pickup.selectedLocation || !destination.selectedLocation) {
      Alert.alert('Select both locations', 'Choose a suggestion for pickup and destination before confirming.');
      return;
    }
    const pair = { pickup: pickup.selectedLocation, destination: destination.selectedLocation };
    confirmedRef.current = pair;
    setConfirmed(pair);
    Keyboard.dismiss();
  };

  const handleOpenRide = async (provider: 'Uber' | 'Lyft') => {
    const pair = confirmedRef.current;
    if (!pair || handoffInProgress.current) return;
    handoffInProgress.current = true;
    setOpeningProvider(true);
    try {
      const urls = provider === 'Uber'
        ? uberUrls(pair.pickup, pair.destination)
        : lyftUrls(pair.pickup, pair.destination);
      await openRideApp(urls);
    } catch {
      Alert.alert(`Could not open ${provider}`, 'Could not open the app or its website. Please try again.');
    } finally {
      handoffInProgress.current = false;
      setOpeningProvider(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={false}
      >
        <AddressAutocomplete label="Pickup" placeholder="Enter a pickup address" autocomplete={fieldState(pickup)} />
        <AddressAutocomplete label="Destination" placeholder="Enter a destination address" autocomplete={fieldState(destination)} />

        {pickup.selectedLocation && <Text style={styles.selected}>Pickup: {pickup.selectedLocation.formattedAddress}</Text>}
        {destination.selectedLocation && <Text style={styles.selected}>Destination: {destination.selectedLocation.formattedAddress}</Text>}
        <View style={styles.btn}>
          <Button
            title="Confirm locations"
            disabled={!pickup.selectedLocation || !destination.selectedLocation || !!confirmed || openingProvider}
            onPress={handleConfirm}
          />
        </View>
        {confirmed && (
          <>
            <Text style={styles.confirmed}>
              Confirmed pickup: {confirmed.pickup.formattedAddress}{'\n'}
              Confirmed destination: {confirmed.destination.formattedAddress}{'\n'}
              Check both pins in Uber or Lyft before requesting a ride.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: showDetails }}
              onPress={() => setShowDetails((visible) => !visible)}
              style={styles.detailsToggle}
            >
              <Text style={styles.detailsLabel}>{showDetails ? 'Hide' : 'Show'} coordinate details</Text>
            </Pressable>
            {showDetails && (
              <View style={styles.details}>
                <Text selectable style={styles.selected}>
                  Pickup latitude: {confirmed.pickup.latitude}{'\n'}
                  Pickup longitude: {confirmed.pickup.longitude}
                </Text>
                <Text selectable style={styles.selected}>
                  Destination latitude: {confirmed.destination.latitude}{'\n'}
                  Destination longitude: {confirmed.destination.longitude}
                </Text>
              </View>
            )}
            <View style={styles.btn}>
              <Button title="Open Uber" disabled={openingProvider} onPress={() => handleOpenRide('Uber')} />
            </View>
            <View style={styles.btn}>
              <Button title="Open Lyft" disabled={openingProvider} onPress={() => handleOpenRide('Lyft')} />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },
  btn: { marginVertical: 8 },
  detailsToggle: { minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  detailsLabel: { color: '#2458a6', fontSize: 14 },
  details: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  selected: { color: '#444', marginVertical: 4 },
  confirmed: { marginTop: 16, marginBottom: 8, textAlign: 'center', color: '#444' },
});
