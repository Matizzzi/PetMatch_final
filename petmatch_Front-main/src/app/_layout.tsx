import { AlfaSlabOne_400Regular } from "@expo-google-fonts/alfa-slab-one";
import { Lora_400Regular, Lora_600SemiBold } from "@expo-google-fonts/lora";
import { SpecialElite_400Regular } from "@expo-google-fonts/special-elite";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

import { AuthProvider } from "@/contexts/auth-context";
import { AppThemeProvider, useAppTheme } from "@/contexts/theme-context";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutInner() {
  const { tema } = useAppTheme();
  return (
    <ThemeProvider value={tema === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    AlfaSlabOne_400Regular,
    Lora_400Regular,
    Lora_600SemiBold,
    SpecialElite_400Regular,
  });

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
      setReady(true);
    }
  }, [fontsLoaded, fontError]);

  // Timeout de seguridad de 1 segundo: si las fuentes tardan o fallan, muestra la app igual
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
      setReady(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!ready && !fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppThemeProvider>
      <AuthProvider>
        <RootLayoutInner />
      </AuthProvider>
    </AppThemeProvider>
  );
}
