import * as Linking from 'expo-linking';

import type { Location } from '@/types/location';

type RideUrls = {
  app: string;
  web: string;
};

const enc = encodeURIComponent;

export function uberUrls(pickup: Location, destination: Location): RideUrls {
  const query =
    'action=setPickup' +
    `&pickup[latitude]=${pickup.latitude}&pickup[longitude]=${pickup.longitude}` +
    `&pickup[nickname]=${enc(pickup.formattedAddress)}` +
    `&pickup[formatted_address]=${enc(pickup.formattedAddress)}` +
    `&dropoff[latitude]=${destination.latitude}&dropoff[longitude]=${destination.longitude}` +
    `&dropoff[nickname]=${enc(destination.formattedAddress)}` +
    `&dropoff[formatted_address]=${enc(destination.formattedAddress)}`;

  return {
    app: `uber://riderequest?${query}`,
    web: `https://m.uber.com/?${query}`,
  };
}

export function lyftUrls(pickup: Location, destination: Location): RideUrls {
  const query =
    `id=lyft&pickup[latitude]=${pickup.latitude}&pickup[longitude]=${pickup.longitude}` +
    `&destination[latitude]=${destination.latitude}` +
    `&destination[longitude]=${destination.longitude}`;

  return {
    app: `lyft://ridetype?${query}`,
    web: `https://ride.lyft.com/u?${query}`,
  };
}

export async function openRideApp({ app, web }: RideUrls): Promise<void> {
  try {
    await Linking.openURL(app);
  } catch {
    // Let a failed web fallback reject so the screen can display the error.
    await Linking.openURL(web);
  }
}
