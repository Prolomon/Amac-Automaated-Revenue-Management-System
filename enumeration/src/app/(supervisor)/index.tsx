import React, { useState, useEffect, useCallback } from "react";
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
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Sparkles,
  ClipboardList,
  AlertCircle,
  Award,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { enumeratorService } from "@/lib/services/enumeratorService";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SupervisorHomeScreen() {
  const router = useRouter();
  const { user, wallet, token, refreshProfile } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    denied: 0,
    teamCount: 0,
  });

  const loadSupervisorStats = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingStats(true);
      const [pendingRes, approvedRes, deniedRes, teamRes] = await Promise.all([
        enumeratorService.getCaptures(token, { status: "PENDING", limit: 1 }),
        enumeratorService.getCaptures(token, { status: "APPROVED", limit: 1 }),
        enumeratorService.getCaptures(token, { status: "DENIED", limit: 1 }),
        enumeratorService.getSupervisorTeam(token),
      ]);

      setStats({
        pending: pendingRes.meta?.total ?? (Array.isArray(pendingRes.data) ? pendingRes.data.length : 0),
        approved: approvedRes.meta?.total ?? (Array.isArray(approvedRes.data) ? approvedRes.data.length : 0),
        denied: deniedRes.meta?.total ?? (Array.isArray(deniedRes.data) ? deniedRes.data.length : 0),
        teamCount: Array.isArray(teamRes.data) ? teamRes.data.length : 0,
      });
    } catch (err) {
      console.warn("Failed to load supervisor stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  useEffect(() => {
    loadSupervisorStats();
  }, [loadSupervisorStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), loadSupervisorStats()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerClassName="p-4 gap-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
        }
      >
        {/* Header / Supervisor Greeting */}
        <View className="flex-row justify-between items-center">
          <View className="flex-1 pr-2">
            <View className="flex-row items-center gap-1.5 mb-1">
              <View className="bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex-row items-center gap-1">
                <ShieldCheck size={11} color="#059669" />
                <Text className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                  Field Supervisor
                </Text>
              </View>
              <Text className="text-[10px] font-semibold text-slate-400">AMAC Municipal</Text>
            </View>

            <Text className="text-2xl font-black text-slate-900" numberOfLines={1}>
              {user?.name || "Supervisor"}
            </Text>

            <View className="flex-row items-center gap-1 mt-1">
              <MapPin size={12} color="#059669" />
              <Text className="text-xs text-emerald-700 font-semibold">
                {user?.center || "AMAC Secretariat"} • Zone {user?.zone || "A"}
              </Text>
            </View>
          </View>

          {user?.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              className="w-12 h-12 rounded-full border-2 border-emerald-600"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 items-center justify-center">
              <Text className="text-base font-bold text-emerald-800">
                {user?.name?.slice(0, 2).toUpperCase() || "SV"}
              </Text>
            </View>
          )}
        </View>

        {/* Supervisor Operations Overview Card */}
        <View className="bg-emerald-900 rounded-3xl p-5 border border-emerald-800">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-xs text-emerald-200 font-semibold uppercase tracking-wider">
                Supervisor Oversight Hub
              </Text>
              <Text className="text-xl font-black text-white mt-1">
                UID: {user?.uid || "SUPERVISOR"}
              </Text>
            </View>
            <View className="w-10 h-10 rounded-2xl bg-white/15 items-center justify-center">
              <ShieldCheck size={22} color="#FFFFFF" />
            </View>
          </View>

          <View className="h-[1px] bg-white/15 my-3.5" />

          {/* Quick Metrics Strip */}
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-[11px] text-emerald-200">Pending Review</Text>
              <Text className="text-base font-black text-white mt-0.5">
                {loadingStats ? "..." : `${stats.pending} items`}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-[11px] text-emerald-200">Approved Payouts</Text>
              <Text className="text-base font-black text-emerald-300 mt-0.5">
                {loadingStats ? "..." : `${stats.approved} paid`}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-[11px] text-emerald-200">Team Size</Text>
              <Text className="text-base font-black text-white mt-0.5">
                {loadingStats ? "..." : `${stats.teamCount} agents`}
              </Text>
            </View>
          </View>
        </View>

        {/* QUICK ACTIONS SECTION */}
        <View className="gap-1 mt-1">
          <Text className="text-base font-black text-slate-900">
            Quick Actions & Review Queues
          </Text>
          <Text className="text-xs text-slate-500">
            Tap a queue to verify field captures, manage approvals, or monitor enumerators
          </Text>
        </View>

        <View className="gap-3">
          {/* Action 1: Pending Reviews */}
          <TouchableOpacity
            activeOpacity={0.75}
            className="bg-white rounded-2xl p-4 border border-amber-300 flex-row items-center justify-between"
            onPress={() =>
              router.push({
                pathname: "/(supervisor)/reviews",
                params: { status: "PENDING" },
              })
            }
          >
            <View className="flex-row items-center gap-3.5 flex-1 pr-2">
              <View className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-200 items-center justify-center">
                <Clock size={22} color="#D97706" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-bold text-slate-900">Pending Reviews</Text>
                  <View className="bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                    <Text className="text-[10px] font-bold text-amber-800">
                      {loadingStats ? "..." : `${stats.pending} Awaiting`}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Submissions awaiting verification & ₦50 reward authorization
                </Text>
              </View>
            </View>
            <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
              <ChevronRight size={18} color="#64748B" />
            </View>
          </TouchableOpacity>

          {/* Action 2: Approved Reviews */}
          <TouchableOpacity
            activeOpacity={0.75}
            className="bg-white rounded-2xl p-4 border border-emerald-300 flex-row items-center justify-between"
            onPress={() =>
              router.push({
                pathname: "/(supervisor)/reviews",
                params: { status: "APPROVED" },
              })
            }
          >
            <View className="flex-row items-center gap-3.5 flex-1 pr-2">
              <View className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-200 items-center justify-center">
                <CheckCircle2 size={22} color="#059669" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-bold text-slate-900">Approved Reviews</Text>
                  <View className="bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Text className="text-[10px] font-bold text-emerald-800">
                      {loadingStats ? "..." : `${stats.approved} Verified`}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Verified municipal premises & completed reward payouts
                </Text>
              </View>
            </View>
            <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
              <ChevronRight size={18} color="#64748B" />
            </View>
          </TouchableOpacity>

          {/* Action 3: Denied Reviews */}
          <TouchableOpacity
            activeOpacity={0.75}
            className="bg-white rounded-2xl p-4 border border-red-200 flex-row items-center justify-between"
            onPress={() =>
              router.push({
                pathname: "/(supervisor)/reviews",
                params: { status: "DENIED" },
              })
            }
          >
            <View className="flex-row items-center gap-3.5 flex-1 pr-2">
              <View className="w-11 h-11 rounded-2xl bg-red-100 border border-red-200 items-center justify-center">
                <XCircle size={22} color="#DC2626" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-bold text-slate-900">Denied Reviews</Text>
                  <View className="bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                    <Text className="text-[10px] font-bold text-red-800">
                      {loadingStats ? "..." : `${stats.denied} Denied`}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Flagged or rejected records with recorded feedback
                </Text>
              </View>
            </View>
            <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
              <ChevronRight size={18} color="#64748B" />
            </View>
          </TouchableOpacity>

          {/* Action 4: Team Monitor */}
          <TouchableOpacity
            activeOpacity={0.75}
            className="bg-white rounded-2xl p-4 border border-slate-300 flex-row items-center justify-between"
            onPress={() => router.push("/(supervisor)/team")}
          >
            <View className="flex-row items-center gap-3.5 flex-1 pr-2">
              <View className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 items-center justify-center">
                <Users size={22} color="#334155" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-bold text-slate-900">Team Monitor</Text>
                  <View className="bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    <Text className="text-[10px] font-bold text-slate-700">
                      {loadingStats ? "..." : `${stats.teamCount} Agents`}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Field enumerators roster, assigned zones & performance
                </Text>
              </View>
            </View>
            <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
              <ChevronRight size={18} color="#64748B" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Supervisor Directive Notice */}
        <View className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex-row items-start gap-2.5 mt-1">
          <AlertCircle size={18} color="#059669" style={{ marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-xs font-bold text-emerald-950">Verification Directive</Text>
            <Text className="text-xs text-emerald-800 mt-0.5 leading-4.5">
              Always verify physical premises addresses against geospatial coordinates and photo clarity before approving. Approvals instantly credit ₦50 to the enumerator&apos;s wallet.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
