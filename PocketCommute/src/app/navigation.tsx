import { useState, useRef, useEffect } from "react";
import Constants from "expo-constants";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { View, StyleSheet, ActivityIndicator, ScrollView } from "react-native";

import {
  decodeGooglePolyline,
  decodeHerePolyline,
} from "../utilities/decodePolyline";

const HERE_API_KEY = Constants.expoConfig?.extra?.hereRoutingApiKey;

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

type Coordinate = {
  latitude: number;
  longitude: number;
};

export default function navigation() {
  //retrieve preferences, current location, and destination information
  const {
    priority,
    mode,
    avoidHighways,
    avoidTolls,
    search,
    currentLocationLatitude,
    currentLocationLongitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocalSearchParams() as {
    priority: string;
    mode: string;
    avoidHighways: string;
    avoidTolls: string;
    search: string;
    currentLocationLatitude: string;
    currentLocationLongitude: string;
    destinationLatitude: string;
    destinationLongitude: string;
  };

  //convert to original data types
  const shouldAvoidHighways: boolean = avoidHighways === "true";
  const shouldAvoidTolls: boolean = avoidTolls === "true";

  const currentLocationLat: number = parseFloat(currentLocationLatitude);
  const currentLocationLong: number = parseFloat(currentLocationLongitude);

  const destinationLat: number = parseFloat(destinationLatitude);
  const destinationLong: number = parseFloat(destinationLongitude);

  const [googleRoute, setGoogleRoute] = useState<GoogleRoute | null>(null);
  const [retrievingGoogleRoute, setRetrievingGoogleRoute] =
    useState<boolean>(true);

  const [hereRoute, setHereRoute] = useState<HereRoute | null>(null);
  const [retrievingHereRoute, setRetrievingHereRoute] = useState<boolean>(true);

  const [optimalRoute, setOptimalRoute] = useState<HereRoute | null>(null);

  // console.log("priority:", priority);
  // console.log("mode:", mode);
  // console.log("search query:", search);
  // console.log("avoid highways:", shouldAvoidHighways);
  // console.log("avoid tolls:", shouldAvoidTolls);
  // console.log(
  //   "current coordinates:",
  //   `${currentLocationLat}, ${currentLocationLong}`,
  // );
  // console.log(
  //   "destination coordinates:",
  //   `${destinationLat}, ${destinationLong}`,
  // );

  //retrives route from HERE using current location and destination
  async function getHereRoute(
    currentLocationLat: number,
    currentLocationLong: number,
    mode: string,
    destinationLat: number,
    destinationLong: number,
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
    }

    const response = await fetch(
      `https://router.hereapi.com/v8/routes?${params.toString()}`,
    );

    const hereRouteData = await response.json();

    if (!response.ok) {
      console.log("Route retrieval was unsuccessful.");
      return;
    }

    console.log("route data: ", hereRouteData.routes);
    retrievedRoute = hereRouteData.routes;

    setHereRoute(retrievedRoute[0]);
    setRetrievingHereRoute(false);
  }

  //evaluation algorithm for routes
  function evaluateRoutes(
    googleRoute: GoogleRoute | null,
    hereRoute: HereRoute | null,
  ) {
    setOptimalRoute(hereRoute);
  }

  //happens everytime a usestate var is changed, which causes the screen to re-render
  let coordinates: Coordinate[] = [];
  if (optimalRoute) {
    //coordinates = decodeGooglePolyline(optimalRoute.polyline.encodedPolyline);
    coordinates = decodeHerePolyline(optimalRoute.sections[0].polyline);
  }

  useEffect(() => {
    // getGoogleRoute(
    //   currentLocationLat,
    //   currentLocationLong,
    //   mode,
    //   destinationLat,
    //   destinationLong,
    //   shouldAvoidHighways,
    //   shouldAvoidTolls,
    //   setRetrievingGoogleRoute,
    //   setGoogleRoute,
    // );
    getHereRoute(
      currentLocationLat,
      currentLocationLong,
      mode,
      destinationLat,
      destinationLong,
      setRetrievingHereRoute,
      setHereRoute,
    );
  }, []);

  useEffect(() => {
    if (!retrievingHereRoute) {
      evaluateRoutes(googleRoute, hereRoute);
    }
  }, [hereRoute]);

  if (retrievingHereRoute) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safeArea}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: currentLocationLat,
          longitude: currentLocationLong,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker
          coordinate={{
            latitude: currentLocationLat,
            longitude: currentLocationLong,
          }}
          title="Current Location"
          pinColor="blue"
        />

        <Marker
          coordinate={{
            latitude: destinationLat,
            longitude: destinationLong,
          }}
          title={search}
          pinColor="red"
        />

        {coordinates.length > 0 && (
          <Polyline
            coordinates={coordinates}
            strokeColor="#2563eb"
            strokeWidth={5}
          />
        )}
      </MapView>

      {/* for HERE route */}
      <ScrollView
        style={styles.bottomPanelContainer}
        contentContainerStyle={styles.bottomPanelContent}
      >
        {optimalRoute && (
          <>
            <Text variant="headlineMedium">Route Details</Text>

            <Text variant="bodyLarge">
              Duration: {optimalRoute.sections[0].summary.duration}
            </Text>

            <Text variant="bodyLarge">
              Distance: {optimalRoute.sections[0].summary.length}m
            </Text>

            {mode === "DRIVE" &&
              optimalRoute.sections[0].summary.consumption && (
                <Text variant="bodyLarge">
                  Estimated Fuel: {optimalRoute.sections[0].summary.consumption}
                  L
                </Text>
              )}

            <Text variant="headlineMedium">Directions</Text>

            {optimalRoute.sections[0].actions.map((action, index) => (
              <View key={index} style={styles.direction}>
                <View style={styles.directionContainer}>
                  <Text variant="bodyLarge" style={styles.directionNumber}>
                    {index + 1}.
                  </Text>

                  <Text variant="bodyLarge">{action.instruction}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      {/* for Google route
      <ScrollView
        style={styles.bottomPanelContainer}
        contentContainerStyle={styles.bottomPanelContent}
      >
        {optimalRoute && (
          <>
            <Text variant="headlineMedium">Route Details</Text>

            <Text variant="bodyLarge">Duration: {optimalRoute.duration}</Text>

            <Text variant="bodyLarge">
              Distance: {optimalRoute.distanceMeters}m
            </Text>

            {mode === "DRIVE" &&
              optimalRoute.travelAdvisory?.fuelConsumptionMicroliters && (
                <Text variant="bodyLarge">
                  Estimated Fuel:{" "}
                  {optimalRoute.travelAdvisory?.fuelConsumptionMicroliters}
                </Text>
              )}

            <Text variant="headlineMedium">Directions</Text>

            {optimalRoute.legs[0].steps.map((step, index) => (
              <View key={index} style={styles.direction}>
                <View style={styles.directionContainer}>
                  <Text variant="bodyLarge" style={styles.directionNumber}>
                    {index + 1}.
                  </Text>

                  <Text variant="bodyLarge">
                    {step.navigationInstruction.instructions}, go for {step.distanceMeters}m
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView> */}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  map: {
    width: "100%",
    flex: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomPanelContainer: {
    flex: 2,
    backgroundColor: "#ffffff",
  },
  bottomPanelContent: {
    padding: 10,
  },
  directionContainer: {
    flex: 1,
    flexDirection: "row",
    paddingRight: 10,
  },
  directionNumber: {
    fontWeight: "bold",
  },
  direction: {
    marginBottom: 10,
  },
});
