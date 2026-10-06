import MapView, { Marker } from "react-native-maps";
import { StyleSheet, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Searchbar,
  Text,
  IconButton,
  Portal,
  Modal,
  PaperProvider,
  RadioButton,
  Checkbox,
  ActivityIndicator,
} from "react-native-paper";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";

import * as Location from "expo-location";

import { getCurrentLocation } from "../utilities/getCurrentLocation";
import { getSuggestions } from "../utilities/getSuggestions";

//landing screen: contains search bar, map, and preferences selection
export default function App() {
  const [search, setSearch] = useState("");
  const [preferences, setPreferences] = useState(false);
  const [mode, setMode] = useState("drive");
  const [priority, setPriority] = useState("time");
  const [isDriving, setIsDriving] = useState(true);
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const showPreferences = () => setPreferences(true);
  const hidePreferences = () => setPreferences(false);

  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [loadingLocationAndNearbyPlaces, setLoadingLocationAndNearbyPlaces] =
    useState<boolean>(false);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [destination, setDestination] = useState<any | null>(null);

  const router = useRouter();

  useEffect(() => {
    getCurrentLocation(
      setCurrentLocation,
      setErrorMsg,
      setNearbyPlaces,
      setLoadingLocationAndNearbyPlaces,
    );
  }, []);

  let text = "Waiting...";
  if (errorMsg) {
    text = errorMsg;
  } else if (currentLocation) {
    text = JSON.stringify(currentLocation);
  }

  //show loading indicator while fetching location and nearby places
  if (!currentLocation || loadingLocationAndNearbyPlaces) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  //show map with markers for nearby places, search bar, preferences button, and confirm button
  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <IconButton
            icon="dots-vertical"
            size={28}
            onPress={() => showPreferences()}
          />

          <View style={styles.searchBar}>
            <Searchbar
              placeholder="Search"
              onChangeText={(text) => {
                setSearch(text);

                if (timer.current) {
                  clearTimeout(timer.current);
                }

                timer.current = setTimeout(() => {
                  getSuggestions(
                    setSuggestions,
                    text,
                    currentLocation?.coords.longitude,
                    currentLocation?.coords.latitude,
                  );
                }, 500);
              }}
              value={search}
            />

            {suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((suggestion, index) => (
                  <Pressable
                    key={index}
                    style={styles.suggestion}
                    onPress={() => {
                      setDestination(suggestion);

                      setSearch(suggestion.properties?.name || "");

                      setSuggestions([]);

                      console.log("Selected destination:", suggestion);
                    }}
                  >
                    <Text variant="bodyLarge">
                      {suggestion.properties?.name}
                    </Text>

                    <Text variant="bodySmall">
                      {suggestion.properties?.address_line2}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <Button
            mode="contained"
            disabled={!destination}
            onPress={() => {
              console.log(
                "Preferences:",
                priority,
                mode,
                avoidHighways,
                avoidTolls,
                search,
                currentLocation?.coords.latitude,
                currentLocation?.coords.longitude,
                destination,
              );

              router.push({
                pathname: "/navigation",
                params: {
                  priority,
                  mode,
                  avoidHighways: String(avoidHighways),
                  avoidTolls: String(avoidTolls),
                  search,
                  latitude: String(currentLocation?.coords.latitude),
                  longitude: String(currentLocation?.coords.longitude),
                  destination,
                },
              });
            }}
          >
            Confirm
          </Button>

          <Portal>
            <Modal
              visible={preferences}
              onDismiss={hidePreferences}
              contentContainerStyle={styles.preferencesModal}
            >
              <View style={styles.preferencesParentContainer}>
                <Text variant="titleLarge" style={styles.preferencesTitle}>
                  Mode of Transportation
                </Text>

                <View style={styles.preferencesContainer}>
                  <RadioButton.Group
                    onValueChange={(newValue) => {
                      setMode(newValue);
                      setIsDriving(newValue === "drive");
                      console.log(newValue);
                    }}
                    value={mode}
                  >
                    <View style={styles.optionsContainer}>
                      <View style={styles.option}>
                        <Text variant="bodyLarge">Walk</Text>
                        <RadioButton value="walk" />
                      </View>

                      <View style={styles.option}>
                        <Text variant="bodyLarge">Bike</Text>
                        <RadioButton value="bike" />
                      </View>

                      <View style={styles.option}>
                        <Text variant="bodyLarge">Drive</Text>
                        <RadioButton value="drive" />
                      </View>
                    </View>
                  </RadioButton.Group>
                </View>
              </View>

              <View style={styles.preferencesParentContainer}>
                <Text variant="titleLarge" style={styles.preferencesTitle}>
                  Priority
                </Text>
                <View style={styles.preferencesContainer}>
                  <RadioButton.Group
                    onValueChange={(newValue) => {
                      setPriority(newValue);
                      console.log(newValue);
                    }}
                    value={priority}
                  >
                    <View style={styles.optionsContainer}>
                      <View style={styles.option}>
                        <Text variant="bodyLarge">Time</Text>
                        <RadioButton value="time" />
                      </View>

                      <View style={styles.option}>
                        <Text variant="bodyLarge">Distance</Text>
                        <RadioButton value="distance" />
                      </View>

                      <View style={styles.option}>
                        <Text variant="bodyLarge">Steps</Text>
                        <RadioButton value="steps" />
                      </View>

                      <View style={styles.option}>
                        <Text variant="bodyLarge">Fuel</Text>
                        <RadioButton value="fuel" disabled={!isDriving} />
                      </View>
                    </View>
                  </RadioButton.Group>
                </View>
              </View>

              <View style={styles.preferencesParentContainer}>
                <Text variant="titleLarge" style={styles.preferencesTitle}>
                  Highway/Toll Avoidance
                </Text>

                <View style={styles.preferencesContainer}>
                  <View style={styles.optionsContainer}>
                    <View style={styles.option}>
                      <Text variant="bodyLarge">Avoid Highways</Text>

                      <Checkbox
                        disabled={!isDriving}
                        status={avoidHighways ? "checked" : "unchecked"}
                        onPress={() => {
                          setAvoidHighways(!avoidHighways);
                          console.log(!avoidHighways);
                        }}
                      />
                    </View>

                    <View style={styles.option}>
                      <Text variant="bodyLarge">Avoid Tolls</Text>

                      <Checkbox
                        disabled={!isDriving}
                        status={avoidTolls ? "checked" : "unchecked"}
                        onPress={() => {
                          setAvoidTolls(!avoidTolls);
                          console.log(!avoidTolls);
                        }}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </Modal>
          </Portal>
        </View>

        <MapView
          style={styles.map}
          initialRegion={{
            latitude: currentLocation?.coords.latitude,
            longitude: currentLocation?.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={true}
        >
          {nearbyPlaces &&
            nearbyPlaces.map((place, index) => {
              const latitude = place?.properties?.lat;
              const longitude = place?.properties?.lon;
              const name = place?.properties?.name;
              const address = place?.properties?.address_line2;

              if (
                !latitude ||
                !longitude ||
                !name?.trim() ||
                !address?.trim()
              ) {
                return null;
              }

              return (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: latitude,
                    longitude: longitude,
                  }}
                  title={name}
                  description={address}
                  onPress={() => {
                    setDestination(place);
                    setSearch(name);
                    console.log("Selected destination:", place);
                  }}
                />
              );
            })}
        </MapView>
      </SafeAreaView>
    </PaperProvider>
  );
}

//styling
const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingBottom: 5,
  },
  searchBar: {
    flex: 1,
    marginRight: 5,
  },
  preferencesModal: {
    backgroundColor: "white",
    height: "70%",
  },
  preferencesContainer: {
    flexDirection: "row",
    flex: 1,
  },
  optionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    width: "100%",
    paddingHorizontal: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
  },
  preferencesParentContainer: {
    flex: 1,
    flexDirection: "column",
    borderWidth: 1,
    alignItems: "center",
  },
  preferencesTitle: {
    fontWeight: "bold",
    paddingTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionsContainer: {
    position: "absolute",
    top: 60,
    backgroundColor: "white",
    elevation: 10,
    zIndex: 1,
  },
  suggestion: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#999999",
  },
});
