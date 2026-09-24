import { Tabs } from "expo-router";
import {
  CreditCard,
  History,
  Home,
  User,
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
        tabBarActiveTintColor: "#0ea360",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e2e8f0",
          borderTopWidth: 1,
          height: insets.bottom + (Platform.OS === "ios" ? 88 : 64),
          paddingTop: 8,
          paddingBottom: insets.bottom,
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
          tabBarIcon: ({ color, size, focused }) => (
            <Home color={color} size={focused ? 22 : 20} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: "Assessments",
          tabBarIcon: ({ color, size, focused }) => (
            <CreditCard color={color} size={focused ? 22 : 20} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size, focused }) => (
            <History color={color} size={focused ? 22 : 20} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Taxpayer Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <User color={color} size={focused ? 22 : 20} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
