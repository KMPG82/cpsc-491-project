import * as ExpoLocation from 'expo-location';

import type { Location } from '@/types/location';

export async function geocodeDestination(address: string): Promise<Location | null> {
  const trimmedAddress = address.trim();
  if (!trimmedAddress) return null;

  const results = await ExpoLocation.geocodeAsync(trimmedAddress);
  if (!results.length) return null;

  const { latitude, longitude } = results[0];
  return {
    formattedAddress: trimmedAddress,
    latitude,
    longitude,
  };
}
