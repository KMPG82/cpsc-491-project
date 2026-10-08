import { Stack } from "expo-router";

//provides navigation to other screens that are not part of the tab navigation
export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen
        name="navigation"
        options={{
          title: "",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
