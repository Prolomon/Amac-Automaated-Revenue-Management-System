import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShieldCheck,
  Users,
  LogOut,
  KeyRound,
  MessageSquare,
  X,
  CreditCard,
  Building,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react-native";
import { Dialog } from "heroui-native";
import { useAuth } from "@/context/AuthContext";
import { enumeratorService } from "@/lib/services/enumeratorService";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, wallet, token, logout } = useAuth();

  // Change Password state
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Logout modal state
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
    router.replace("/(auth)/select-role" as any);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (!token) return;

    setPasswordError("");
    setChangingPassword(true);
    try {
      const res = await enumeratorService.changePassword(oldPassword, newPassword, token);
      if (res.ok) {
        setPasswordSuccess(true);
        setTimeout(() => {
          setPasswordModalVisible(false);
          setPasswordSuccess(false);
          setOldPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }, 1200);
      } else {
        setPasswordError(res.message || "Failed to update password.");
      }
    } catch (err: any) {
      setPasswordError(err?.message || "Password update failed.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <SafeAreaView  style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <ScrollView contentContainerClassName="p-4 gap-3.5" showsVerticalScrollIndicator={false}>
        {/* Header Profile Identity Card */}
        <View className="bg-white rounded-3xl p-4.5 border border-slate-200">
          <View className="flex-row items-center gap-3.5">
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} className="w-16 h-16 rounded-full border-2 border-emerald-600" />
            ) : (
              <View className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 items-center justify-center">
                <Text className="text-xl font-bold text-emerald-800">
                  {user?.name?.slice(0, 2).toUpperCase() || "EA"}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <View className="flex-row items-center gap-2 flex-wrap">
                <Text className="text-lg font-extrabold text-slate-900">{user?.name}</Text>
                {user?.uid && (
                  <View className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    <Text className="text-[10px] font-mono font-bold text-slate-600">{user.uid}</Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center gap-2 mt-1">
                <View className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200">
                  <Text className="text-[11px] font-bold text-emerald-800">
                    {user?.level === "SUPER" ? "Area Supervisor" : "Field Enumerator"}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 size={10} color="#059669" />
                  <Text className="text-[10px] font-semibold text-emerald-700">
                    {user?.status !== false ? "Verified Active" : "Pending Status"}
                  </Text>
                </View>
              </View>

              <Text className="text-xs text-slate-500 font-medium mt-1">
                {user?.center || "AMAC Central"} • Zone {user?.zone || "A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Revenue Wallet Information */}
        <View className="bg-white rounded-3xl p-4 border border-slate-200 gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">Enumerator Wallet & Account</Text>
          </View>

          <View className="flex-row items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <View>
              <Text className="text-[11px] text-slate-400">Virtual Ledger Account</Text>
              <Text className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                {wallet?.accountNo || user?.wallet?.accountNo || "99" + (user?.phone?.slice(-8) || "00000000")}
              </Text>
              <Text className="text-[10px] text-slate-500 mt-0.5">
                {user?.wallet?.bankName || "AMAC Automated Revenue Ledger"}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-[11px] text-slate-400">Available Balance</Text>
              <Text className="text-base font-black text-emerald-700 mt-0.5">
                ₦{((wallet?.balance ?? user?.wallet?.balance ?? 0)).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Personal & Deployment Details */}
        <View className="bg-white rounded-3xl p-4 border border-slate-200 gap-3">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">Official Profile Details</Text>

          <View className="flex-row items-center gap-3 py-1 border-b border-slate-100">
            <Mail size={16} color="#059669" />
            <View className="flex-1">
              <Text className="text-[11px] text-slate-400">Email Address</Text>
              <Text className="text-xs font-semibold text-slate-800 mt-0.5">{user?.email || "Not provided"}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3 py-1 border-b border-slate-100">
            <Phone size={16} color="#059669" />
            <View className="flex-1">
              <Text className="text-[11px] text-slate-400">Primary Phone</Text>
              <Text className="text-xs font-semibold text-slate-800 mt-0.5">{user?.phone || "Not provided"}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3 py-1 border-b border-slate-100">
            <MessageSquare size={16} color="#059669" />
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[11px] text-slate-400">WhatsApp / Alt Phone</Text>
                <View className="px-1.5 py-0.2 rounded bg-emerald-50 border border-emerald-200">
                  <Text className="text-[9px] font-bold text-emerald-700">Official Line</Text>
                </View>
              </View>
              <Text className="text-xs font-semibold text-slate-800 mt-0.5">{user?.altPhone || user?.phone || "Not set"}</Text>
            </View>
          </View>

          {user?.dob ? (
            <View className="flex-row items-center gap-3 py-1 border-b border-slate-100">
              <Calendar size={16} color="#059669" />
              <View className="flex-1">
                <Text className="text-[11px] text-slate-400">Date of Birth</Text>
                <Text className="text-xs font-semibold text-slate-800 mt-0.5">
                  {new Date(user.dob).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          ) : null}

          <View className="flex-row items-center gap-3 py-1 border-b border-slate-100">
            <Building size={16} color="#059669" />
            <View className="flex-1">
              <Text className="text-[11px] text-slate-400">Assigned Operational Center</Text>
              <Text className="text-xs font-semibold text-slate-800 mt-0.5">
                {user?.center || "AMAC Central Revenue Center"} (Zone {user?.zone || "A"})
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3 py-1">
            <MapPin size={16} color="#059669" />
            <View className="flex-1">
              <Text className="text-[11px] text-slate-400">Physical Residential Address</Text>
              <Text className="text-xs font-semibold text-slate-800 mt-0.5">{user?.address || "Federal Capital Territory, Abuja"}</Text>
            </View>
          </View>
        </View>

        {/* Assigned Supervisor */}
        {user?.supervisor ? (
          <View className="bg-white rounded-3xl p-4 border border-slate-200">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Assigned Area Supervisor</Text>
            <View className="flex-row items-center gap-3 bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
              <ShieldCheck size={20} color="#059669" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900">{user.supervisor.name}</Text>
                <Text className="text-xs text-slate-600 mt-0.5">
                  {user.supervisor.phone} • {user.supervisor.email}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Compulsory 2 Guarantors */}
        <View className="bg-white rounded-3xl p-4 border border-slate-200 gap-3">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">Guarantors on Record</Text>

          {/* Guarantor 1 */}
          <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 gap-1">
            <View className="flex-row items-center gap-1.5 mb-0.5">
              <Users size={16} color="#059669" />
              <Text className="text-xs font-bold text-emerald-800">Primary Guarantor (1)</Text>
            </View>
            <Text className="text-sm font-bold text-slate-900">{user?.guarantor1?.name || "Dr. Samuel Oche"}</Text>
            <Text className="text-xs text-slate-600">Phone: {user?.guarantor1?.phone || "08023456789"}</Text>
            <Text className="text-xs text-slate-600">Email: {user?.guarantor1?.email || "guarantor1@gmail.com"}</Text>
            <Text className="text-xs text-slate-600">Address: {user?.guarantor1?.address || "Wuse 2, Abuja"}</Text>
          </View>

          {/* Guarantor 2 */}
          <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 gap-1">
            <View className="flex-row items-center gap-1.5 mb-0.5">
              <Users size={16} color="#059669" />
              <Text className="text-xs font-bold text-emerald-800">Secondary Guarantor (2)</Text>
            </View>
            <Text className="text-sm font-bold text-slate-900">{user?.guarantor2?.name || "Mrs. Fatima Bello"}</Text>
            <Text className="text-xs text-slate-600">Phone: {user?.guarantor2?.phone || "08034567890"}</Text>
            <Text className="text-xs text-slate-600">Email: {user?.guarantor2?.email || "guarantor2@gmail.com"}</Text>
            <Text className="text-xs text-slate-600">Address: {user?.guarantor2?.address || "Garki 2, Abuja"}</Text>
          </View>
        </View>

        {/* Security & Actions */}
        <View className="bg-white rounded-3xl p-4 border border-slate-200 gap-3">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Security</Text>

          <TouchableOpacity
            className="flex-row items-center gap-3 py-2"
            onPress={() => {
              setPasswordError("");
              setPasswordModalVisible(true);
            }}
          >
            <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center border border-slate-200">
              <KeyRound size={18} color="#0F172A" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900">Change Password</Text>
              <Text className="text-xs text-slate-500 mt-0.5">Update your account login password</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center gap-3 py-2 border-t border-slate-100 pt-3"
            onPress={() => setLogoutModalVisible(true)}
          >
            <View className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center border border-red-200">
              <LogOut size={18} color="#DC2626" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-red-600">Sign Out</Text>
              <Text className="text-xs text-slate-500 mt-0.5">Log out from this device</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* HeroUI Native Change Password Dialog */}
      <Dialog isOpen={passwordModalVisible} onOpenChange={setPasswordModalVisible}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-black/50" />
          <Dialog.Content className="mx-4 p-5 bg-white rounded-3xl border border-slate-200 max-w-sm">
            <View className="flex-row justify-between items-center pb-3 border-b border-slate-100 mb-3">
              <Dialog.Title className="text-base font-bold text-slate-900">Change Password</Dialog.Title>
              <Dialog.Close>
                <X size={20} color="#64748B" />
              </Dialog.Close>
            </View>

            <Dialog.Description className="text-xs text-slate-500 mb-3 leading-4.5">
              Enter your current password and choose a new password of at least 6 characters.
            </Dialog.Description>

            {passwordError ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-2.5 mb-3 flex-row items-center gap-2">
                <AlertTriangle size={14} color="#DC2626" />
                <Text className="text-red-700 text-xs flex-1 font-medium">{passwordError}</Text>
              </View>
            ) : null}

            {passwordSuccess ? (
              <View className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 mb-3 flex-row items-center gap-2">
                <CheckCircle2 size={16} color="#059669" />
                <Text className="text-emerald-800 text-xs font-bold">Password successfully updated!</Text>
              </View>
            ) : null}

            <View className="gap-3">
              <View className="gap-1">
                <Text className="text-xs font-semibold text-slate-700">Current Password</Text>
                <TextInput
                  className="h-11 border border-slate-300 rounded-xl px-3 text-sm text-slate-900 bg-slate-50"
                  placeholder="Enter current password"
                  placeholderTextColor="#94A3B8"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry
                />
              </View>

              <View className="gap-1">
                <Text className="text-xs font-semibold text-slate-700">New Password</Text>
                <TextInput
                  className="h-11 border border-slate-300 rounded-xl px-3 text-sm text-slate-900 bg-slate-50"
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#94A3B8"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              <View className="gap-1">
                <Text className="text-xs font-semibold text-slate-700">Confirm New Password</Text>
                <TextInput
                  className="h-11 border border-slate-300 rounded-xl px-3 text-sm text-slate-900 bg-slate-50"
                  placeholder="Re-type new password"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <View className="flex-row gap-2.5 mt-2">
                <TouchableOpacity
                  className="flex-1 h-11 rounded-xl items-center justify-center bg-slate-100 border border-slate-200"
                  onPress={() => setPasswordModalVisible(false)}
                >
                  <Text className="text-xs font-semibold text-slate-600">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  className={`flex-[2] h-11 rounded-xl items-center justify-center bg-emerald-600 ${
                    changingPassword ? "opacity-60" : ""
                  }`}
                  onPress={handleChangePassword}
                  disabled={changingPassword}
                >
                  {changingPassword ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text className="text-white text-xs font-bold">Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      {/* HeroUI Native Logout Confirmation Dialog */}
      <Dialog isOpen={logoutModalVisible} onOpenChange={setLogoutModalVisible}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-black/50" />
          <Dialog.Content className="mx-4 p-5 bg-white rounded-3xl border border-slate-200 max-w-sm">
            <View className="flex-row justify-between items-center pb-2">
              <Dialog.Title className="text-base font-bold text-slate-900">Sign Out</Dialog.Title>
              <Dialog.Close>
                <X size={20} color="#64748B" />
              </Dialog.Close>
            </View>

            <Dialog.Description className="text-xs text-slate-500 mt-1 leading-5">
              Are you sure you want to sign out from your enumerator portal session? You will be returned to the role selection screen.
            </Dialog.Description>

            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                className="flex-1 h-11 rounded-xl items-center justify-center bg-slate-100 border border-slate-200"
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text className="text-xs font-semibold text-slate-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 h-11 rounded-xl items-center justify-center bg-red-600"
                onPress={handleLogout}
              >
                <Text className="text-xs font-bold text-white">Sign Out</Text>
              </TouchableOpacity>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </SafeAreaView>
  );
}
