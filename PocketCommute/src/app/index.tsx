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
import { useState } from "react";

export default function App() {
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState(false);
  const [mode, setMode] = useState("Drive");
  const [preference, setPreference] = useState("time");
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [avoidTolls, setAvoidTolls] = useState(false);

  const showSettings = () => setSettings(true);
  const hideSettings = () => setSettings(false);

  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <IconButton
            icon="dots-vertical"
            size={28}
            onPress={() => showSettings()}
          />

          <Searchbar
            placeholder="Search"
            onChangeText={setSearch}
            value={search}
            style={styles.searchBar}
          />

          <Button mode="contained" onPress={() => console.log("Hello, World")}>
            Confirm
          </Button>

          <Portal>
            <Modal
              visible={settings}
              onDismiss={hideSettings}
              contentContainerStyle={styles.settingsModal}
            >
              <View style={styles.settingsContainer}>
                <RadioButton.Group
                  onValueChange={(newValue) => setMode(newValue)}
                  value={mode}
                >
                  <View style={styles.optionsContainer}>
                    <View style={styles.option}>
                      <Text>Walk</Text>
                      <RadioButton value="Walk" />
                    </View>

                    <View style={styles.option}>
                      <Text>Bike</Text>
                      <RadioButton value="Bike" />
                    </View>

                    <View style={styles.option}>
                      <Text>Drive</Text>
                      <RadioButton value="Drive" />
                    </View>
                  </View>
                </RadioButton.Group>
              </View>

              <View style={styles.settingsContainer}>
                <RadioButton.Group
                  onValueChange={(newValue) => setPreference(newValue)}
                  value={preference}
                >
                  <View style={styles.optionsContainer}>
                    <View style={styles.option}>
                      <Text>Time</Text>
                      <RadioButton value="time" />
                    </View>

                    <View style={styles.option}>
                      <Text>Distance</Text>
                      <RadioButton value="distance" />
                    </View>

                    <View style={styles.option}>
                      <Text>Fuel Consumption</Text>
                      <RadioButton value="fuel" />
                    </View>

                    <View style={styles.option}>
                      <Text>Steps</Text>
                      <RadioButton value="steps" />
                    </View>
                  </View>
                </RadioButton.Group>
              </View>

              <View style={styles.settingsContainer}>
                <View style={styles.optionsContainer}>
                  <View style={styles.option}>
                    <Text>Avoid Highways</Text>

                    <Checkbox
                      status={avoidHighways ? "checked" : "unchecked"}
                      onPress={() => {
                        setAvoidHighways(!avoidHighways);
                      }}
                    />
                  </View>

                  <View style={styles.option}>
                    <Text>Avoid Tolls</Text>

                    <Checkbox
                      status={avoidTolls ? "checked" : "unchecked"}
                      onPress={() => {
                        setAvoidTolls(!avoidTolls);
                      }}
                    />
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
  settingsModal: {
    backgroundColor: "white",
    height: "70%",
  },
  settingsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
    borderWidth: 1,
  },
  optionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    width: "100%",
    borderWidth: 1,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
});
