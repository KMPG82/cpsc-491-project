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
    params.append("fuel[type]", "petrol");
    params.append(
      "fuel[freeFlowSpeedTable]",
      "0,0.239,27,0.239,45,0.259,60,0.196,75,0.207,90,0.238,100,0.26,110,0.296,120,0.337,130,0.351",
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

  try {
    const response = await fetch(
      `https://router.hereapi.com/v8/routes?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(`${response.status}`);
    }

    const hereRouteData = await response.json();

    //console.log("route data: ", hereRouteData.routes);
    retrievedRoute = hereRouteData.routes;

    setHereRoute(retrievedRoute[0]);
    setRetrievingHereRoute(false);
  } catch (error) {
    console.log("HERE route retrieval was unsuccessful.", error);
  }
}
