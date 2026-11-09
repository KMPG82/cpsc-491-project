import { useEffect, useRef, useState } from 'react';
import * as ExpoLocation from 'expo-location';
import {
  Alert,
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
  const [proximity, setProximity] = useState<Pick<Location, 'latitude' | 'longitude'>>();
  const locationRequest = useRef<Promise<Pick<Location, 'latitude' | 'longitude'> | undefined> | null>(null);

  useEffect(() => {
    let active = true;
    // Share the one-shot request across effect replays; never request per edit.
    if (!locationRequest.current) {
      locationRequest.current = (async () => {
        try {
          let permission = await ExpoLocation.getForegroundPermissionsAsync();
          if (!permission.granted && permission.status === 'undetermined' && permission.canAskAgain) {
            permission = await ExpoLocation.requestForegroundPermissionsAsync();
          }
          if (!permission.granted) return;
          const { coords } = await ExpoLocation.getCurrentPositionAsync({
            accuracy: ExpoLocation.Accuracy.Balanced,
          });
          const { latitude, longitude } = coords;
          if (Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
              Number.isFinite(longitude) && Math.abs(longitude) <= 180) {
            return { latitude, longitude };
          }
        } catch {
          // Proximity only improves ranking; manual search remains available.
        }
      })();
    }
    void locationRequest.current.then((coordinates) => {
      if (active && coordinates) setProximity(coordinates);
    });
    return () => { active = false; };
  }, []);

  const pickup = useAddressAutocomplete({ proximity });
  const destination = useAddressAutocomplete({ proximity });
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
        <View style={styles.header}>
          <Text style={styles.title}>Plan your ride</Text>
          <Text style={styles.subtitle}>Choose a suggestion for each location, then confirm your trip.</Text>
        </View>
        <AddressAutocomplete label="Pickup" placeholder="Enter a pickup address" autocomplete={fieldState(pickup)} />
        <AddressAutocomplete label="Destination" placeholder="Enter a destination address" autocomplete={fieldState(destination)} />

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !pickup.selectedLocation || !destination.selectedLocation || !!confirmed || openingProvider }}
          disabled={!pickup.selectedLocation || !destination.selectedLocation || !!confirmed || openingProvider}
          onPress={handleConfirm}
          style={({ pressed }) => [styles.action, styles.confirmAction,
            (!pickup.selectedLocation || !destination.selectedLocation || !!confirmed || openingProvider) && styles.disabledAction,
            pressed && styles.pressedAction]}
        >
          <Text style={[styles.actionLabel,
            (!pickup.selectedLocation || !destination.selectedLocation || !!confirmed || openingProvider) && styles.disabledLabel]}>
            {confirmed ? 'Locations confirmed' : 'Confirm locations'}
          </Text>
        </Pressable>
        {confirmed && (
          <>
            <View style={styles.confirmed}>
              <Text style={styles.confirmedTitle}>Ready to open your ride app</Text>
              <Text style={styles.subtitle}>Your selected addresses are shown above. Check both pins in the ride app before requesting a ride.</Text>
            </View>
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
            <View style={styles.providers}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open Uber with confirmed locations"
                accessibilityState={{ disabled: openingProvider }}
                disabled={openingProvider}
                onPress={() => handleOpenRide('Uber')}
                style={({ pressed }) => [styles.action, styles.uberAction, openingProvider && styles.disabledAction, pressed && styles.pressedAction]}
              >
                <Text style={[styles.actionLabel, openingProvider && styles.disabledLabel]}>Open Uber</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open Lyft with confirmed locations"
                accessibilityState={{ disabled: openingProvider }}
                disabled={openingProvider}
                onPress={() => handleOpenRide('Lyft')}
                style={({ pressed }) => [styles.action, styles.lyftAction, openingProvider && styles.disabledAction, pressed && styles.pressedAction]}
              >
                <Text style={[styles.actionLabel, openingProvider && styles.disabledLabel]}>Open Lyft</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1, backgroundColor: '#F0F0F3' },
  container: { flexGrow: 1, padding: 20, paddingTop: 28, paddingBottom: 40, gap: 16, width: '100%', maxWidth: 600, alignSelf: 'center' },
  header: { gap: 8, marginBottom: 4 },
  title: { color: '#111', fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#60646C', fontSize: 15, lineHeight: 22 },
  action: { minHeight: 52, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center' },
  confirmAction: { backgroundColor: '#2458a6' },
  uberAction: { backgroundColor: '#161616' },
  lyftAction: { backgroundColor: '#9b147d' },
  disabledAction: { backgroundColor: '#E0E1E6' },
  disabledLabel: { color: '#60646C' },
  pressedAction: { opacity: 0.75 },
  providers: { gap: 12 },
  confirmedTitle: { color: '#222', fontSize: 17, fontWeight: '600' },
  detailsToggle: { minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  detailsLabel: { color: '#2458a6', fontSize: 14 },
  details: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  selected: { color: '#444', marginVertical: 4 },
  confirmed: { padding: 16, gap: 8, backgroundColor: '#fff', borderRadius: 12 },
});
