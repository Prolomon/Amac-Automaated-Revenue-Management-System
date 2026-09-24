import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Eye, EyeOff, Lock, Mail, ArrowLeft, ShieldCheck, Camera } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { EnumeratorLevel } from "@/lib/types";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const activeRole: EnumeratorLevel = params.role === "SUPER" ? "SUPER" : "BASIC";

  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setErrorMsg("Please enter your email or phone number and password.");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    try {
      const res = await login(identifier.trim(), password, activeRole);
      if (!res.ok) {
        setErrorMsg(res.message || "Sign in failed. Check your credentials.");
      } else {
        if (activeRole === "SUPER") {
          router.replace("/(supervisor)" as any);
        } else {
          router.replace("/(tabs)");
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView  style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerClassName="p-6 grow" keyboardShouldPersistTaps="handled">
          {/* Back to Role Selection */}
          <TouchableOpacity
            className="flex-row items-center gap-2 mb-5 self-start py-2"
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color="#334155" />
            <Text className="text-sm font-semibold text-slate-700">Switch Role</Text>
          </TouchableOpacity>

          {/* Header */}
          <View className="items-center mb-6">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4 bg-emerald-50 border border-emerald-200"
            >
              {activeRole === "SUPER" ? (
                <ShieldCheck size={32} color="#059669" />
              ) : (
                <Camera size={32} color="#059669" />
              )}
            </View>
            <Text className="text-2xl font-extrabold text-slate-900">
              {activeRole === "SUPER" ? "Supervisor Sign In" : "Enumerator Sign In"}
            </Text>
            <Text className="text-xs text-slate-500 mt-1.5 text-center leading-4.5 max-w-[290px]">
              {activeRole === "SUPER"
                ? "Access supervisor queue, verify submissions & team targets"
                : "Submit property photo sets and onboard entities to earn rewards"}
            </Text>
          </View>

          {/* Error Banner */}
          {errorMsg ? (
            <View className="bg-red-50 border border-red-300 rounded-xl p-3 mb-4">
              <Text className="text-red-700 text-xs text-center font-medium">{errorMsg}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View className="gap-5">
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-slate-700">Email Address or Phone Number</Text>
              <View className="flex-row items-center bg-white rounded-2xl border border-slate-300 px-3.5">
                <Mail size={18} color="#94A3B8" />
                <TextInput
                  className="flex-1 h-12 text-sm text-slate-900 ml-2.5"
                  placeholder="e.g. agent@amac.gov.ng or 08012345678"
                  placeholderTextColor="#94A3B8"
                  value={identifier}
                  onChangeText={(val) => {
                    setIdentifier(val);
                    setErrorMsg("");
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View className="gap-1.5">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs font-semibold text-slate-700">Password</Text>
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/forgot-password" as any)}
                >
                  <Text className="text-xs font-semibold text-emerald-600">Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center bg-white rounded-2xl border border-slate-300 px-3.5">
                <Lock size={18} color="#94A3B8" />
                <TextInput
                  className="flex-1 h-12 text-sm text-slate-900 ml-2.5"
                  placeholder="Enter your account password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setErrorMsg("");
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  className="p-2"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#64748B" />
                  ) : (
                    <Eye size={18} color="#64748B" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              className={`h-13 rounded-2xl items-center justify-center mt-2 bg-emerald-600 ${
                loading ? "opacity-60" : ""
              }`}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-sm font-bold">Sign In to Dashboard</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
