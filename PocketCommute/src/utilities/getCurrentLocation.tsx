import * as Location from "expo-location";

import { getNearbyPlaces } from "./getNearbyPlaces";

//get the user's current location and call getNearbyPlaces
export async function getCurrentLocation(
  setLocation: (location: Location.LocationObject) => void,
  setErrorMsg: (message: string) => void,
  setNearbyPlaces: (places: any[]) => void,
  setLoadingNearbyPlaces: (loading: boolean) => void,
) {
  //used example from Expo Location documentation as reference: https://docs.expo.dev/versions/latest/sdk/location/
  let { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    setErrorMsg("Permission to access location was denied");
    return;
  }

  let location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  setLocation(location);

  await getNearbyPlaces(
    location.coords.latitude,
    location.coords.longitude,
    setNearbyPlaces,
    setLoadingNearbyPlaces,
  );

  setLoadingNearbyPlaces(false);
}
