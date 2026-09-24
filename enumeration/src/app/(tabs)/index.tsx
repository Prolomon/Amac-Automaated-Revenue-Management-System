import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Wallet,
  Camera,
  UserPlus,
  CheckCircle2,
  Clock,
  XCircle,
  Award,
  MapPin,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { enumeratorService } from "@/lib/services/enumeratorService";
import { PropertyCapture } from "@/lib/types";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const { user, wallet, dailyTasks, token, refreshDailyTasks, refreshProfile } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [recentCaptures, setRecentCaptures] = useState<PropertyCapture[]>([]);
  const [loadingCaptures, setLoadingCaptures] = useState(true);

  const loadRecentCaptures = async () => {
    if (!token) return;
    try {
      const res = await enumeratorService.getCaptures(token, { limit: 5 });
      if (res.ok && res.data) {
        setRecentCaptures(res.data);
      }
    } catch (err) {
      console.warn("Could not load recent captures:", err);
    } finally {
      setLoadingCaptures(false);
    }
  };

  useEffect(() => {
    loadRecentCaptures();
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshProfile(),
      refreshDailyTasks(),
      loadRecentCaptures(),
    ]);
    setRefreshing(false);
  };

  const captureProgress = dailyTasks?.captures || {
    submitted: 0,
    approved: 0,
    target: 50,
    rate: 50,
    earned: 0,
    percent: 0,
  };

  const registrationProgress = dailyTasks?.registrations || {
    submitted: 0,
    approved: 0,
    target: 50,
    rate: 50,
    earned: 0,
    percent: 0,
  };

  const totalTodayEarned = captureProgress.earned + registrationProgress.earned;

  return (
    <SafeAreaView  style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerClassName="p-5 gap-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
        }
      >
        {/* Header / User Greeting */}
        <View className="flex-row justify-between items-center mb-1">
          <View>
            <Text className="text-xs text-slate-500 font-medium">Welcome back,</Text>
            <Text className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {user?.name || "Field Agent"}
            </Text>
            <View className="flex-row items-center gap-1 mt-1">
              <MapPin size={12} color="#059669" />
              <Text className="text-xs text-emerald-600 font-semibold">
                {user?.center || "AMAC Zone"} • Zone {user?.zone || "A"}
              </Text>
            </View>
          </View>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} className="w-12 h-12 rounded-full border-2 border-emerald-600" />
          ) : (
            <View className="w-12 h-12 rounded-full bg-slate-200 items-center justify-center">
              <Text className="text-base font-bold text-slate-600">
                {user?.name?.slice(0, 2).toUpperCase() || "EA"}
              </Text>
            </View>
          )}
        </View>

        {/* Wallet Card */}
        <View className="bg-emerald-900 rounded-3xl p-5 border border-emerald-800">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-xs text-emerald-200 font-semibold uppercase tracking-wider">
                Enumerator Balance
              </Text>
              <Text className="text-3xl font-black text-white mt-1">
                ₦{((wallet?.balance ?? 0)).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="w-11 h-11 rounded-2xl bg-white/15 items-center justify-center">
              <Wallet size={24} color="#FFFFFF" />
            </View>
          </View>

          <View className="h-[1px] bg-white/15 my-3.5" />

          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-[11px] text-emerald-200">Virtual Account</Text>
              <Text className="text-xs text-white font-semibold mt-0.5">
                {wallet?.accountNo || "Auto-provisioned"}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-[11px] text-emerald-200">Today's Earnings</Text>
              <Text className="text-xs text-emerald-300 font-bold mt-0.5">
                +₦{totalTodayEarned.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Task Progress (50 Captures & 50 Registrations) */}
        <View className="flex-row justify-between items-center mt-1.5">
          <View className="flex-row items-center gap-1.5">
            <Award size={18} color="#059669" />
            <Text className="text-base font-bold text-slate-900">Daily Targets (50/50)</Text>
          </View>
          <Text className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            ₦50 / Approved
          </Text>
        </View>

        {/* Daily Task 1: Property Captures */}
        <View className="bg-white rounded-2xl p-4 border border-slate-200 gap-3">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl items-center justify-center bg-emerald-50 border border-emerald-100">
              <Camera size={20} color="#059669" />
            </View>
            <View className="flex-1">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-bold text-slate-900">Property Captures</Text>
                <Text className="text-xs font-bold text-slate-700">
                  {captureProgress.submitted} / {captureProgress.target}
                </Text>
              </View>
              <Text className="text-[11px] text-slate-400 mt-0.5">
                {captureProgress.approved} approved • ₦{captureProgress.earned} earned today
              </Text>
            </View>
          </View>
          {/* Progress Bar */}
          <View className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full bg-emerald-600"
              style={{ width: `${Math.min(captureProgress.percent, 100)}%` }}
            />
          </View>
        </View>

        {/* Daily Task 2: Entity Registrations */}
        <View className="bg-white rounded-2xl p-4 border border-slate-200 gap-3">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl items-center justify-center bg-emerald-50 border border-emerald-100">
              <UserPlus size={20} color="#059669" />
            </View>
            <View className="flex-1">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-bold text-slate-900">Entity Registrations</Text>
                <Text className="text-xs font-bold text-slate-700">
                  {registrationProgress.submitted} / {registrationProgress.target}
                </Text>
              </View>
              <Text className="text-[11px] text-slate-400 mt-0.5">
                {registrationProgress.approved} approved • ₦{registrationProgress.earned} earned today
              </Text>
            </View>
          </View>
          {/* Progress Bar */}
          <View className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full bg-emerald-600"
              style={{ width: `${Math.min(registrationProgress.percent, 100)}%` }}
            />
          </View>
        </View>

        {/* Quick Action Shortcuts */}
        <View className="flex-row gap-3 my-1">
          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-1 h-12 rounded-2xl flex-row items-center justify-center gap-2 bg-emerald-600"
            onPress={() => router.push("/(tabs)/capture")}
          >
            <Camera size={20} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold">New Capture</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-1 h-12 rounded-2xl flex-row items-center justify-center gap-2 bg-slate-900"
            onPress={() => router.push("/(tabs)/add-member")}
          >
            <UserPlus size={20} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold">Add Member</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Submissions */}
        <View className="flex-row justify-between items-center mt-1.5">
          <Text className="text-base font-bold text-slate-900">Recent Property Captures</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/notifications")}>
            <Text className="text-xs font-bold text-emerald-600">View all</Text>
          </TouchableOpacity>
        </View>

        {loadingCaptures ? (
          <ActivityIndicator color="#059669" className="my-5" />
        ) : recentCaptures.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center border border-slate-200 gap-2">
            <Camera size={32} color="#94A3B8" />
            <Text className="text-sm font-bold text-slate-800">No captures submitted yet</Text>
            <Text className="text-xs text-slate-400 text-center">
              Tap "New Capture" to take photos and record property locations.
            </Text>
          </View>
        ) : (
          <View className="gap-2.5">
            {recentCaptures.map((item) => (
              <View key={item.id} className="flex-row items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200">
                <View className="flex-row items-center gap-3 flex-1">
                  {item.images && item.images.length > 0 ? (
                    <Image source={{ uri: item.images[0] }} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <View className="w-12 h-12 rounded-xl bg-slate-100 items-center justify-center">
                      <Camera size={18} color="#94A3B8" />
                    </View>
                  )}
                  <View className="flex-1 pr-2">
                    <Text className="text-sm font-semibold text-slate-900" numberOfLines={1}>
                      {item.address}
                    </Text>
                    <Text className="text-[11px] text-slate-400 mt-0.5">
                      {item.images?.length || 0} photos • {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View
                  className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${
                    item.status === "APPROVED"
                      ? "bg-emerald-50"
                      : item.status === "PENDING"
                      ? "bg-amber-50"
                      : "bg-red-50"
                  }`}
                >
                  {item.status === "APPROVED" && <CheckCircle2 size={12} color="#059669" />}
                  {item.status === "PENDING" && <Clock size={12} color="#D97706" />}
                  {item.status === "DENIED" && <XCircle size={12} color="#DC2626" />}
                  <Text
                    className={`text-[10px] font-bold ${
                      item.status === "APPROVED"
                        ? "text-emerald-700"
                        : item.status === "PENDING"
                        ? "text-amber-700"
                        : "text-red-700"
                    }`}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
