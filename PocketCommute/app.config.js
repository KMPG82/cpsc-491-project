import 'dotenv/config';

export default {
  expo: {
    name: "PocketCommute",
    slug: "PocketCommute",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "pocketcommute",
    userInterfaceStyle: "automatic",
    
    "android": {
      "package": "com.anonymous.PocketCommute",
      "gradleArguments": ["--no-build-cache"]
    },
    
    plugins: [
      "expo-router",
      "expo-splash-screen",
      [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location."
        }
      ]
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
