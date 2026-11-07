import { useState, useEffect } from "react";
import { Alert } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button } from "react-native-paper";
import { View, StyleSheet, ActivityIndicator, ScrollView } from "react-native";

import { getGoogleRoute } from "../utilities/getGoogleRoute";
import { getHereRoute } from "../utilities/getHereRoute";
import { modifyHereInstruction } from "../utilities/modifyHereInstruction";
import { calculateFuelConsumptionEstimate } from "../utilities/calculateFuelConsumptionEstimate";
import {
  decodeGooglePolyline,
  decodeHerePolyline,
} from "../utilities/decodePolyline";
import {
  convertToMinutes,
  convertToMiles,
  convertToGallons,
} from "../utilities/conversions";

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
    currentLocationLatitude,
    currentLocationLongitude,
    destinationLatitude,
    destinationLongitude,
    destinationName,
  } = useLocalSearchParams() as {
    priority: string;
    mode: string;
    avoidHighways: string;
    avoidTolls: string;
    currentLocationLatitude: string;
    currentLocationLongitude: string;
    destinationLatitude: string;
    destinationLongitude: string;
    destinationName: string;
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

  const [errorMessage, setErrorMessage] = useState<string>("");

  const [convertedGoogleTime, setConvertedGoogleTime] = useState<number>(0);
  const [convertedGoogleDistance, setConvertedGoogleDistance] =
    useState<number>(0);
  const [convertedGoogleFuel, setConvertedGoogleFuel] = useState<number>(0);
  const [numberOfGoogleDirections, setNumberOfGoogleDirections] =
    useState<number>(0);

  const [convertedHereTime, setConvertedHereTime] = useState<number>(0);
  const [convertedHereDistance, setConvertedHereDistance] = useState<number>(0);
  const [convertedHereFuel, setConvertedHereFuel] = useState<number>(0);
  const [numberOfHereDirections, setNumberOfHereDirections] =
    useState<number>(0);

  const [isGoogleRouteFaster, setIsGoogleRouteFaster] = useState<
    boolean | null
  >(null);
  const [isGoogleRouteShorter, setIsGoogleRouteShorter] = useState<
    boolean | null
  >(null);
  const [
    doesGoogleRouteHaveLessDirections,
    setDoesGoogleRouteHaveLessDirections,
  ] = useState<boolean | null>(null);
  const [doesGoogleRouteUseLessFuel, setIsGoogleRouteUseLessFuel] = useState<
    boolean | null
  >(null);

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
    const googleTimeMinutes = convertToMinutes(
      parseFloat(googleRoute.duration),
    );
    //console.log("Google route time:", googleTimeMinutes);
    const googleDistanceMiles = convertToMiles(googleRoute.distanceMeters);
    //console.log("Google route distance:", googleDistanceMiles);
    let googleFuelGallons = 0;
    if (mode == "DRIVE") {
      googleFuelGallons = calculateFuelConsumptionEstimate(
        googleRoute.distanceMeters,
      );
      //console.log("Google route fuel consumption:", googleFuelGallons);
    }
    const numberOfGoogleDirections = googleRoute.legs[0].steps.length;
    //console.log("Number of Google route directions:", numberOfGoogleDirections);

    //here's route data
    const hereTimeMinutes = convertToMinutes(
      hereRoute.sections[0].summary.duration,
    );
    //console.log("HERE route time:", hereTimeMinutes);
    const hereDistanceMiles = convertToMiles(
      hereRoute.sections[0].summary.length,
    );
    //console.log("HERE route distance:", hereDistanceMiles);
    let hereFuelGallons = 0;
    if (mode == "DRIVE") {
      hereFuelGallons = calculateFuelConsumptionEstimate(
        hereRoute.sections[0].summary.length,
      );
      //console.log("HERE route fuel consumption:", hereFuelGallons);
    }
    const numberOfHereDirections = hereRoute.sections[0].actions.length;
    //console.log("Number of HERE route directions:", numberOfHereDirections);

    if (googleTimeMinutes < hereTimeMinutes) {
      setIsGoogleRouteFaster(true);
    } else if (hereTimeMinutes < googleTimeMinutes) {
      setIsGoogleRouteFaster(false);
    } else {
      setIsGoogleRouteFaster(false);
    }

    if (googleDistanceMiles < hereDistanceMiles) {
      setIsGoogleRouteShorter(true);
    } else if (hereDistanceMiles < googleDistanceMiles) {
      setIsGoogleRouteShorter(false);
    } else {
      setIsGoogleRouteShorter(false);
    }

    if (numberOfGoogleDirections < numberOfHereDirections) {
      setDoesGoogleRouteHaveLessDirections(true);
    } else if (numberOfHereDirections < numberOfGoogleDirections) {
      setDoesGoogleRouteHaveLessDirections(false);
    } else {
      setDoesGoogleRouteHaveLessDirections(false);
    }

    if (mode === "DRIVE") {
      if (googleFuelGallons < hereFuelGallons) {
        setIsGoogleRouteUseLessFuel(true);
      } else if (hereFuelGallons < googleFuelGallons) {
        setIsGoogleRouteUseLessFuel(false);
      } else {
        setIsGoogleRouteUseLessFuel(false);
      }
    }

    // Normalized values for Time in minutes
    const normalizedGoogleTime = normalize(googleTimeMinutes, hereTimeMinutes);
    const normalizedHereTime = normalize(hereTimeMinutes, googleTimeMinutes);

    // Normalized values for distance in miles
    const normalizedGoogleDistance = normalize(
      googleDistanceMiles,
      hereDistanceMiles,
    );
    const normalizedHereDistance = normalize(
      hereDistanceMiles,
      googleDistanceMiles,
    );

    //// Normalized values for Directions
    const normalizedGoogleDirections = normalize(
      numberOfGoogleDirections,
      numberOfHereDirections,
    );
    const normalizedHereDirections = normalize(
      numberOfHereDirections,
      numberOfGoogleDirections,
    );

    let normalizedGoogleFuel = 0;
    let normalizedHereFuel = 0;
    if (mode === "DRIVE") {
      normalizedGoogleFuel = normalize(googleFuelGallons, hereFuelGallons);
      normalizedHereFuel = normalize(hereFuelGallons, googleFuelGallons);
    }

    const googleScore = calculateScore(
      normalizedGoogleTime,
      normalizedGoogleDistance,
      normalizedGoogleDirections,
      normalizedGoogleFuel,
    );
    console.log("Google route score:", googleScore);

    const hereScore = calculateScore(
      normalizedHereTime,
      normalizedHereDistance,
      normalizedHereDirections,
      normalizedHereFuel,
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

  //calculates a route's score using the formula for the chosen mode and priority
  const calculateScore = (
    time: number,
    distance: number,
    directions: number,
    fuel: number,
  ): number => {
    let score = 0;
    // given formulas
    if (mode == "DRIVE") {
      if (priority == "time") {
        score = 0.85 * time + 0.05 * distance + 0.05 * directions + 0.05 * fuel;
      } else if (priority == "distance") {
        score = 0.05 * time + 0.85 * distance + 0.05 * directions + 0.05 * fuel;
      } else if (priority == "directions") {
        score = 0.05 * time + 0.05 * distance + 0.85 * directions + 0.05 * fuel;
      } else if (priority == "fuel") {
        score = 0.05 * time + 0.05 * distance + 0.05 * directions + 0.85 * fuel;
      }
    } else {
      if (priority == "distance") {
        score = 0.1 * time + 0.8 * distance + 0.1 * directions;
      } else if (priority == "directions") {
        score = 0.1 * time + 0.1 * distance + 0.8 * directions;
      } else {
        //time, also used if fuel was left selected after switching from driving
        score = 0.8 * time + 0.1 * distance + 0.1 * directions;
      }
    }
    return score;
  };

  const normalize = (value1: number, value2: number) => {
    const max = Math.max(value1, value2);
    if (max === 0) {
      return 0; // prevents division by zero
    }

    return value1 / max;
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
      setErrorMessage,
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
      setErrorMessage,
    );
  }, []);

  useEffect(() => {
    if (googleRoute && !retrievingGoogleRoute) {
      setConvertedGoogleTime(
        convertToMinutes(parseFloat(googleRoute.duration)),
      );
      setConvertedGoogleDistance(convertToMiles(googleRoute.distanceMeters));

      if (mode == "DRIVE") {
        setConvertedGoogleFuel(
          calculateFuelConsumptionEstimate(googleRoute.distanceMeters),
        );
      }

      setNumberOfGoogleDirections(googleRoute.legs[0].steps.length);
    }

    if (hereRoute && !retrievingHereRoute) {
      setConvertedHereTime(
        convertToMinutes(hereRoute.sections[0].summary.duration),
      );
      setConvertedHereDistance(
        convertToMiles(hereRoute.sections[0].summary.length),
      );

      if (mode == "DRIVE") {
        setConvertedHereFuel(
          calculateFuelConsumptionEstimate(
            hereRoute.sections[0].summary.length,
          ),
        );
      }
      setNumberOfHereDirections(hereRoute.sections[0].actions.length);
    }

    if (!retrievingGoogleRoute && !retrievingHereRoute) {
      evaluateRoutes(
        googleRoute,
        setGoogleRouteChosen,
        hereRoute,
        setHereRouteChosen,
      );
    }
  }, [googleRoute, hereRoute]);

  useEffect(() => {
    if (errorMessage) {
      Alert.alert("ERROR", errorMessage, [{ text: "OK" }]);
    }
  }, [errorMessage]);

  //show error message if any occur during API requests
  if (errorMessage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.centerText}>{errorMessage}</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        showsUserLocation={true}
      >
        <Marker
          coordinate={{
            latitude: destinationLat,
            longitude: destinationLong,
          }}
          title={destinationName}
          pinColor="red"
        />

        {googleCoordinates.length > 0 && !googleRouteChosen && (
          <Polyline
            coordinates={googleCoordinates}
            strokeColor="gray"
            strokeWidth={5}
          />
        )}

        {hereCoordinates.length > 0 && !hereRouteChosen && (
          <Polyline
            coordinates={hereCoordinates}
            strokeColor="gray"
            strokeWidth={5}
          />
        )}

        {googleCoordinates.length > 0 && googleRouteChosen && (
          <Polyline
            coordinates={googleCoordinates}
            strokeColor="green"
            strokeWidth={5}
          />
        )}

        {hereCoordinates.length > 0 && hereRouteChosen && (
          <Polyline
            coordinates={hereCoordinates}
            strokeColor="green"
            strokeWidth={5}
          />
        )}
      </MapView>

      <ScrollView style={styles.bottomPanelContainer}>
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
            <View style={styles.detailsContainer}>
              <Text variant="headlineMedium">Google Route Details</Text>

              <Text variant="bodyLarge">
                <Text style={styles.bold}>Duration: </Text>
                {convertedGoogleTime} min
                {googleRouteChosen &&
                  isGoogleRouteFaster &&
                  `, ${Math.abs(convertedGoogleTime - convertedHereTime)} min faster`}
              </Text>

              <Text variant="bodyLarge">
                <Text style={styles.bold}>Distance: </Text>
                {convertedGoogleDistance} mi
                {googleRouteChosen &&
                  isGoogleRouteShorter &&
                  `, ${Math.abs(convertedGoogleDistance - convertedHereDistance).toFixed(2)} mi shorter`}
              </Text>

              {mode === "DRIVE" &&
                googleRoute.travelAdvisory?.fuelConsumptionMicroliters && (
                  <Text variant="bodyLarge">
                    <Text style={styles.bold}>Estimated Fuel: </Text>
                    {convertedGoogleFuel} gal
                    {googleRouteChosen &&
                      doesGoogleRouteUseLessFuel &&
                      `, ${Math.abs(convertedGoogleFuel - convertedHereFuel).toFixed(2)} gal less`}
                  </Text>
                )}

              <Text variant="bodyLarge">
                <Text style={styles.bold}>Number of Directions: </Text>
                {numberOfGoogleDirections}
                {googleRouteChosen &&
                  doesGoogleRouteHaveLessDirections &&
                  `, ${Math.abs(numberOfGoogleDirections - numberOfHereDirections)} directions less`}
              </Text>

              <Text variant="headlineMedium">Directions</Text>

              {googleRoute.legs[0].steps.map((step, index) => (
                <View key={index} style={styles.direction}>
                  <View style={styles.directionContainer}>
                    <Text variant="bodyLarge" style={styles.bold}>
                      {index + 1}.
                    </Text>

                    <Text variant="bodyLarge">
                      {step.navigationInstruction.instructions}.
                      {/* Go for {convertToMiles(step.distanceMeters)} mi */}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {hereRoute && routeDetails === "here" && (
          <>
            <View style={styles.detailsContainer}>
              <Text variant="headlineMedium">HERE Route Details</Text>

              <Text variant="bodyLarge">
                <Text style={styles.bold}>Duration: </Text>
                {convertedHereTime} min
                {hereRouteChosen &&
                  !isGoogleRouteFaster &&
                  `, ${Math.abs(convertedGoogleTime - convertedHereTime)} min faster`}
              </Text>

              <Text variant="bodyLarge">
                <Text style={styles.bold}>Distance: </Text>
                {convertedHereDistance} mi
                {hereRouteChosen &&
                  !isGoogleRouteShorter &&
                  `, ${Math.abs(convertedGoogleDistance - convertedHereDistance).toFixed(2)} mi shorter`}
              </Text>

              {mode === "DRIVE" &&
                hereRoute.sections[0].summary.consumption && (
                  <Text variant="bodyLarge">
                    <Text style={styles.bold}>Estimated Fuel: </Text>
                    {convertedHereFuel} gal
                    {hereRouteChosen &&
                      !doesGoogleRouteUseLessFuel &&
                      `, ${Math.abs(convertedGoogleFuel - convertedHereFuel).toFixed(2)} gal less`}
                  </Text>
                )}

              <Text variant="bodyLarge">
                <Text style={styles.bold}>Number of Directions: </Text>
                {numberOfHereDirections}
                {hereRouteChosen &&
                  !doesGoogleRouteHaveLessDirections &&
                  `, ${Math.abs(numberOfGoogleDirections - numberOfHereDirections)} directions less`}
              </Text>

              <Text variant="headlineMedium">Directions</Text>

              {hereRoute.sections[0].actions.map((action, index) => (
                <View key={index} style={styles.direction}>
                  <View style={styles.directionContainer}>
                    <Text variant="bodyLarge" style={styles.bold}>
                      {index + 1}.
                    </Text>

                    <Text variant="bodyLarge">
                      {modifyHereInstruction(action.instruction)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
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
    flex: 1,
  },
  directionContainer: {
    flex: 1,
    flexDirection: "row",
    paddingRight: 10,
  },
  bold: {
    fontWeight: "bold",
  },
  direction: {
    marginBottom: 10,
  },
  changeRouteDetailsButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    borderTopWidth: 1,
    borderColor: "#504f4f5d",
    paddingTop: 5,
  },
  centerText: {
    textAlign: "center",
  },
  detailsContainer: {
    flex: 1,
    paddingLeft: 5,
    paddingRight: 5,
  },
});
