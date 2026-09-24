import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
  Dimensions,
} from "react-native";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Camera,
  User,
  MapPin,
  X,
  AlertTriangle,
} from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";
import { Dialog } from "heroui-native";
import { useAuth } from "@/context/AuthContext";
import { enumeratorService } from "@/lib/services/enumeratorService";
import { PropertyCapture } from "@/lib/types";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function SupervisorReviewsScreen() {
  const { token } = useAuth();
  const params = useLocalSearchParams<{ status?: string }>();

  const [statusFilter, setStatusFilter] = useState<"PENDING" | "APPROVED" | "DENIED">("PENDING");

  useEffect(() => {
    if (params.status) {
      const upper = String(params.status).toUpperCase();
      if (upper === "PENDING" || upper === "APPROVED" || upper === "DENIED") {
        setStatusFilter(upper as "PENDING" | "APPROVED" | "DENIED");
      }
    }
  }, [params.status]);
  const [captures, setCaptures] = useState<PropertyCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Rejection modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingItem, setRejectingItem] = useState<{ id: string; type: "CAPTURE" | "REGISTRATION" } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Full image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadData = async () => {
    if (!token) return;
    try {
      const res = await enumeratorService.getCaptures(token, {
        status: statusFilter,
        limit: 100,
      });
      if (res.ok && res.data) {
        setCaptures(res.data);
      }
    } catch (err) {
      console.warn("Failed to load captures:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, statusFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleApproveCapture = (item: PropertyCapture) => {
    Alert.alert(
      "Approve Capture",
      `Are you sure you want to approve this capture? ₦50 reward will be immediately credited to ${item.enumerator?.name || "the enumerator"}'s wallet.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve (₦50 Reward)",
          onPress: async () => {
            if (!token) return;
            setActionLoading(true);
            try {
              const res = await enumeratorService.reviewCapture(item.id, "APPROVE", undefined, token);
              if (res.ok) {
                Alert.alert("Approved", "Capture approved and ₦50 reward paid.");
                loadData();
              } else {
                Alert.alert("Failed", res.message || "Approval failed.");
              }
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Failed to approve capture.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDenyClick = (id: string, type: "CAPTURE" | "REGISTRATION") => {
    setRejectingItem({ id, type });
    setRejectionReason("");
    setRejectModalVisible(true);
  };

  const handleConfirmDeny = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert("Reason Required", "Please provide a reason for denying this submission.");
      return;
    }
    if (!token || !rejectingItem) return;

    setActionLoading(true);
    try {
      let res;
      if (rejectingItem.type === "CAPTURE") {
        res = await enumeratorService.reviewCapture(
          rejectingItem.id,
          "DENY",
          rejectionReason.trim(),
          token
        );
      } else {
        res = await enumeratorService.reviewMember(
          rejectingItem.id,
          "DENY",
          rejectionReason.trim(),
          token
        );
      }

      if (res.ok) {
        Alert.alert("Denied", "Submission status updated to Denied. The record is safely preserved.");
        setRejectModalVisible(false);
        setRejectingItem(null);
        loadData();
      } else {
        Alert.alert("Failed", res.message || "Rejection failed.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Rejection failed.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView  style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <View className="flex-1 p-4">
        {/* Header */}
        <View className="mb-3">
          <Text className="text-xl font-extrabold text-slate-900">Supervisor Review Queue</Text>
          <Text className="text-xs text-slate-500 mt-0.5">
            Physical verification & wallet reward authorization
          </Text>
        </View>

        {/* Status Filter Tabs */}
        <View className="flex-row gap-2 mb-3">
          {(["PENDING", "APPROVED", "DENIED"] as const).map((s) => (
            <TouchableOpacity
              key={s}
              className={`flex-1 items-center justify-center py-2 rounded-xl border ${
                statusFilter === s
                  ? "bg-emerald-50 border-emerald-600"
                  : "bg-slate-100 border-slate-200"
              }`}
              onPress={() => setStatusFilter(s)}
            >
              <Text
                className={`text-xs ${
                  statusFilter === s ? "text-emerald-700 font-bold" : "text-slate-500 font-semibold"
                }`}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {loading ? (
          <ActivityIndicator color="#059669" size="large" className="mt-10" />
        ) : (
          <ScrollView
            contentContainerClassName="gap-3 pb-6"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
            }
          >
            {captures.length === 0 ? (
              <View className="bg-white rounded-3xl p-8 items-center border border-slate-200 gap-2 mt-5">
                <ClipboardCheck size={40} color="#94A3B8" />
                <Text className="text-base font-bold text-slate-700">No {statusFilter.toLowerCase()} submissions</Text>
                <Text className="text-xs text-slate-400 text-center max-w-65">
                  Submissions requiring your review will appear here in real time.
                </Text>
              </View>
            ) : (
              captures.map((item) => (
                <View key={item.id} className="bg-white rounded-3xl p-4 border border-slate-200 gap-3.5">
                  {/* Card Header: Enumerator & Timestamp */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5">
                      <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center border border-emerald-200">
                        <User size={16} color="#059669" />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-slate-900">
                          {item.enumerator?.name || "Field Agent"}
                        </Text>
                        <Text className="text-[11px] text-slate-500 mt-0.5">
                          {item.enumerator?.center || item.center || "AMAC Zone"} • {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View
                      className={`px-2.5 py-0.5 rounded-md border ${
                        item.status === "APPROVED"
                          ? "bg-emerald-50 border-emerald-200"
                          : item.status === "PENDING"
                          ? "bg-amber-50 border-amber-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
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

                  {/* Property Details */}
                  <View className="flex-row items-center gap-1.5">
                    <MapPin size={16} color="#059669" />
                    <Text className="text-xs font-semibold text-slate-900 flex-1">{item.address}</Text>
                  </View>

                  {/* Photo Gallery (3 - 8 Photos) */}
                  <View className="gap-2">
                    <View className="flex-row items-center gap-1.5">
                      <Camera size={14} color="#059669" />
                      <Text className="text-xs font-semibold text-emerald-800">
                        Inspection Photos ({item.images?.length || 0}) • Tap to enlarge
                      </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                      {item.images?.map((img, idx) => (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.85}
                          onPress={() => setPreviewImage(img)}
                          className="w-20 h-20 rounded-xl overflow-hidden mr-2.5 relative border border-slate-200"
                        >
                          <Image source={{ uri: img }} className="w-full h-full object-cover" />
                          <View className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded">
                            <Text className="text-white text-[10px] font-bold">#{idx + 1}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Rejection reason if denied */}
                  {item.status === "DENIED" && item.rejectionReason ? (
                    <View className="flex-row items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-200">
                      <AlertTriangle size={14} color="#DC2626" />
                      <Text className="text-xs text-red-700 font-medium flex-1">Reason: {item.rejectionReason}</Text>
                    </View>
                  ) : null}

                  {/* Supervisor Actions (Only for PENDING items) */}
                  {item.status === "PENDING" && (
                    <View className="flex-row gap-3 mt-1 pt-3 border-t border-slate-100">
                      <TouchableOpacity
                        activeOpacity={0.85}
                        className="flex-1 h-11 rounded-xl flex-row items-center justify-center gap-1.5 bg-red-50 border border-red-300"
                        onPress={() => handleDenyClick(item.id, "CAPTURE")}
                        disabled={actionLoading}
                      >
                        <XCircle size={16} color="#DC2626" />
                        <Text className="text-red-600 text-xs font-bold">Deny</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        className="flex-2 h-11 rounded-xl flex-row items-center justify-center gap-1.5 bg-emerald-600"
                        onPress={() => handleApproveCapture(item)}
                        disabled={actionLoading}
                      >
                        <CheckCircle2 size={16} color="#FFFFFF" />
                        <Text className="text-white text-xs font-bold">Approve & Pay ₦50</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* HeroUI Native Denial Reason Feedback Dialog */}
      <Dialog isOpen={rejectModalVisible} onOpenChange={setRejectModalVisible}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-black/50" />
          <Dialog.Content className="mx-4 p-5 bg-white rounded-3xl border border-slate-200 max-w-sm">
            <View className="flex-row justify-between items-center pb-2">
              <Dialog.Title className="text-base font-bold text-slate-900">Denial Feedback</Dialog.Title>
              <Dialog.Close>
                <X size={20} color="#64748B" />
              </Dialog.Close>
            </View>

            <Dialog.Description className="text-xs text-slate-500 mb-3 leading-4.5">
              Please state why this submission is being rejected. This feedback will be displayed to the enumerator and the record will be preserved.
            </Dialog.Description>

            <TextInput
              className="h-24 bg-slate-50 rounded-xl border border-slate-300 p-3 text-xs text-slate-900"
              placeholder="e.g. Building address does not match coordinates, or photos are blurry."
              placeholderTextColor="#94A3B8"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View className="flex-row gap-2.5 mt-3">
              <TouchableOpacity
                className="flex-1 h-11 rounded-xl items-center justify-center bg-slate-100 border border-slate-200"
                onPress={() => setRejectModalVisible(false)}
              >
                <Text className="text-xs font-semibold text-slate-600">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-2 h-11 rounded-xl items-center justify-center bg-red-600 ${
                  actionLoading ? "opacity-60" : ""
                }`}
                onPress={handleConfirmDeny}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-xs font-bold text-white">Confirm Denial</Text>
                )}
              </TouchableOpacity>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      {/* HeroUI Native Full Photo Lightbox Preview Dialog */}
      <Dialog isOpen={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-black/90" />
          <Dialog.Content className="items-center justify-center p-2 bg-transparent border-0">
            <TouchableOpacity
              className="self-end p-3 mb-2"
              onPress={() => setPreviewImage(null)}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            {previewImage && (
              <Image
                source={{ uri: previewImage }}
                style={{ width: width * 0.92, height: width * 0.92 }}
                resizeMode="contain"
                className="rounded-2xl"
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </SafeAreaView>
  );
}
