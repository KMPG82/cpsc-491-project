import Constants from "expo-constants";

const GEOAPIFY_KEY = Constants.expoConfig?.extra?.geoapifyApiKey;

//fetch suggestions for search query using Geoapify Address Autocomplete API
export async function getSuggestions(
  setSuggestions: (suggestions: any[]) => void,
  searchQuery: string,
  longitude: number,
  latitude: number,
  setErrorMessage: (message: string) => void,
) {
  if (!searchQuery.trim()) {
    setSuggestions([]);
    return;
  }

  //used example from Geoapify Places API documentation as reference: https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/
  const requestOptions = {
    method: "GET",
  };

  fetch(
    `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(searchQuery)}&limit=5&bias=proximity:${longitude},${latitude}&apiKey=${GEOAPIFY_KEY}`,
    requestOptions,
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(`${response.status}`);
      }

      return response.json();
    })
    .then((result) => setSuggestions(result.features || []))
    .catch((error) => {
      (console.log("Suggestions retrieval was unsuccessful.", error),
        setErrorMessage(
          "Could not retrieve suggestions. Please reload the application.",
        ));
    });
}
