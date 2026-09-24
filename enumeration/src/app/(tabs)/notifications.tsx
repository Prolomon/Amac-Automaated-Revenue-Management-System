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
import {
  CheckCircle2,
  Clock,
  XCircle,
  Camera,
  AlertTriangle,
  Award,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { enumeratorService } from "@/lib/services/enumeratorService";
import { PropertyCapture } from "@/lib/types";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [captures, setCaptures] = useState<PropertyCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "APPROVED" | "PENDING" | "DENIED">("ALL");

  const loadSubmissions = async () => {
    if (!token) return;
    try {
      const res = await enumeratorService.getCaptures(token, { limit: 50 });
      if (res.ok && res.data) {
        setCaptures(res.data);
      }
    } catch (err) {
      console.warn("Failed to load submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubmissions();
    setRefreshing(false);
  };

  const filteredItems = captures.filter((item) => {
    if (filter === "ALL") return true;
    return item.status === filter;
  });

  return (
    <SafeAreaView  style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <View className="flex-1 p-4">
        {/* Header */}
        <View className="mb-3">
          <Text className="text-2xl font-extrabold text-slate-900">Submission Activity</Text>
          <Text className="text-xs text-slate-500 mt-0.5">
            Track approval status and rejection feedback for your submissions
          </Text>
        </View>

        {/* Filter Chips */}
        <View className="flex-row gap-2 mb-3.5">
          {(["ALL", "APPROVED", "PENDING", "DENIED"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              className={`px-3 py-1.5 rounded-xl border ${
                filter === f
                  ? "bg-emerald-600 border-emerald-600"
                  : "bg-white border-slate-200"
              }`}
              onPress={() => setFilter(f)}
            >
              <Text
                className={`text-xs font-semibold ${
                  filter === f ? "text-white font-bold" : "text-slate-600"
                }`}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submissions List */}
        {loading ? (
          <ActivityIndicator color="#059669" size="large" className="mt-10" />
        ) : (
          <ScrollView
            contentContainerClassName="gap-3 pb-5"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
            }
          >
            {filteredItems.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center border border-slate-200 gap-2 mt-4">
                <Clock size={36} color="#94A3B8" />
                <Text className="text-sm font-bold text-slate-800">No Submissions Found</Text>
                <Text className="text-xs text-slate-400 text-center">
                  Submissions under the "{filter.toLowerCase()}" filter will appear here.
                </Text>
              </View>
            ) : (
              filteredItems.map((item) => (
                <View key={item.id} className="bg-white rounded-2xl p-3.5 border border-slate-200 gap-2.5">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                      <Camera size={14} color="#059669" />
                      <Text className="text-[11px] font-bold text-emerald-800">{item.images?.length || 0} photos</Text>
                    </View>

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

                  <Text className="text-sm font-bold text-slate-900">{item.address}</Text>

                  {/* Thumbnail Row */}
                  {item.images && item.images.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2 my-1">
                      {item.images.map((img, idx) => (
                        <Image key={idx} source={{ uri: img }} className="w-16 h-16 rounded-xl object-cover mr-2" />
                      ))}
                    </ScrollView>
                  ) : null}

                  {/* Reward / Status note */}
                  {item.status === "APPROVED" ? (
                    <View className="flex-row items-center gap-1.5 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                      <Award size={14} color="#059669" />
                      <Text className="text-xs text-emerald-800 font-semibold">
                        ₦{item.reward || 50} reward credited to your wallet
                      </Text>
                    </View>
                  ) : item.status === "DENIED" ? (
                    <View className="flex-row items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-200">
                      <AlertTriangle size={14} color="#DC2626" />
                      <Text className="text-xs text-red-700 font-semibold">
                        Rejection Reason: {item.rejectionReason || "Photos unclear or invalid address."}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-xs text-amber-700 font-medium">
                      Awaiting supervisor physical verification and review.
                    </Text>
                  )}

                  <Text className="text-[11px] text-slate-400">
                    Submitted on {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
