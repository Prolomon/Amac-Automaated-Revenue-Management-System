import React from "react";
import { Tabs } from "expo-router";
import { ClipboardCheck, Users, Home, ShieldCheck } from "lucide-react-native";
import { Platform } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SupervisorTabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
          borderTopWidth: 1,
          height: insets.bottom + (Platform.OS === "ios" ? 88 : 64),
          paddingTop: 8,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: "Reviews",
          tabBarIcon: ({ color, size }) => <ClipboardCheck size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: "Team Monitor",
          tabBarIcon: ({ color, size }) => <Users size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <ShieldCheck size={size || 22} color={color} />,
        }}
      />
    </Tabs>
  );
}
