import { useState, useRef, useEffect } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button } from "react-native-paper";
import { View, StyleSheet, ActivityIndicator, ScrollView } from "react-native";

import { getGoogleRoute } from "../utilities/getGoogleRoute";
import { getHereRoute } from "../utilities/getHereRoute";
import {
  decodeGooglePolyline,
  decodeHerePolyline,
} from "../utilities/decodePolyline";

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
  const [googleRouteChosen, setGoogleRouteChosen] = useState<boolean>(false);

  const [hereRoute, setHereRoute] = useState<HereRoute | null>(null);
  const [retrievingHereRoute, setRetrievingHereRoute] = useState<boolean>(true);
  const [hereRouteChosen, setHereRouteChosen] = useState<boolean>(false);

  const [routeDetails, setRouteDetails] = useState<"google" | "here">("google");

  /*TODO:
      1. convert the distance for Google and Here routes to miles, currently it is in meters
      2. convert the time for Google and Here routes to minutes, currently it is in seconds
      3. if mode is set to driving, convert the fuel consumption for Google and Here routes to gallons, currently Google's is measured in microliters and Here's is measured in liters
      4. create the scoring algorithm based on the chosen priority
        *use these formulas if mode is set to DRIVE:
        - if priority is time, then use: (0.70)(time in minutes) + (0.10)(distance in miles) + (0.10)(number of directions) + (0.10)(fuel consumption in gallons)
        - if priority is distance, then use: (0.10)(time in minutes) + (0.70)(distance in miles) + (0.10)(number of directions) + (0.10)(fuel consumption in gallons)
        - if priority is directions, then use: (0.10)(time in minutes) + (0.10)(distance in miles) + (0.70)(number of directions) + (0.10)(fuel consumption in gallons)
        - if priority is fuel, then use: (0.10)(time in minutes) + (0.10)(distance in miles) + (0.10)(number of directions) + (0.70)(fuel consumption in gallons)
          
        *use these formulas if mode is not set to DRIVE:
        - if priority is time, then use: (0.70)(time in minutes) + (0.15)(distance in miles) + (0.15)(number of directions)
        - if priority is distance, then use: (0.15)(time in minutes) + (0.70)(distance in miles) + (0.15)(number of directions)
        - if priority is directions, then use: (0.15)(time in minutes) + (0.15)(distance in miles) + (0.70)(number of directions)
  */
  function evaluateRoutes(
    googleRoute: GoogleRoute | null,
    setGoogleRouteChosen: (googleChosen: boolean) => void,
    hereRoute: HereRoute | null,
    setHereRouteChosen: (hereChosen: boolean) => void,
  ) {
    console.log("Priority:", priority);
    console.log("Mode:", mode);

    //if one of the routes could not be retrieved, choose the other one
    if (!googleRoute || !hereRoute) {
      if (googleRoute) {
        setGoogleRouteChosen(true);
        setRouteDetails("google");
      } else if (hereRoute) {
        setHereRouteChosen(true);
        setRouteDetails("here");
      }
      return;
    }

    //google's route data
    //duration is a string like "1234s", so parseFloat takes out the number first
    const googleTime = convertToMinutes(parseFloat(googleRoute.duration));
    console.log("Google route time:", googleTime);
    const googleDistance = convertToMiles(googleRoute.distanceMeters);
    console.log("Google route distance:", googleDistance);
    let googleFuel = 0;
    if (mode == "DRIVE") {
      googleFuel = convertToGallons(
        googleRoute.travelAdvisory?.fuelConsumptionMicroliters ?? 0,
        "microliters",
      );
      console.log("Google route fuel consumption:", googleFuel);
    }
    const googleDirections = googleRoute.legs[0].steps.length;
    console.log("Number of Google route directions:", googleDirections);

    //here's route data
    const hereTime = convertToMinutes(hereRoute.sections[0].summary.duration);
    console.log("HERE route time:", hereTime);
    const hereDistance = convertToMiles(hereRoute.sections[0].summary.length);
    console.log("HERE route distance:", hereDistance);
    let hereFuel = 0;
    if (mode == "DRIVE") {
      hereFuel = convertToGallons(
        hereRoute.sections[0].summary.consumption ?? 0,
        "liters",
      );
      console.log("HERE route fuel consumption:", hereFuel);
    }
    const hereDirections = hereRoute.sections[0].actions.length;
    console.log("Number of HERE route directions:", hereDirections);

    //calculates a route's score using the formula for the chosen mode and priority
    const calculateScore = (time: number, distance: number, directions: number, fuel: number): number => {
      let score = 0;
      // given formulas
      if (mode == "DRIVE") {
        if (priority == "time") {
          score = 0.7 * time + 0.1 * distance + 0.1 * directions + 0.1 * fuel;
        } else if (priority == "distance") {
          score = 0.1 * time + 0.7 * distance + 0.1 * directions + 0.1 * fuel;
        } else if (priority == "directions") {
          score = 0.1 * time + 0.1 * distance + 0.7 * directions + 0.1 * fuel;
        } else if (priority == "fuel") {
          score = 0.1 * time + 0.1 * distance + 0.1 * directions + 0.7 * fuel;
        }
        
      } else {
        if (priority == "distance") {
          score = 0.15 * time + 0.7 * distance + 0.15 * directions;
        } else if (priority == "directions") {
          score = 0.15 * time + 0.15 * distance + 0.7 * directions;
        } else {
          //time, also used if fuel was left selected after switching from driving
          score = 0.7 * time + 0.15 * distance + 0.15 * directions;
        }
      }
      return score;
    };

    const googleScore = calculateScore(
      googleTime,
      googleDistance,
      googleDirections,
      googleFuel,
    );
    console.log("Google route score:", googleScore);
    const hereScore = calculateScore(
      hereTime,
      hereDistance,
      hereDirections,
      hereFuel,
    );
    console.log("HERE route score:", hereScore);

    //the lowest score is the optimal route
    if (googleScore <= hereScore) {
      setGoogleRouteChosen(true);
      setRouteDetails("google");
    } else {
      setHereRouteChosen(true);
      setRouteDetails("here");
    }
  }

  //convert a distance in meters to miles
  const convertToMiles = (distanceInMeters: number): number => {
    //1 mile = 1609.344 meters
    let distanceInMiles = distanceInMeters / 1609.344;
    return distanceInMiles;
  };

  //convert a time in seconds to minutes
  const convertToMinutes = (timeInSeconds: number): number => {
    //1 minute = 60 seconds
    let timeInMinutes = timeInSeconds / 60;
    return timeInMinutes;
  };

  //convert fuel consumption to gallons, google gives microliters and here gives liters
  const convertToGallons = (fuel: number, unit: "microliters" | "liters",): number => {
    let fuelInLiters = fuel;
    if (unit === "microliters") {
      //1 liter = 1,000,000 microliters
      fuelInLiters = fuel / 1000000;
    }
    
    //1 gallon = 3.785411784 liters
    let fuelInGallons = fuelInLiters / 3.785411784;
    return fuelInGallons;
  };

  //happens everytime a usestate var is changed, which causes the screen to re-render
  let googleCoordinates: Coordinate[] = [];
  if (googleRoute) {
    googleCoordinates = decodeGooglePolyline(
      googleRoute.polyline.encodedPolyline,
    );
  }

  let hereCoordinates: Coordinate[] = [];
  if (hereRoute) {
    hereCoordinates = decodeHerePolyline(hereRoute.sections[0].polyline);
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
    getHereRoute(
      currentLocationLat,
      currentLocationLong,
      mode,
      destinationLat,
      destinationLong,
      shouldAvoidHighways,
      shouldAvoidTolls,
      setRetrievingHereRoute,
      setHereRoute,
    );
  }, []);

  useEffect(() => {
    if (!retrievingGoogleRoute && !retrievingHereRoute) {
      evaluateRoutes(
        googleRoute,
        setGoogleRouteChosen,
        hereRoute,
        setHereRouteChosen,
      );
    }
  }, [googleRoute, hereRoute]);

  if (retrievingGoogleRoute || retrievingHereRoute) {
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
          pinColor="red"
        />

        <Marker
          coordinate={{
            latitude: destinationLat,
            longitude: destinationLong,
          }}
          title={search}
          pinColor="red"
        />

        {googleCoordinates.length > 0 && (
          <Polyline
            coordinates={googleCoordinates}
            strokeColor={googleRouteChosen ? "green" : "gray"}
            strokeWidth={5}
          />
        )}

        {hereCoordinates.length > 0 && (
          <Polyline
            coordinates={hereCoordinates}
            strokeColor={hereRouteChosen ? "green" : "gray"}
            strokeWidth={5}
          />
        )}
      </MapView>

      <ScrollView
        style={styles.bottomPanelContainer}
        contentContainerStyle={styles.bottomPanelContent}
      >
        <View style={styles.changeRouteDetailsButtonContainer}>
          <Button
            mode="contained"
            buttonColor="blue"
            onPress={() => {
              if (routeDetails === "google" && hereRoute) {
                setRouteDetails("here");
              } else if (googleRoute) {
                setRouteDetails("google");
              }
            }}
          >
            {routeDetails === (googleRouteChosen ? "google" : "here")
              ? "View Alternative Route"
              : "View Optimal Route"}
          </Button>
        </View>
        {googleRoute && routeDetails === "google" && (
          <>
            <Text variant="headlineMedium">Google Route Details</Text>

            <Text variant="bodyLarge">Duration: {googleRoute.duration}</Text>

            <Text variant="bodyLarge">
              Distance: {googleRoute.distanceMeters}m
            </Text>

            <Text variant="bodyLarge">
              Number of Directions: {googleRoute.legs[0].steps.length}
            </Text>

            {mode === "DRIVE" &&
              googleRoute.travelAdvisory?.fuelConsumptionMicroliters && (
                <Text variant="bodyLarge">
                  Estimated Fuel:{" "}
                  {googleRoute.travelAdvisory?.fuelConsumptionMicroliters}
                </Text>
              )}

            <Text variant="headlineMedium">Directions</Text>

            {googleRoute.legs[0].steps.map((step, index) => (
              <View key={index} style={styles.direction}>
                <View style={styles.directionContainer}>
                  <Text variant="bodyLarge" style={styles.directionNumber}>
                    {index + 1}.
                  </Text>

                  <Text variant="bodyLarge">
                    {step.navigationInstruction.instructions}, go for{" "}
                    {step.distanceMeters}m
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {hereRoute && routeDetails === "here" && (
          <>
            <Text variant="headlineMedium">HERE Route Details</Text>

            <Text variant="bodyLarge">
              Duration: {hereRoute.sections[0].summary.duration}
            </Text>

            <Text variant="bodyLarge">
              Distance: {hereRoute.sections[0].summary.length}m
            </Text>

            <Text variant="bodyLarge">
              Number of Directions: {hereRoute.sections[0].actions.length}
            </Text>

            {mode === "DRIVE" && hereRoute.sections[0].summary.consumption && (
              <Text variant="bodyLarge">
                Estimated Fuel: {hereRoute.sections[0].summary.consumption}L
              </Text>
            )}

            <Text variant="headlineMedium">Directions</Text>

            {hereRoute.sections[0].actions.map((action, index) => (
              <View key={index} style={styles.direction}>
                <View style={styles.directionContainer}>
                  <Text variant="bodyLarge" style={styles.directionNumber}>
                    {index + 1}.
                  </Text>

                  <Text variant="bodyLarge"> {action.instruction}</Text>
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
  changeRouteDetailsButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
});
