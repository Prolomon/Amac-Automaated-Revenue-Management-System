import React from "react";
import { View, Text, ScrollView, Linking, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldAlert, Phone, Mail, AlertTriangle } from "lucide-react-native";

interface BlockedScreenProps {
  status?: string;
  reason?: string;
}

export default function BlockedScreen({ status = "DELETED", reason }: BlockedScreenProps) {
  const isDeleted = status === "DELETED" || reason?.toLowerCase().includes("deleted");

  const handleCallSupport = () => {
    Linking.openURL("tel:+23492910000").catch(() => {});
  };

  const handleEmailSupport = () => {
    Linking.openURL(
      "mailto:support@amac.gov.ng?subject=Account%20Access%20Assistance%20-%20AMAC%20Enumerator"
    ).catch(() => {});
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Shield Icon */}
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            borderWidth: 2,
            borderColor: "rgba(239, 68, 68, 0.4)",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <ShieldAlert size={46} color="#EF4444" />
        </View>

        {/* Status Badge */}
        <View
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.2)",
            borderColor: "#EF4444",
            borderWidth: 1,
            borderRadius: 9999,
            paddingHorizontal: 16,
            paddingVertical: 6,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: "#FCA5A5",
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            STATUS: {isDeleted ? "DELETED" : "BLOCKED"}
          </Text>
        </View>

        {/* Title */}
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 24,
            fontWeight: "800",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Access Denied
        </Text>

        {/* Required User Prompt Message */}
        <View
          style={{
            backgroundColor: "rgba(30, 41, 59, 0.8)",
            borderWidth: 1,
            borderColor: "rgba(239, 68, 68, 0.3)",
            borderRadius: 16,
            padding: 18,
            width: "100%",
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              color: "#F87171",
              fontSize: 15,
              fontWeight: "700",
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 8,
            }}
          >
            You do not have permission to access the application.
          </Text>
          <Text
            style={{
              color: "#CBD5E1",
              fontSize: 13,
              textAlign: "center",
              lineHeight: 18,
            }}
          >
            {reason ||
              (isDeleted
                ? "This account has been deleted from the AMAC enumeration roster. Please contact support if you believe this is in error."
                : "Security lockout: More than 3 incorrect password attempts were detected. Please contact support to verify your identity.")}
          </Text>
        </View>

        {/* Warning Note */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            borderColor: "rgba(245, 158, 11, 0.3)",
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            width: "100%",
            marginBottom: 28,
            gap: 10,
          }}
        >
          <AlertTriangle size={20} color="#F59E0B" />
          <Text
            style={{
              flex: 1,
              color: "#FCD34D",
              fontSize: 12,
              lineHeight: 16,
              fontWeight: "500",
            }}
          >
            Application access remains restricted. Restarting or reinstalling the application will
            not remove this restriction until resolved by an administrator.
          </Text>
        </View>

        {/* Support Options */}
        <Text
          style={{
            color: "#94A3B8",
            fontSize: 12,
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: 12,
            alignSelf: "flex-start",
          }}
        >
          Support Channels
        </Text>

        <TouchableOpacity
          onPress={handleCallSupport}
          activeOpacity={0.8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#1E293B",
            borderWidth: 1,
            borderColor: "#334155",
            borderRadius: 14,
            padding: 14,
            width: "100%",
            marginBottom: 10,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(5, 150, 105, 0.2)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Phone size={18} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#F8FAFC", fontSize: 13, fontWeight: "600" }}>
              Call AMAC Support Desk
            </Text>
            <Text style={{ color: "#94A3B8", fontSize: 11 }}>+234 9 291 0000</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleEmailSupport}
          activeOpacity={0.8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#1E293B",
            borderWidth: 1,
            borderColor: "#334155",
            borderRadius: 14,
            padding: 14,
            width: "100%",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Mail size={18} color="#3B82F6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#F8FAFC", fontSize: 13, fontWeight: "600" }}>
              Email Support
            </Text>
            <Text style={{ color: "#94A3B8", fontSize: 11 }}>support@amac.gov.ng</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
