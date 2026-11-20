import MapView, { Marker } from "react-native-maps";
import { StyleSheet, View, Pressable, Alert } from "react-native";
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
  Menu,
} from "react-native-paper";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";

import * as Location from "expo-location";

import { getCurrentLocation } from "../../utilities/getCurrentLocation";
import { getSuggestions } from "../../utilities/getSuggestions";

type Coordinate = {
  latitude: number;
  longitude: number;
};

//landing screen: contains search bar, map, and preferences selection
export default function App() {
  const [search, setSearch] = useState("");
  const [preferences, setPreferences] = useState(false);
  const [mode, setMode] = useState("DRIVE");
  //const [priority, setPriority] = useState("time");
  const [isDriving, setIsDriving] = useState(true);
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const showPreferences = () => setPreferences(true);
  const hidePreferences = () => setPreferences(false);

  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);

  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [loadingLocationAndNearbyPlaces, setLoadingLocationAndNearbyPlaces] =
    useState<boolean>(false);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [destination, setDestination] = useState<Coordinate | null>(null);

  const [errorMessage, setErrorMessage] = useState<string>("");

  const router = useRouter();

  const [openRanksDropdown, setOpenRanksDropdown] = useState<string | null>(
    null,
  );

  const [timePriorityRank, setTimePriorityRank] = useState(1);
  const [distancePriorityRank, setDistancePriorityRank] = useState(2);
  const [fuelPriorityRank, setFuelPriorityRank] = useState(3);
  const [directionsPriorityRank, setDirectionsPriorityRank] = useState(4);

  //updates the factors priority rankings by swapping the ranks of the involved the factors
  function updatePriorityRank(
    factor: "time" | "distance" | "directions" | "fuel",
    newRank: number,
  ) {
    let currentRank = 0;
    let otherFactor: "time" | "distance" | "directions" | "fuel" | undefined;

    if (factor == "time") {
      currentRank = timePriorityRank;
    } else if (factor == "distance") {
      currentRank = distancePriorityRank;
    } else if (factor == "directions") {
      currentRank = directionsPriorityRank;
    } else {
      currentRank = fuelPriorityRank;
    }

    if (timePriorityRank == newRank) {
      otherFactor = "time";
    } else if (distancePriorityRank == newRank) {
      otherFactor = "distance";
    } else if (directionsPriorityRank == newRank) {
      otherFactor = "directions";
    } else if (fuelPriorityRank == newRank) {
      otherFactor = "fuel";
    }

    if (otherFactor != factor) {
      if (factor == "time") {
        setTimePriorityRank(newRank);
      } else if (factor == "distance") {
        setDistancePriorityRank(newRank);
      } else if (factor == "directions") {
        setDirectionsPriorityRank(newRank);
      } else {
        setFuelPriorityRank(newRank);
      }

      if (otherFactor == "time") {
        setTimePriorityRank(currentRank);
      } else if (otherFactor == "distance") {
        setDistancePriorityRank(currentRank);
      } else if (otherFactor == "directions") {
        setDirectionsPriorityRank(currentRank);
      } else {
        setFuelPriorityRank(currentRank);
      }
    }
  }

  useEffect(() => {
    getCurrentLocation(
      setCurrentLocation,
      setNearbyPlaces,
      setLoadingLocationAndNearbyPlaces,
      setErrorMessage,
    );
  }, []);

  useEffect(() => {
    if (errorMessage) {
      Alert.alert("ERROR", errorMessage, [{ text: "OK" }]);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (!isDriving && fuelPriorityRank !== 4) {
      if (timePriorityRank == 4) {
        setTimePriorityRank(fuelPriorityRank);
      } else if (distancePriorityRank == 4) {
        setDistancePriorityRank(fuelPriorityRank);
      } else if (directionsPriorityRank == 4) {
        setDirectionsPriorityRank(fuelPriorityRank);
      }

      setFuelPriorityRank(4);
    }
  }, [isDriving]);

  //show error message if any occur during API requests
  if (errorMessage) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.centerText}>{errorMessage}</Text>
        </View>
      </SafeAreaView>
    );
  }

  //show loading indicator while fetching location and nearby places
  if (!currentLocation || loadingLocationAndNearbyPlaces) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.centerText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  //show map with markers for nearby places, search bar, preferences button, and confirm button
  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
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
                    currentLocation.coords.longitude,
                    currentLocation.coords.latitude,
                    setErrorMessage,
                  );
                }, 500);
              }}
              value={search}
            />

            {suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions
                  .filter((suggestion) => suggestion.properties.name?.trim())
                  .map((suggestion, index) => (
                    <Pressable
                      key={index}
                      style={[
                        styles.lastSuggestion,
                        index !== suggestions.length - 1 && styles.suggestion,
                      ]}
                      onPress={() => {
                        setDestination({
                          latitude: suggestion.geometry.coordinates[1],
                          longitude: suggestion.geometry.coordinates[0],
                        });

                        setSearch(suggestion.properties.name || "");

                        setSuggestions([]);
                      }}
                    >
                      <Text variant="bodyLarge">
                        {suggestion.properties.name}
                      </Text>

                      <Text variant="bodySmall">
                        {suggestion.properties.address_line2}
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
              if (!destination) {
                console.log("No destination has been selected.");
                Alert.alert(
                  "ERROR",
                  "Please select a desination before confirming.",
                  [{ text: "OK" }],
                );

                return;
              }

              router.push({
                pathname: "/navigation",
                params: {
                  mode,
                  avoidHighways: String(avoidHighways),
                  avoidTolls: String(avoidTolls),
                  currentLocationLatitude: String(
                    currentLocation.coords.latitude,
                  ),
                  currentLocationLongitude: String(
                    currentLocation.coords.longitude,
                  ),
                  destinationLatitude: String(
                    destination.latitude,
                    //destination.geometry.coordinates[1],
                  ),
                  destinationLongitude: String(
                    destination.longitude,
                    //destination.geometry.coordinates[0],
                  ),
                  //destinationName: destination.properties.name,
                  timePriorityRank: String(timePriorityRank),
                  distancePriorityRank: String(distancePriorityRank),
                  directionsPriorityRank: String(directionsPriorityRank),
                  fuelPriorityRank: String(fuelPriorityRank),
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
                      setIsDriving(newValue == "DRIVE");
                    }}
                    value={mode}
                  >
                    <View style={styles.optionsContainer}>
                      <View style={styles.option}>
                        <Text variant="bodyLarge">Walk</Text>
                        <RadioButton value="WALK" />
                      </View>

                      <View style={styles.option}>
                        <Text variant="bodyLarge">Bike</Text>
                        <RadioButton value="BICYCLE" />
                      </View>

                      <View style={styles.option}>
                        <Text variant="bodyLarge">Drive</Text>
                        <RadioButton value="DRIVE" />
                      </View>
                    </View>
                  </RadioButton.Group>
                </View>
              </View>

              <View style={styles.preferencesParentContainer}>
                <Text variant="titleLarge" style={styles.preferencesTitle}>
                  Priority Ranking
                </Text>
                <View style={styles.preferencesContainer}>
                  <View style={styles.optionsContainer}>
                    <View style={styles.option}>
                      <Text variant="bodyLarge" style={styles.priorityText}>
                        Time
                      </Text>
                      <Menu
                        visible={openRanksDropdown === "time"}
                        onDismiss={() => setOpenRanksDropdown(null)}
                        anchor={
                          <Button
                            mode="outlined"
                            compact
                            onPress={() => setOpenRanksDropdown("time")}
                          >
                            {timePriorityRank.toString()}
                          </Button>
                        }
                      >
                        {(isDriving ? [1, 2, 3, 4] : [1, 2, 3]).map((rank) => (
                          <Menu.Item
                            key={rank}
                            onPress={() => {
                              updatePriorityRank("time", rank);
                              setOpenRanksDropdown(null);
                            }}
                            title={rank.toString()}
                          />
                        ))}
                      </Menu>
                    </View>

                    <View style={styles.option}>
                      <Text variant="bodyLarge" style={styles.priorityText}>
                        Distance
                      </Text>
                      <Menu
                        visible={openRanksDropdown === "distance"}
                        onDismiss={() => setOpenRanksDropdown(null)}
                        anchor={
                          <Button
                            mode="outlined"
                            compact
                            onPress={() => setOpenRanksDropdown("distance")}
                          >
                            {distancePriorityRank.toString()}
                          </Button>
                        }
                      >
                        {(isDriving ? [1, 2, 3, 4] : [1, 2, 3]).map((rank) => (
                          <Menu.Item
                            key={rank}
                            onPress={() => {
                              updatePriorityRank("distance", rank);
                              setOpenRanksDropdown(null);
                            }}
                            title={rank.toString()}
                          />
                        ))}
                      </Menu>
                    </View>

                    {isDriving && (
                      <View style={styles.option}>
                        <Text variant="bodyLarge" style={styles.priorityText}>
                          Fuel
                        </Text>
                        <Menu
                          visible={openRanksDropdown === "fuel"}
                          onDismiss={() => setOpenRanksDropdown(null)}
                          anchor={
                            <Button
                              mode="outlined"
                              compact
                              disabled={!isDriving}
                              onPress={() => setOpenRanksDropdown("fuel")}
                            >
                              {fuelPriorityRank.toString()}
                            </Button>
                          }
                        >
                          {[1, 2, 3, 4].map((rank) => (
                            <Menu.Item
                              key={rank}
                              onPress={() => {
                                updatePriorityRank("fuel", rank);
                                setOpenRanksDropdown(null);
                              }}
                              title={rank.toString()}
                            />
                          ))}
                        </Menu>
                      </View>
                    )}

                    <View style={styles.option}>
                      <Text variant="bodyLarge" style={styles.priorityText}>
                        Directions
                      </Text>
                      <Menu
                        visible={openRanksDropdown === "directions"}
                        onDismiss={() => setOpenRanksDropdown(null)}
                        anchor={
                          <Button
                            mode="outlined"
                            compact
                            onPress={() => setOpenRanksDropdown("directions")}
                          >
                            {directionsPriorityRank.toString()}
                          </Button>
                        }
                      >
                        {(isDriving ? [1, 2, 3, 4] : [1, 2, 3]).map((rank) => (
                          <Menu.Item
                            key={rank}
                            onPress={() => {
                              updatePriorityRank("directions", rank);
                              setOpenRanksDropdown(null);
                            }}
                            title={rank.toString()}
                          />
                        ))}
                      </Menu>
                    </View>
                  </View>
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
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={true}
          toolbarEnabled={false}
        >
          {nearbyPlaces &&
            nearbyPlaces.map((place, index) => {
              const latitude = place.properties.lat;
              const longitude = place.properties.lon;
              const name = place.properties.name;
              const address = place.properties.address_line2;

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
                    setDestination({
                      latitude: place.properties.lat,
                      longitude: place.properties.lon,
                    });
                    setSearch(name);
                  }}
                />
              );
            })}

          <Marker
            coordinate={currentLocation.coords}
            draggable
            pinColor="blue"
            onDragEnd={(event) => {
              setDestination({
                latitude: event.nativeEvent.coordinate.latitude,
                longitude: event.nativeEvent.coordinate.longitude,
              });
              setSearch("");
            }}
          />
        </MapView>
      </SafeAreaView>
    </PaperProvider>
  );
}

//styling
const styles = StyleSheet.create({
  map: {
    flex: 1,
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
    borderWidth: 1,
    borderRadius: 30,
    borderColor: "#504f4f5d",
  },
  preferencesModal: {
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
    borderColor: "#504f4f5d",
    alignItems: "center",
    backgroundColor: "white",
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
    elevation: 10,
    zIndex: 1,
    backgroundColor: "white",
    borderRadius: 15,
  },
  suggestion: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#504f4f5d",
  },
  lastSuggestion: {
    padding: 12,
  },
  centerText: {
    textAlign: "center",
  },
  priorityText: {
    paddingRight: 3,
  },
});
