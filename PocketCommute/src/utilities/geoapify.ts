import Constants from 'expo-constants';

import type { Location } from '@/types/location';

export async function searchAddresses(query: string): Promise<Location[]> {
  const text = query.trim();
  if (!text) return [];

  const apiKey = Constants.expoConfig?.extra?.geoapifyApiKey;
  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new Error('Geoapify API key is missing from Expo configuration.');
  }

  const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&limit=5&format=geojson&apiKey=${encodeURIComponent(apiKey)}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('Geoapify address search failed. Check your connection and try again.');
  }

  if (!response.ok) {
    throw new Error(`Geoapify address search failed (HTTP ${response.status}).`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error('Geoapify returned an invalid JSON response.');
  }

  if (!data || typeof data !== 'object' || !('features' in data) || !Array.isArray(data.features)) {
    throw new Error('Geoapify returned an unexpected address search response.');
  }

  const locations: Location[] = [];
  for (const feature of data.features) {
    if (!feature || typeof feature !== 'object') continue;
    const properties = feature.properties;
    if (!properties || typeof properties !== 'object') continue;

    const { formatted, lat, lon, place_id } = properties;
    if (
      typeof formatted !== 'string' || !formatted.trim() ||
      typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90 ||
      typeof lon !== 'number' || !Number.isFinite(lon) || lon < -180 || lon > 180
    ) continue;

    locations.push({
      formattedAddress: formatted.trim(),
      latitude: lat,
      longitude: lon,
      ...(typeof place_id === 'string' && place_id.trim() ? { placeId: place_id.trim() } : {}),
    });
    if (locations.length === 5) break;
  }

  return locations;
}
