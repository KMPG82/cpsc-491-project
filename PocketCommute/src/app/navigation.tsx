import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Constants from "expo-constants";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { decodePolyline } from "../utilities/decodePolyline";

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleMapsRoutesApiKey;

type Route = {
  distanceMeters: number;
  duration: string;
  polyline: {
    encodedPolyline: string;
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

  const [googleRoute, setGoogleRoute] = useState<Route | null>(null);
  const [retrievingGoogleRoute, setRetrievingGoogleRoute] =
    useState<boolean>(true);
  const [optimalRoute, setOptimalRoute] = useState<Route | null>(null);

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

  //gets a route from google using current location, preferences, and destination
  async function getGoogleRoute() {
    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
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

    //console.log("route data: ", googleRouteData.routes);
    const retrievedRoute: Route[] = googleRouteData.routes;

    setGoogleRoute(retrievedRoute[0]);
    setRetrievingGoogleRoute(false);
  }

  //evaluation algorithm for routes
  function evaluateRoutes(googleRoute: Route | null) {
    setOptimalRoute(googleRoute);
  }

  //happens everytime a usestate var is changed, which causes the screen to re-render
  let coordinates: Coordinate[] = [];
  if (optimalRoute) {
    coordinates = decodePolyline(optimalRoute.polyline.encodedPolyline);
  }

  useEffect(() => {
    getGoogleRoute();
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
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
