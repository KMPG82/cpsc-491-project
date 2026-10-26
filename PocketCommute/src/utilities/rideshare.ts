import * as Linking from 'expo-linking';

import type { Location } from '@/types/location';

type RideUrls = {
  app: string;
  web: string;
};

const enc = encodeURIComponent;

export function uberUrls({ formattedAddress, latitude, longitude }: Location): RideUrls {
  const query =
    'action=setPickup&pickup=my_location' +
    `&dropoff[latitude]=${latitude}&dropoff[longitude]=${longitude}` +
    `&dropoff[nickname]=${enc(formattedAddress)}` +
    `&dropoff[formatted_address]=${enc(formattedAddress)}`;

  return {
    app: `uber://riderequest?${query}`,
    web: `https://m.uber.com/?${query}`,
  };
}

export function lyftUrls({ latitude, longitude }: Location): RideUrls {
  const query =
    `id=lyft&destination[latitude]=${latitude}` +
    `&destination[longitude]=${longitude}`;

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
