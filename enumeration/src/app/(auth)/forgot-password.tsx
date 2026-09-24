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
import { useRouter } from "expo-router";
import { ArrowLeft, Mail, KeyRound, Lock, CheckCircle2 } from "lucide-react-native";
import { enumeratorService } from "@/lib/services/enumeratorService";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<"REQUEST_OTP" | "RESET_PASSWORD" | "SUCCESS">("REQUEST_OTP");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    try {
      const res = await enumeratorService.forgotPassword(email.trim());
      if (res.ok) {
        setInfoMsg(res.message || "A 6-digit reset code has been sent to your email.");
        setStep("RESET_PASSWORD");
      } else {
        setErrorMsg(res.message || "Failed to send reset code.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim()) {
      setErrorMsg("Please enter the verification code received.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    try {
      const res = await enumeratorService.resetPassword(email.trim(), otp.trim(), newPassword);
      if (res.ok) {
        setStep("SUCCESS");
      } else {
        setErrorMsg(res.message || "Failed to reset password.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Reset failed. Verification code may be invalid or expired.");
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
          <TouchableOpacity className="flex-row items-center gap-2 mb-5 self-start py-2" onPress={() => router.back()}>
            <ArrowLeft size={20} color="#334155" />
            <Text className="text-sm font-semibold text-slate-700">Back to Sign In</Text>
          </TouchableOpacity>

          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-full items-center justify-center mb-4 bg-emerald-50 border border-emerald-200">
              <KeyRound size={32} color="#059669" />
            </View>
            <Text className="text-2xl font-extrabold text-slate-900">Password Recovery</Text>
            <Text className="text-xs text-slate-500 mt-1.5 text-center leading-4.5 max-w-72.5">
              {step === "REQUEST_OTP"
                ? "Enter your registered email address to receive a secure password reset code."
                : step === "RESET_PASSWORD"
                ? "Enter the 6-digit code sent to your email and set a new password."
                : "Your password has been successfully reset. You can now sign in."}
            </Text>
          </View>

          {errorMsg ? (
            <View className="bg-red-50 border border-red-300 rounded-xl p-3 mb-4">
              <Text className="text-red-700 text-xs text-center font-medium">{errorMsg}</Text>
            </View>
          ) : null}

          {infoMsg ? (
            <View className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 mb-4">
              <Text className="text-emerald-800 text-xs text-center font-medium">{infoMsg}</Text>
            </View>
          ) : null}

          {step === "REQUEST_OTP" && (
            <View className="gap-5">
              <View className="gap-1.5">
                <Text className="text-xs font-semibold text-slate-700">Registered Email Address</Text>
                <View className="flex-row items-center bg-white rounded-2xl border border-slate-300 px-3.5">
                  <Mail size={18} color="#94A3B8" />
                  <TextInput
                    className="flex-1 h-12 text-sm text-slate-900 ml-2.5"
                    placeholder="e.g. yourname@domain.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      setErrorMsg("");
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                className={`h-13 rounded-2xl items-center justify-center mt-2 bg-emerald-600 ${
                  loading ? "opacity-60" : ""
                }`}
                onPress={handleRequestOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-sm font-bold">Send Verification Code</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === "RESET_PASSWORD" && (
            <View className="gap-5">
              <View className="gap-1.5">
                <Text className="text-xs font-semibold text-slate-700">6-Digit Verification Code</Text>
                <View className="flex-row items-center bg-white rounded-2xl border border-slate-300 px-3.5">
                  <KeyRound size={18} color="#94A3B8" />
                  <TextInput
                    className="flex-1 h-12 text-sm text-slate-900 ml-2.5 font-mono tracking-widest"
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#94A3B8"
                    value={otp}
                    onChangeText={(val) => {
                      setOtp(val);
                      setErrorMsg("");
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              <View className="gap-1.5">
                <Text className="text-xs font-semibold text-slate-700">New Password</Text>
                <View className="flex-row items-center bg-white rounded-2xl border border-slate-300 px-3.5">
                  <Lock size={18} color="#94A3B8" />
                  <TextInput
                    className="flex-1 h-12 text-sm text-slate-900 ml-2.5"
                    placeholder="Enter new password (min. 6 chars)"
                    placeholderTextColor="#94A3B8"
                    value={newPassword}
                    onChangeText={(val) => {
                      setNewPassword(val);
                      setErrorMsg("");
                    }}
                    secureTextEntry
                  />
                </View>
              </View>

              <View className="gap-1.5">
                <Text className="text-xs font-semibold text-slate-700">Confirm New Password</Text>
                <View className="flex-row items-center bg-white rounded-2xl border border-slate-300 px-3.5">
                  <Lock size={18} color="#94A3B8" />
                  <TextInput
                    className="flex-1 h-12 text-sm text-slate-900 ml-2.5"
                    placeholder="Re-type new password"
                    placeholderTextColor="#94A3B8"
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      setErrorMsg("");
                    }}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                className={`h-13 rounded-2xl items-center justify-center mt-2 bg-emerald-600 ${
                  loading ? "opacity-60" : ""
                }`}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-sm font-bold">Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === "SUCCESS" && (
            <View className="items-center py-8">
              <CheckCircle2 size={64} color="#059669" className="self-center mb-4" />
              <Text className="text-xl font-extrabold text-slate-900 mb-2">Password Reset Successfully!</Text>
              <Text className="text-xs text-slate-500 text-center leading-5 mb-6 max-w-70">
                Your account password has been updated. You can now return to the login screen and sign in.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                className="h-13 w-full rounded-2xl items-center justify-center bg-emerald-600"
                onPress={() => router.replace("/(auth)/login" as any)}
              >
                <Text className="text-white text-sm font-bold">Proceed to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
