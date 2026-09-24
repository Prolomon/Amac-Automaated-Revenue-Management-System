import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Camera, ShieldCheck, ArrowRight, UserCheck } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/lib/api";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SelectRoleScreen() {
  const router = useRouter();

  const handleSelectRole = async (level: "BASIC" | "SUPER") => {
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_LEVEL, level);
    router.push({
      pathname: "/(auth)/login",
      params: { role: level },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <ScrollView contentContainerClassName="p-6 grow justify-between flex-1 bg-white">
        {/* Header */}
        <View className="items-center mt-8 mb-6">
          <View className="w-18 h-18 rounded-full bg-emerald-50 items-center justify-center mb-4 border border-emerald-200">
            <UserCheck size={36} color="#004f3b" />
          </View>
          <Text className="text-2xl font-extrabold text-slate-900 text-center">AMAC Revenue</Text>
          <Text className="text-sm font-semibold text-emerald-900 mt-1 text-center">
            Field Enumeration & Verification Portal
          </Text>
          <Text className="text-xs text-slate-500 text-center mt-2 leading-5 max-w-[320px]">
            Select your account type to proceed with property captures, registrations, or verification reviews.
          </Text>
        </View>

        {/* Roles Selection */}
        <View className="gap-4 my-5">
          {/* Enumerator Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            className="bg-white rounded-2xl p-5 flex-row gap-4 border border-slate-200"
            onPress={() => handleSelectRole("BASIC")}
          >
            <View className="w-13 h-13 rounded-2xl items-center justify-center bg-emerald-50">
              <Camera size={28} color="#004f3b" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-base font-bold text-slate-900">Field Enumerator</Text>
                <View className="px-2 py-0.5 rounded-md bg-emerald-100">
                  <Text className="text-[11px] font-bold text-emerald-900">Field Agent</Text>
                </View>
              </View>
              <Text className="text-xs text-slate-500 leading-4.5 mb-3">
                Direct camera captures (3-8 live photos), entity onboarding, and daily ₦50 performance incentives.
              </Text>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xs font-bold text-emerald-900">Sign in as Enumerator</Text>
                <ArrowRight size={16} color="#004f3b" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Supervisor Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            className="bg-white rounded-2xl p-5 flex-row gap-4 border border-slate-200"
            onPress={() => handleSelectRole("SUPER")}
          >
            <View className="w-13 h-13 rounded-2xl items-center justify-center bg-emerald-50">
              <ShieldCheck size={28} color="#004f3b" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-base font-bold text-slate-900">Area Supervisor</Text>
                <View className="px-2 py-0.5 rounded-md bg-emerald-100">
                  <Text className="text-[11px] font-bold text-emerald-900">Supervisor</Text>
                </View>
              </View>
              <Text className="text-xs text-slate-500 leading-4.5 mb-3">
                Review & verify pending field captures, approve member wallets, and monitor team 50/50 daily quotas.
              </Text>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xs font-bold text-emerald-900">Sign in as Supervisor</Text>
                <ArrowRight size={16} color="#004f3b" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer info */}
        <View className="mt-5 items-center">
          <Text className="text-[11px] text-slate-400 text-center">
            Abuja Municipal Area Council • Automated Revenue Management System
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
