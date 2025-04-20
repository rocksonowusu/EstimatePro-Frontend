import { SplashScreen, Stack } from "expo-router";
import { useFonts } from "expo-font";
import { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}
