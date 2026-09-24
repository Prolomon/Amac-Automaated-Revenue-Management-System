import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import {
  Users,
  Camera,
  UserPlus,
  Clock,
  CheckCircle2,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { enumeratorService } from "@/lib/services/enumeratorService";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SupervisorTeamScreen() {
  const { token } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTeam = async () => {
    if (!token) return;
    try {
      const res = await enumeratorService.getSupervisorTeam(token);
      if (res.ok && res.data) {
        setTeam(res.data);
      }
    } catch (err) {
      console.warn("Failed to load team:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeam();
    setRefreshing(false);
  };

  return (
    <SafeAreaView  style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <View className="flex-1 p-4">
        {/* Header */}
        <View className="mb-3">
          <Text className="text-xl font-extrabold text-slate-900">Assigned Field Team</Text>
          <Text className="text-xs text-slate-500 mt-0.5">
            Live monitoring of daily 50 captures / 50 registrations performance
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#059669" size="large" className="mt-10" />
        ) : (
          <ScrollView
            contentContainerClassName="gap-3 pb-6"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
            }
          >
            {team.length === 0 ? (
              <View className="bg-white rounded-3xl p-8 items-center border border-slate-200 gap-2 mt-5">
                <Users size={40} color="#94A3B8" />
                <Text className="text-base font-bold text-slate-700">No Field Agents Assigned</Text>
                <Text className="text-xs text-slate-400 text-center max-w-[260px]">
                  Field enumerators assigned to your supervisor account will appear here.
                </Text>
              </View>
            ) : (
              team.map((member) => {
                const capturesCount = member.today?.captures || 0;
                const registrationsCount = member.today?.registrations || 0;
                const pendingCount = member.pending?.total || 0;

                const capPercent = Math.min(Math.round((capturesCount / 50) * 100), 100);
                const regPercent = Math.min(Math.round((registrationsCount / 50) * 100), 100);

                return (
                  <View key={member.uid || member.id} className="bg-white rounded-3xl p-4 border border-slate-200 gap-3.5">
                    {/* Top Row */}
                    <View className="flex-row items-center gap-3">
                      <View className="w-11 h-11 rounded-full bg-emerald-50 items-center justify-center border border-emerald-200">
                        <Text className="text-base font-bold text-emerald-700">
                          {member.name?.slice(0, 2).toUpperCase() || "EA"}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-slate-900">{member.name}</Text>
                        <Text className="text-xs text-slate-500 mt-0.5">
                          {member.phone} • {member.center || "AMAC Zone"} (Zone {member.zone || "A"})
                        </Text>
                      </View>
                      {pendingCount > 0 ? (
                        <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          <Clock size={12} color="#D97706" />
                          <Text className="text-[11px] font-bold text-amber-600">{pendingCount} Pending</Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 size={12} color="#059669" />
                          <Text className="text-[11px] font-bold text-emerald-600">Reviewed</Text>
                        </View>
                      )}
                    </View>

                    {/* Progress Bars (50 Captures / 50 Registrations) */}
                    <View className="gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {/* Captures */}
                      <View className="gap-1.5">
                        <View className="flex-row justify-between items-center">
                          <View className="flex-row items-center gap-1">
                            <Camera size={12} color="#059669" />
                            <Text className="text-[11px] font-semibold text-slate-700">Captures</Text>
                          </View>
                          <Text className="text-[11px] font-bold text-slate-900">
                            {capturesCount} / 50 ({capPercent}%)
                          </Text>
                        </View>
                        <View className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <View
                            className="h-1.5 rounded-full bg-emerald-600"
                            style={{ width: `${capPercent}%` }}
                          />
                        </View>
                      </View>

                      {/* Registrations */}
                      <View className="gap-1.5">
                        <View className="flex-row justify-between items-center">
                          <View className="flex-row items-center gap-1">
                            <UserPlus size={12} color="#059669" />
                            <Text className="text-[11px] font-semibold text-slate-700">Registrations</Text>
                          </View>
                          <Text className="text-[11px] font-bold text-slate-900">
                            {registrationsCount} / 50 ({regPercent}%)
                          </Text>
                        </View>
                        <View className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <View
                            className="h-1.5 rounded-full bg-emerald-600"
                            style={{ width: `${regPercent}%` }}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
