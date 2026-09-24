import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  Camera,
  Trash2,
  MapPin,
  Sparkles,
  Check,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { enumeratorService } from "@/lib/services/enumeratorService";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CaptureScreen() {
  const router = useRouter();
  const { user, token, refreshDailyTasks } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const [images, setImages] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("Commercial");
  const [takingPhoto, setTakingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleCapturePhoto = async () => {
    if (!cameraRef.current || takingPhoto) return;
    if (images.length >= 8) {
      Alert.alert("Maximum Limit Reached", "You can upload a maximum of 8 property photos.");
      return;
    }

    try {
      setTakingPhoto(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      if (photo?.base64) {
        const dataUrl = `data:image/jpeg;base64,${photo.base64}`;
        setImages((prev) => [...prev, dataUrl]);
      }
    } catch (err: any) {
      Alert.alert("Capture Error", err?.message || "Failed to capture photo from camera.");
    } finally {
      setTakingPhoto(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitCapture = async () => {
    if (images.length < 3) {
      Alert.alert(
        "Photos Required",
        `Please take at least 3 photos of the property. Currently taken: ${images.length}.`
      );
      return;
    }
    if (!address.trim()) {
      Alert.alert("Address Required", "Please enter the physical property street address.");
      return;
    }
    if (!token) {
      Alert.alert("Authentication Error", "Session expired. Please sign in again.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: propertyName.trim() || `Capture @ ${address.slice(0, 20)}`,
        address: address.trim(),
        type: propertyType,
        images,
        center: user?.center || "AMAC Central",
        zone: user?.zone || "A",
      };

      const res = await enumeratorService.submitCapture(payload, token);
      if (res.ok) {
        Alert.alert(
          "Capture Submitted!",
          "Property capture has been submitted for supervisor verification. ₦50 reward will be credited upon approval.",
          [
            {
              text: "Done",
              onPress: () => {
                setImages([]);
                setAddress("");
                setPropertyName("");
                refreshDailyTasks();
                router.replace("/(tabs)");
              },
            },
          ]
        );
      } else {
        Alert.alert("Submission Failed", res.message || "Could not submit capture.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to submit property capture.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <ActivityIndicator color="#059669" size="large" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <View className="bg-white rounded-3xl p-6 items-center border border-slate-200 max-w-sm">
          <Camera size={48} color="#059669" />
          <Text className="text-lg font-bold text-slate-900 mt-3 text-center">Camera Permission Required</Text>
          <Text className="text-xs text-slate-500 text-center mt-2 leading-5">
            Field enumeration requires direct camera access to capture real property structures and prevent gallery screenshot uploads.
          </Text>
          <TouchableOpacity className="bg-emerald-600 px-5 py-3 rounded-xl mt-5" onPress={requestPermission}>
            <Text className="text-white font-bold text-sm">Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView  style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <ScrollView contentContainerClassName="p-4 gap-4" keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-extrabold text-slate-900">Property Capture</Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              Live camera captures • Min 3, Max 8 photos
            </Text>
          </View>
          <View
            className={`px-2.5 py-1 rounded-full border ${
              images.length >= 3 && images.length <= 8
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                images.length >= 3 && images.length <= 8
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
            >
              {images.length} / 8 Photos
            </Text>
          </View>
        </View>

        {/* Live Camera Viewfinder */}
        <View className="h-80 rounded-3xl overflow-hidden bg-black border border-slate-300">
          <CameraView ref={cameraRef} className="flex-1" facing="back">
            {/* Overlay indicators */}
            <View className="flex-1 justify-between p-4 bg-black/20">
              <View className="flex-row items-center gap-1.5 self-center bg-black/60 px-3 py-1.5 rounded-full border border-white/20">
                <Sparkles size={14} color="#34D399" />
                <Text className="text-[11px] font-semibold text-emerald-300">Auto-Sharpening & EXIF Active</Text>
              </View>

              <View className="items-center pb-2">
                <TouchableOpacity
                  activeOpacity={0.8}
                  className={`w-18 h-18 rounded-full bg-white/30 border-4 border-white items-center justify-center ${
                    images.length >= 8 || takingPhoto ? "opacity-40" : ""
                  }`}
                  onPress={handleCapturePhoto}
                  disabled={images.length >= 8 || takingPhoto}
                >
                  <View className="w-14 h-14 rounded-full bg-white items-center justify-center">
                    {takingPhoto ? (
                      <ActivityIndicator size="small" color="#059669" />
                    ) : (
                      <Camera size={26} color="#059669" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>

        {/* Thumbnails of Taken Photos */}
        <View className="bg-white rounded-3xl p-4 border border-slate-200 gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Captured Photos ({images.length})
            </Text>
            {images.length < 3 ? (
              <Text className="text-xs text-amber-600 font-semibold">
                Need {3 - images.length} more (min 3)
              </Text>
            ) : (
              <View className="flex-row items-center gap-1">
                <Check size={14} color="#059669" />
                <Text className="text-xs text-emerald-600 font-bold">
                  Quota met ({images.length}/8)
                </Text>
              </View>
            )}
          </View>

          {images.length === 0 ? (
            <View className="items-center justify-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 gap-1.5">
              <Camera size={24} color="#94A3B8" />
              <Text className="text-xs text-slate-400 text-center">
                No photos taken yet. Point camera at property and tap the capture button above.
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2.5">
              {images.map((img, idx) => (
                <View key={idx} className="relative w-22 h-22 rounded-2xl overflow-hidden mr-2.5 border border-slate-200">
                  <Image source={{ uri: img }} className="w-full h-full object-cover" />
                  <TouchableOpacity
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 items-center justify-center"
                    onPress={() => handleRemovePhoto(idx)}
                  >
                    <Trash2 size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                  <View className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-white">#{idx + 1}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Address and Property Details Form */}
        <View className="bg-white rounded-3xl p-4 border border-slate-200 gap-3.5">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">Property Location & Details</Text>

          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-slate-700">
              Physical Street Address <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row items-center bg-slate-50 rounded-2xl border border-slate-200 px-3.5">
              <MapPin size={18} color="#94A3B8" />
              <TextInput
                className="flex-1 h-12 text-sm text-slate-900 ml-2"
                placeholder="e.g. Plot 452, Constitution Avenue, Central Area"
                placeholderTextColor="#94A3B8"
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-slate-700">Property / Building Name (Optional)</Text>
            <TextInput
              className="h-12 bg-slate-50 rounded-2xl border border-slate-200 px-3.5 text-sm text-slate-900"
              placeholder="e.g. Sterling Plaza, Block B"
              placeholderTextColor="#94A3B8"
              value={propertyName}
              onChangeText={setPropertyName}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-slate-700">Building Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {["Commercial", "Residential", "Mixed Use", "Industrial"].map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`px-3 py-2 rounded-xl border ${
                    propertyType === type
                      ? "bg-emerald-600 border-emerald-600"
                      : "bg-slate-50 border-slate-200"
                  }`}
                  onPress={() => setPropertyType(type)}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      propertyType === type ? "text-white font-bold" : "text-slate-700"
                    }`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reward Alert */}
          <View className="flex-row items-center gap-2 bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
            <Sparkles size={16} color="#059669" />
            <Text className="text-xs text-emerald-800 flex-1 leading-4.5">
              Submitting this verified capture awards <Text className="font-extrabold">₦50</Text> directly to your virtual wallet upon supervisor approval.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            className={`h-13 rounded-2xl items-center justify-center mt-2 bg-emerald-600 ${
              images.length < 3 || !address.trim() || submitting ? "opacity-50" : ""
            }`}
            onPress={handleSubmitCapture}
            disabled={images.length < 3 || !address.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-sm font-bold">
                Submit Property Capture ({images.length} Photos)
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
