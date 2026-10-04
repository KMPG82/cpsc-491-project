import MapView from "react-native-maps";
import { StyleSheet, View } from "react-native";
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
} from "react-native-paper";
import { useState, useEffect } from "react";

import * as Location from "expo-location";

export default function App() {
  const [search, setSearch] = useState("");
  const [preferences, setPreferences] = useState(false);
  const [mode, setMode] = useState("drive");
  const [priority, setPriority] = useState("time");
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const showPreferences = () => setPreferences(true);
  const hidePreferences = () => setPreferences(false);

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      setLocation(location);
    }

    getCurrentLocation();
  }, []);

  let text = "Waiting...";
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }

  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <IconButton
            icon="dots-vertical"
            size={28}
            onPress={() => showPreferences()}
          />

          <Searchbar
            placeholder="Search"
            onChangeText={setSearch}
            value={search}
            style={styles.searchBar}
          />

          <Button
            mode="contained"
            onPress={() =>
              console.log(
                "Preferences:",
                priority,
                mode,
                avoidHighways,
                avoidTolls,
                search,
                location?.coords.latitude,
                location?.coords.longitude,
              )
            }
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
                      console.log(newValue);
                    }}
                    value={mode}
                  >
                    <View style={styles.optionsContainer}>
                      <View style={styles.option}>
                        <Text style={styles.optionsText}>Walk</Text>
                        <RadioButton value="walk" />
                      </View>

                      <View style={styles.option}>
                        <Text style={styles.optionsText}>Bike</Text>
                        <RadioButton value="bike" />
                      </View>

                      <View style={styles.option}>
                        <Text style={styles.optionsText}>Drive</Text>
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
                        <Text style={styles.optionsText}>Time</Text>
                        <RadioButton value="time" />
                      </View>

                      <View style={styles.option}>
                        <Text style={styles.optionsText}>Distance</Text>
                        <RadioButton value="distance" />
                      </View>

                      <View style={styles.option}>
                        <Text style={styles.optionsText}>Steps</Text>
                        <RadioButton value="steps" />
                      </View>

                      <View style={styles.option}>
                        <Text style={styles.optionsText}>Fuel</Text>
                        <RadioButton value="fuel" />
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
                      <Text style={styles.optionsText}>Avoid Highways</Text>
                      <Checkbox
                        status={avoidHighways ? "checked" : "unchecked"}
                        onPress={() => {
                          setAvoidHighways(!avoidHighways);
                          console.log(!avoidHighways);
                        }}
                      />
                    </View>

                    <View style={styles.option}>
                      <Text style={styles.optionsText}>Avoid Tolls</Text>
                      <Checkbox
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

        <MapView style={styles.map} />
      </SafeAreaView>
    </PaperProvider>
  );
}

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
    //borderWidth: 1,
  },
  optionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    width: "100%",
    paddingHorizontal: 10,
    //borderWidth: 1,
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
  optionsText: {
    fontSize: 16,
  },
  preferencesTitle: {
    fontWeight: "bold",
    paddingTop: 5,
  },
});
