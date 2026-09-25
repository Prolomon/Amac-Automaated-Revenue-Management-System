import React, { useState, useEffect } from "react";
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
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  Camera,
  Trash2,
  MapPin,
  Sparkles,
  Check,
  Image as ImageIcon,
  Plus,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { enumeratorService } from "@/lib/services/enumeratorService";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CaptureScreen() {
  const router = useRouter();
  const { user, token, refreshDailyTasks } = useAuth();

  const [images, setImages] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("Commercial");
  const [openingCamera, setOpeningCamera] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-captured GPS GeoTag without manual user input
  const [geoTag, setGeoTag] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"requesting" | "granted" | "denied">("requesting");

  useEffect(() => {
    async function requestLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          setLocationStatus("granted");
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (pos?.coords) {
            setGeoTag({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          }
        } else {
          setLocationStatus("denied");
        }
      } catch (err) {
        console.warn("Location acquisition notice:", err);
        setLocationStatus("denied");
      }
    }

    requestLocation();
  }, []);

  const handleLaunchCamera = async () => {
    if (images.length >= 8) {
      Alert.alert("Maximum Limit Reached", "You can upload a maximum of 8 property photos.");
      return;
    }

    try {
      setOpeningCamera(true);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Please grant camera access to photograph real property structures for field verification."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setImages((prev) => [...prev, dataUri]);
      }
    } catch (err: any) {
      console.error("Camera launch error:", err);
      Alert.alert("Camera Error", err?.message || "Failed to open device camera.");
    } finally {
      setOpeningCamera(false);
    }
  };

  const handlePickFromGallery = async () => {
    if (images.length >= 8) {
      Alert.alert("Maximum Limit Reached", "You can upload a maximum of 8 property photos.");
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant media library access to select property photos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setImages((prev) => [...prev, dataUri]);
      }
    } catch (err: any) {
      Alert.alert("Gallery Error", err?.message || "Failed to pick image from gallery.");
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
        geoTag: geoTag || undefined,
        location: geoTag
          ? {
              latitude: geoTag.latitude,
              longitude: geoTag.longitude,
              address: address.trim(),
            }
          : undefined,
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

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
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

        {/* Camera Action Card */}
        <View className="bg-white rounded-3xl p-5 border border-slate-200 items-center justify-center gap-3">
          <View className="w-16 h-16 rounded-full bg-emerald-50 items-center justify-center border border-emerald-200">
            <Camera size={32} color="#059669" />
          </View>

          <View className="items-center">
            <Text className="text-base font-bold text-slate-900">Take Property Photo</Text>
            <Text className="text-xs text-slate-500 text-center mt-1 px-4 leading-4.5">
              Click the button below to launch your device camera and capture clear views of the building facade, entrance, and surroundings.
            </Text>
          </View>

          {/* Primary Action Button: Open Camera */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleLaunchCamera}
            disabled={images.length >= 8 || openingCamera}
            className={`w-full h-12 bg-emerald-600 rounded-2xl flex-row items-center justify-center gap-2 mt-1 ${
              images.length >= 8 || openingCamera ? "opacity-50" : ""
            }`}
          >
            {openingCamera ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Camera size={18} color="#FFFFFF" />
                <Text className="text-white font-bold text-sm">
                  {images.length === 0 ? "Open Camera & Take Photo" : "Take Another Photo"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Secondary Action: Select from Gallery */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePickFromGallery}
            disabled={images.length >= 8 || openingCamera}
            className="flex-row items-center gap-1.5 py-1"
          >
            <ImageIcon size={14} color="#64748B" />
            <Text className="text-xs font-semibold text-slate-600">
              or select photo from gallery
            </Text>
          </TouchableOpacity>
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
                No photos taken yet. Tap the button above to launch your camera.
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
              {images.length < 8 && (
                <TouchableOpacity
                  onPress={handleLaunchCamera}
                  className="w-22 h-22 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 items-center justify-center gap-1"
                >
                  <Plus size={20} color="#059669" />
                  <Text className="text-[10px] font-bold text-emerald-700">Add More</Text>
                </TouchableOpacity>
              )}
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

            {/* Auto-detected GPS GeoTag Display */}
            <View className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 flex-row items-center justify-between mt-1">
              <View className="flex-row items-center gap-2 flex-1">
                <MapPin size={15} color={locationStatus === "granted" ? "#059669" : "#64748B"} />
                <View className="flex-1">
                  <Text className="text-[11px] font-bold text-slate-800">
                    {locationStatus === "granted" && geoTag
                      ? `GPS GeoTag: ${geoTag.latitude.toFixed(5)}, ${geoTag.longitude.toFixed(5)}`
                      : locationStatus === "requesting"
                      ? "Acquiring GPS fix (allow location permission)..."
                      : "Location permission denied (capturing without GPS tag)"}
                  </Text>
                  <Text className="text-[10px] text-slate-500">
                    {locationStatus === "granted" && geoTag
                      ? "Coordinates auto-captured & will be attached on submit"
                      : "Auto-detected from device GPS without manual input"}
                  </Text>
                </View>
              </View>
              {locationStatus === "granted" && geoTag && (
                <View className="bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Text className="text-[10px] font-bold text-emerald-800">Locked ✓</Text>
                </View>
              )}
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
