import { Tabs } from "expo-router";
import {
  CreditCard,
  Home,
  ScanBarcode,
  User,
  Users,
} from "lucide-react-native";
import "react-native-reanimated";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PagesTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "ios" ? Math.max(insets.bottom, 12) : 10;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#065f46",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e2e8f0",
          borderTopWidth: 1,
          height: insets.bottom + (Platform.OS === "ios" ? 88 : 64),
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : bottomPadding,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          elevation: 10,
          shadowColor: "#0f172a",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} size={focused ? 22 : 20} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan QR",
          tabBarIcon: ({ color, focused }) => (
            <ScanBarcode color={color} size={focused ? 22 : 20} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="pay"
        options={{
          title: "Collect",
          tabBarIcon: ({ color, focused }) => (
            <CreditCard color={color} size={focused ? 22 : 20} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: "Entities",
          tabBarIcon: ({ color, focused }) => (
            <Users color={color} size={focused ? 22 : 20} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Agent Profile",
          tabBarIcon: ({ color, focused }) => (
            <User color={color} size={focused ? 22 : 20} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
