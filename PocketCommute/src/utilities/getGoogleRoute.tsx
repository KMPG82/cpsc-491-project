import Constants from "expo-constants";

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleMapsRoutesApiKey;

type GoogleRoute = {
  distanceMeters: number;
  duration: string;
  polyline: {
    encodedPolyline: string;
  };
  legs: {
    steps: {
      distanceMeters: number;
      staticDuration: string;
      navigationInstruction: {
        instructions: string;
      };
    }[];
  }[];
  travelAdvisory?: {
    fuelConsumptionMicroliters?: number;
  };
};

//gets a route from google using current location, preferences, and destination
export async function getGoogleRoute(
  currentLocationLat: number,
  currentLocationLong: number,
  mode: string,
  destinationLat: number,
  destinationLong: number,
  shouldAvoidHighways: boolean,
  shouldAvoidTolls: boolean,
  setRetrievingGoogleRoute: (retrieving: boolean) => void,
  setGoogleRoute: (route: GoogleRoute | null) => void,
) {
  let retrievedRoute: GoogleRoute[] = [];

  if (mode == "DRIVE") {
    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.navigationInstruction.instructions,routes.travelAdvisory.fuelConsumptionMicroliters",
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: currentLocationLat,
                longitude: currentLocationLong,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: destinationLat,
                longitude: destinationLong,
              },
            },
          },
          travelMode: mode,
          routingPreference: "TRAFFIC_AWARE_OPTIMAL",
          extraComputations: ["FUEL_CONSUMPTION"],
          routeModifiers: {
            avoidTolls: shouldAvoidTolls,
            avoidHighways: shouldAvoidHighways,
            vehicleInfo: {
              emissionType: "GASOLINE",
            },
          },
        }),
      },
    );

    const googleRouteData = await response.json();

    if (!response.ok) {
      console.log("Route retrieval was unsuccessful.");
      return;
    }

    console.log("route data: ", googleRouteData.routes);
    retrievedRoute = googleRouteData.routes;
  } else {
    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.navigationInstruction.instructions",
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: currentLocationLat,
                longitude: currentLocationLong,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: destinationLat,
                longitude: destinationLong,
              },
            },
          },
          travelMode: mode,
        }),
      },
    );

    const googleRouteData = await response.json();

    if (!response.ok) {
      console.log("Route retrieval was unsuccessful.");
      return;
    }

    console.log("google route data: ", googleRouteData.routes);
    retrievedRoute = googleRouteData.routes;
  }

  setGoogleRoute(retrievedRoute[0]);
  setRetrievingGoogleRoute(false);
}
