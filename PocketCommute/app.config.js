export default {
  expo: {
    name: "PocketCommute",
    slug: "PocketCommute",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "pocketcommute",
    userInterfaceStyle: "automatic",

    plugins: [
      "expo-router",
      "expo-splash-screen",
      [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
