import { useEffect, useRef, useState } from "react";
import * as ExpoLocation from "expo-location";
import MapView, { Marker } from "react-native-maps";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AddressAutocomplete from "@/components/AddressAutocomplete";
import {
  useAddressAutocomplete,
  type AddressAutocompleteState,
} from "@/hooks/useAddressAutocomplete";
import type { Location } from "@/types/location";
import { lyftUrls, openRideApp, uberUrls } from "@/utilities/rideshare";

type RideLocations = { pickup: Location; destination: Location };

export default function rideshare() {
  const [proximity, setProximity] =
    useState<Pick<Location, "latitude" | "longitude">>();
  const locationRequest = useRef<Promise<
    Pick<Location, "latitude" | "longitude"> | undefined
  > | null>(null);

  useEffect(() => {
    let active = true;
    // Share the one-shot request across effect replays; never request per edit.
    if (!locationRequest.current) {
      locationRequest.current = (async () => {
        try {
          let permission = await ExpoLocation.getForegroundPermissionsAsync();
          if (
            !permission.granted &&
            permission.status === "undetermined" &&
            permission.canAskAgain
          ) {
            permission = await ExpoLocation.requestForegroundPermissionsAsync();
          }
          if (!permission.granted) return;
          const { coords } = await ExpoLocation.getCurrentPositionAsync({
            accuracy: ExpoLocation.Accuracy.Balanced,
          });
          const { latitude, longitude } = coords;
          if (
            Number.isFinite(latitude) &&
            Math.abs(latitude) <= 90 &&
            Number.isFinite(longitude) &&
            Math.abs(longitude) <= 180
          ) {
            return { latitude, longitude };
          }
        } catch {
          // Proximity only improves ranking; manual search remains available.
        }
      })();
    }
    void locationRequest.current.then((coordinates) => {
      if (active && coordinates) setProximity(coordinates);
    });
    return () => {
      active = false;
    };
  }, []);

  const pickup = useAddressAutocomplete({ proximity });
  const destination = useAddressAutocomplete({ proximity });
  const [confirmed, setConfirmed] = useState<RideLocations | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const confirmedRef = useRef<RideLocations | null>(null);
  const handoffInProgress = useRef(false);
  const [openingProvider, setOpeningProvider] = useState(false);

  const [pickupMarker, setPickupMarker] = useState<Location | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<Location | null>(
    null,
  );

  let pickupMapLocation: Location | null = null;
  let destinationMapLocation: Location | null = null;

  let mapCenterCoords: Location | null = null;

  const invalidateConfirmation = () => {
    confirmedRef.current = null;
    setConfirmed(null);
    setShowDetails(false);
  };

  if (pickupMarker) {
    pickupMapLocation = pickupMarker;
  } else if (pickup.selectedLocation) {
    pickupMapLocation = pickup.selectedLocation;
  } else if (proximity) {
    pickupMapLocation = {
      formattedAddress: "Current location",
      latitude: proximity.latitude,
      longitude: proximity.longitude,
    };
  }

  if (destinationMarker) {
    destinationMapLocation = destinationMarker;
  } else if (destination.selectedLocation) {
    destinationMapLocation = destination.selectedLocation;
  } else if (proximity) {
    destinationMapLocation = {
      formattedAddress: "Current location",
      latitude: proximity.latitude,
      longitude: proximity.longitude,
    };
  }

  if (pickupMapLocation) {
    mapCenterCoords = pickupMapLocation;
  } else if (destinationMapLocation) {
    mapCenterCoords = destinationMapLocation;
  }

  // Delegate searching and selection to the hook; edits also invalidate the pair
  // synchronously so a queued provider press cannot use an old confirmation.
  const fieldState = (
    field: AddressAutocompleteState,
    type: "pickup" | "destination",
  ): AddressAutocompleteState => ({
    ...field,
    onChangeText: (text) => {
      invalidateConfirmation();
      field.onChangeText(text);
    },
    selectSuggestion: (location) => {
      invalidateConfirmation();
      if (type == "pickup") {
        setPickupMarker(null);
      } else {
        setDestinationMarker(null);
      }
      field.selectSuggestion(location);
    },
  });

  const handleConfirm = () => {
    if (handoffInProgress.current || confirmedRef.current) return;

    let pickupLocation: Location | null = null;
    let destinationLocation: Location | null = null;

    if (pickupMarker) {
      pickupLocation = pickupMarker;
    } else if (pickup.selectedLocation) {
      pickupLocation = pickup.selectedLocation;
    }

    if (destinationMarker) {
      destinationLocation = destinationMarker;
    } else if (destination.selectedLocation) {
      destinationLocation = destination.selectedLocation;
    }

    if (!pickupLocation || !destinationLocation) {
      Alert.alert(
        "Select both locations",
        "Choose an address or drag both markers to select your pickup and destination.",
      );
      return;
    }
    const pair = {
      pickup: pickupLocation,
      destination: destinationLocation,
    };
    confirmedRef.current = pair;
    setConfirmed(pair);
    Keyboard.dismiss();
  };

  const handleOpenRide = async (provider: "Uber" | "Lyft") => {
    const pair = confirmedRef.current;
    if (!pair || handoffInProgress.current) return;
    handoffInProgress.current = true;
    setOpeningProvider(true);
    try {
      const urls =
        provider === "Uber"
          ? uberUrls(pair.pickup, pair.destination)
          : lyftUrls(pair.pickup, pair.destination);
      await openRideApp(urls);
    } catch {
      Alert.alert(
        `Could not open ${provider}`,
        "Could not open the app or its website. Please try again.",
      );
    } finally {
      handoffInProgress.current = false;
      setOpeningProvider(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustsScrollIndicatorInsets
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Rideshare</Text>
          <Text style={styles.subtitle}>
            Select your pickup and drop-off locations.
          </Text>
        </View>
        <AddressAutocomplete
          label="Pickup (blue)"
          placeholder="Enter a pickup address"
          autocomplete={fieldState(pickup, "pickup")}
        />
        <AddressAutocomplete
          label="Drop-off (red)"
          placeholder="Enter a destination address"
          autocomplete={fieldState(destination, "destination")}
        />

        {mapCenterCoords && (
          <View>
            <Text style={styles.mapTitle}>Select or adjust your locations</Text>

            <MapView
              style={styles.map}
              initialRegion={{
                latitude: mapCenterCoords.latitude,
                longitude: mapCenterCoords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              showsUserLocation={true}
              toolbarEnabled={false}
            >
              {pickupMapLocation && (
                <Marker
                  coordinate={{
                    latitude: pickupMapLocation.latitude,
                    longitude: pickupMapLocation.longitude,
                  }}
                  title="Pickup"
                  pinColor="blue"
                  draggable
                  onDragEnd={(event) => {
                    invalidateConfirmation();

                    setPickupMarker({
                      formattedAddress: "Pickup location",
                      latitude: event.nativeEvent.coordinate.latitude,
                      longitude: event.nativeEvent.coordinate.longitude,
                    });

                    pickup.onChangeText("");
                  }}
                />
              )}

              {destinationMapLocation && (
                <Marker
                  coordinate={{
                    latitude: destinationMapLocation.latitude,
                    longitude: destinationMapLocation.longitude,
                  }}
                  title="Drop-off"
                  pinColor="red"
                  draggable
                  onDragEnd={(event) => {
                    invalidateConfirmation();

                    setDestinationMarker({
                      formattedAddress: "Dropoff location",
                      latitude: event.nativeEvent.coordinate.latitude,
                      longitude: event.nativeEvent.coordinate.longitude,
                    });

                    destination.onChangeText("");
                  }}
                />
              )}
            </MapView>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            disabled:
              (!pickup.selectedLocation && !pickupMarker) ||
              (!destination.selectedLocation && !destinationMarker) ||
              !!confirmed ||
              openingProvider,
          }}
          disabled={
            (!pickup.selectedLocation && !pickupMarker) ||
            (!destination.selectedLocation && !destinationMarker) ||
            !!confirmed ||
            openingProvider
          }
          onPress={handleConfirm}
          style={({ pressed }) => [
            styles.action,
            styles.confirmAction,
            ((!pickup.selectedLocation && !pickupMarker) ||
              (!destination.selectedLocation && !destinationMarker) ||
              !!confirmed ||
              openingProvider) &&
              styles.disabledAction,
            pressed && styles.pressedAction,
          ]}
        >
          <Text
            style={[
              styles.actionLabel,
              ((!pickup.selectedLocation && !pickupMarker) ||
                (!destination.selectedLocation && !destinationMarker) ||
                !!confirmed ||
                openingProvider) &&
                styles.disabledLabel,
            ]}
          >
            {confirmed ? "Locations confirmed" : "Confirm locations"}
          </Text>
        </Pressable>
        {confirmed && (
          <>
            <View style={styles.confirmed}>
              <Text style={styles.confirmedTitle}>
                Your ride locations are confirmed
              </Text>
              <Text style={styles.subtitle}>
                Check both pins in your ride app before requesting a ride.
              </Text>
            </View>

            {showDetails && (
              <View style={styles.details}>
                <Text selectable style={styles.selected}>
                  Pickup latitude: {confirmed.pickup.latitude}
                  {"\n"}
                  Pickup longitude: {confirmed.pickup.longitude}
                </Text>
                <Text selectable style={styles.selected}>
                  Destination latitude: {confirmed.destination.latitude}
                  {"\n"}
                  Destination longitude: {confirmed.destination.longitude}
                </Text>
              </View>
            )}
            <View style={styles.providers}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open Uber with confirmed locations"
                accessibilityState={{ disabled: openingProvider }}
                disabled={openingProvider}
                onPress={() => handleOpenRide("Uber")}
                style={({ pressed }) => [
                  styles.action,
                  styles.uberAction,
                  openingProvider && styles.disabledAction,
                  pressed && styles.pressedAction,
                ]}
              >
                <Text
                  style={[
                    styles.actionLabel,
                    openingProvider && styles.disabledLabel,
                  ]}
                >
                  Open Uber
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open Lyft with confirmed locations"
                accessibilityState={{ disabled: openingProvider }}
                disabled={openingProvider}
                onPress={() => handleOpenRide("Lyft")}
                style={({ pressed }) => [
                  styles.action,
                  styles.lyftAction,
                  openingProvider && styles.disabledAction,
                  pressed && styles.pressedAction,
                ]}
              >
                <Text
                  style={[
                    styles.actionLabel,
                    openingProvider && styles.disabledLabel,
                  ]}
                >
                  Open Lyft
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: "#FAF8FC",
    paddingTop: 15,
  },
  scroll: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 10,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  header: {
    gap: 4,
    marginBottom: 2,
  },
  title: {
    color: "#35244F",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#60646C",
    fontSize: 15,
    lineHeight: 22,
  },

  mapTitle: {
    color: "#222",
    fontSize: 17,
    fontWeight: "600",
  },
  map: {
    width: "100%",
    height: 280,
    borderRadius: 12,
  },
  action: {
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  confirmAction: {
    backgroundColor: "#6750A4",
  },
  uberAction: {
    backgroundColor: "#161616",
  },
  lyftAction: {
    backgroundColor: "#9b147d",
  },
  disabledAction: {
    backgroundColor: "#E0E1E6",
  },
  disabledLabel: {
    color: "#60646C",
  },
  pressedAction: {
    opacity: 0.75,
  },
  providers: {
    gap: 10,
  },
  confirmedTitle: {
    color: "#222",
    fontSize: 17,
    fontWeight: "600",
  },
  details: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  selected: {
    color: "#444",
    marginVertical: 4,
  },
  confirmed: {
    padding: 12,
    gap: 4,
    backgroundColor: "#F0EAF8",
    borderRadius: 12,
  },
});
