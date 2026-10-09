import Constants from "expo-constants";

const GEOAPIFY_KEY = Constants.expoConfig?.extra?.geoapifyApiKey;

//fetch nearby places using Geoapify Places API
export async function getNearbyPlaces(
  latitude: number,
  longitude: number,
  setNearbyPlaces: (places: any[]) => void,
) {
  //used example from Geoapify Places API documentation as reference: https://apidocs.geoapify.com/docs/places/
  const requestOptions = {
    method: "GET",
  };

  return fetch(
    `https://api.geoapify.com/v2/places?categories=commercial,catering&filter=circle:${longitude},${latitude},5000&bias=proximity:${longitude},${latitude}&limit=40&apiKey=${GEOAPIFY_KEY}`,
    requestOptions,
  )
    .then((response) => response.json())
    .then((result) => setNearbyPlaces(result.features || []))
    .catch((error) => console.log("error", error));
}
