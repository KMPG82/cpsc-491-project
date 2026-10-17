import Constants from "expo-constants";

const HERE_API_KEY = Constants.expoConfig?.extra?.hereRoutingApiKey;

type HereRoute = {
  sections: {
    summary: {
      length: number;
      duration: number;
      consumption?: number;
    };
    polyline: string;
    actions: {
      instruction?: string;
      length?: number;
      duration?: number;
    }[];
  }[];
};

//retrives route from HERE using current location and destination
export async function getHereRoute(
  currentLocationLat: number,
  currentLocationLong: number,
  mode: string,
  destinationLat: number,
  destinationLong: number,
  shouldAvoidHighways: boolean,
  shouldAvoidTolls: boolean,
  setRetrievingHereRoute: (retrieving: boolean) => void,
  setHereRoute: (route: HereRoute | null) => void,
) {
  let retrievedRoute: HereRoute[] = [];

  let transportMode = "car";

  if (mode === "WALK") {
    transportMode = "pedestrian";
  } else if (mode === "BICYCLE") {
    transportMode = "bicycle";
  }

  const params = new URLSearchParams({
    origin: `${currentLocationLat},${currentLocationLong}`,
    destination: `${destinationLat},${destinationLong}`,
    transportMode,
    return: "summary,polyline,actions,instructions",
    apiKey: HERE_API_KEY,
  });

  //free flow speed table is from HERE documentation: https://docs.here.com/routing/docs/routing-v8-consumption-ice-empirical
  if (transportMode == "car") {
    params.append("fuel[type]", "diesel");
    params.append(
      "fuel[freeFlowSpeedTable]",
      "10,0.095,20,0.072,30,0.058,40,0.049,50,0.045,60,0.043,70,0.042,80,0.043,90,0.045,100,0.047,110,0.05,120,0.052,130,0.055",
    );

    const avoidancePreferences = [];

    if (shouldAvoidHighways) {
      avoidancePreferences.push("controlledAccessHighway");
    }

    if (shouldAvoidTolls) {
      avoidancePreferences.push("tollRoad");
    }

    if (avoidancePreferences.length > 0) {
      params.append("avoid[features]", avoidancePreferences.join(","));
    }
  }

  const response = await fetch(
    `https://router.hereapi.com/v8/routes?${params.toString()}`,
  );

  const hereRouteData = await response.json();

  if (!response.ok) {
    console.log("Route retrieval was unsuccessful.");
    return;
  }

  //console.log("route data: ", hereRouteData.routes);
  retrievedRoute = hereRouteData.routes;

  setHereRoute(retrievedRoute[0]);
  setRetrievingHereRoute(false);
}
