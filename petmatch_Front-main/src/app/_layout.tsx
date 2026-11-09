import { AlfaSlabOne_400Regular } from "@expo-google-fonts/alfa-slab-one";
import { Lora_400Regular, Lora_600SemiBold } from "@expo-google-fonts/lora";
import { SpecialElite_400Regular } from "@expo-google-fonts/special-elite";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { ClientOnly } from "@/components/client-only";
import { AuthProvider } from "@/contexts/auth-context";
import { AppThemeProvider, useAppTheme } from "@/contexts/theme-context";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutInner() {
  const { tema } = useAppTheme();
  return (
    <ThemeProvider value={tema === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="alerta/[id]" options={{ title: "Alerta · PetMatch" }} />
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

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppThemeProvider>
      <AuthProvider>
        <ClientOnly>
          <RootLayoutInner />
        </ClientOnly>
      </AuthProvider>
    </AppThemeProvider>
  );
}
