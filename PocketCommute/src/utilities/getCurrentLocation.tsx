import * as Location from "expo-location";

import { getNearbyPlaces } from "./getNearbyPlaces";

//get the user's current location and call getNearbyPlaces
export async function getCurrentLocation(
  setLocation: (location: Location.LocationObject) => void,
  setNearbyPlaces: (places: any[]) => void,
  setLoadingLocationAndNearbyPlaces: (loading: boolean) => void,
  setErrorMessage: (message: string) => void,
) {
  setLoadingLocationAndNearbyPlaces(true);

  try {
    //used example from Expo Location documentation as reference: https://docs.expo.dev/versions/latest/sdk/location/
    let { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      throw new Error(`${status}`);
    }

    let location = await Location.getCurrentPositionAsync({
      accuracy: 6,
    });

    setLocation(location);

    await getNearbyPlaces(
      location.coords.latitude,
      location.coords.longitude,
      setNearbyPlaces,
      setErrorMessage,
    );

    setLoadingLocationAndNearbyPlaces(false);
  } catch (error) {
    console.error("Current location retrieval was unsuccessful.", error);
    setErrorMessage(
      "Could not determine current location. Please reload the application.",
    );
  }
}
