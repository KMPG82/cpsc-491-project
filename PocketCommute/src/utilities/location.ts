import * as ExpoLocation from 'expo-location';
import { Platform } from 'react-native';

import type { Location } from '@/types/location';

export async function geocodeDestination(address: string): Promise<Location | null> {
  const trimmedAddress = address.trim();
  if (!trimmedAddress) return null;

  if (Platform.OS === 'android') {
    const { granted } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (!granted) {
      throw new Error('Location permission is required to look up addresses on Android.');
    }
  }

  const results = await ExpoLocation.geocodeAsync(trimmedAddress);
  if (!results.length) return null;

  if (results.length > 1) {
    throw new Error('This address has multiple matches. Add a building name, city, or postal code and try again.');
  }

  const { latitude, longitude } = results[0];
  if (
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) {
    throw new Error('The address lookup returned invalid coordinates. Try a more specific address.');
  }

  // Geocoding does not guarantee an exact building or entrance. Show what the
  // returned point resolves to rather than echoing the user's input as verified.
  const [resolved] = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
  if (!resolved) {
    throw new Error('Could not verify the resolved location. Try a more specific address.');
  }
  const street = [resolved.streetNumber, resolved.street].filter(Boolean).join(' ');
  const formattedAddress = [...new Set([
    resolved.name, street, resolved.city, resolved.region, resolved.postalCode, resolved.country,
  ].filter((part): part is string => typeof part === 'string' && !!part.trim()))].join(', ');
  if (!formattedAddress) {
    throw new Error('The resolved location has no address to review. Try a more specific address.');
  }

  return { formattedAddress, latitude, longitude };
}
