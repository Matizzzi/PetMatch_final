import { Tabs } from "expo-router";

import FloatingTabBar from "@/components/floating-tab-bar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="perdida" />
      <Tabs.Screen name="reportar" />
    </Tabs>
  );
}
