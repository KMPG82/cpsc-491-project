import { useState, useRef, useEffect } from "react";
import Constants from "expo-constants";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { View, StyleSheet, ActivityIndicator, ScrollView } from "react-native";

import { decodePolyline } from "../utilities/decodePolyline";
import { getGoogleRoute } from "../utilities/getGoogleRoute";

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
  const [optimalRoute, setOptimalRoute] = useState<GoogleRoute | null>(null);

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

  //evaluation algorithm for routes
  function evaluateRoutes(googleRoute: GoogleRoute | null) {
    setOptimalRoute(googleRoute);
  }

  //happens everytime a usestate var is changed, which causes the screen to re-render
  let coordinates: Coordinate[] = [];
  if (optimalRoute) {
    coordinates = decodePolyline(optimalRoute.polyline.encodedPolyline);
  }

  useEffect(() => {
    getGoogleRoute(
      currentLocationLat,
      currentLocationLong,
      mode,
      destinationLat,
      destinationLong,
      shouldAvoidHighways,
      shouldAvoidTolls,
      setRetrievingGoogleRoute,
      setGoogleRoute,
    );
  }, []);

  // Automatically zoom the map to show the entire route.
  useEffect(() => {
    if (!retrievingGoogleRoute) {
      evaluateRoutes(googleRoute);
    }
  }, [googleRoute]);

  if (retrievingGoogleRoute) {
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

      {/* for Google route */}
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
                    {step.navigationInstruction.instructions}, continue for{" "}
                    {step.distanceMeters}m
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
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
