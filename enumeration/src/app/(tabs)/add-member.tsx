import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Building,
  Building2,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Sparkles,
  CheckCircle2,
  Search,
  Check,
  FileText,
  Calendar,
  ShieldCheck,
  ChevronDown,
  FileCheck,
  Hash,
  Landmark,
  AlertCircle,
  Plus,
  ExternalLink,
} from "lucide-react-native";
import * as Location from "expo-location";
import { Dialog } from "heroui-native";
import { useAuth } from "@/context/AuthContext";
import { enumeratorService } from "@/lib/services/enumeratorService";
import { SafeAreaView } from "react-native-safe-area-context";

// AMAC Municipal Categories matching Admin Registry
const CATEGORY_OPTIONS = [
  { value: "SHOP AND KIOSK ZONE A & B", label: "Shop and Kiosk Zone A & B", group: "Commercial & Retail" },
  { value: "SHOP AND KIOSK ZONE C", label: "Shop and Kiosk Zone C", group: "Commercial & Retail" },
  { value: "SHOP AND KIOSK ZONE D", label: "Shop and Kiosk Zone D", group: "Commercial & Retail" },
  { value: "AMAC MARKETS", label: "AMAC Municipal Markets", group: "Commercial & Retail" },
  { value: "HOTELS", label: "Hotels & Hospitality", group: "Hospitality & Food" },
  { value: "FOOD HANDLING", label: "Food Handling & Eateries", group: "Hospitality & Food" },
  { value: "LIQUOR", label: "Liquor & Entertainment", group: "Hospitality & Food" },
  { value: "BANKS", label: "Banks & Financial Institutions", group: "Corporate & Finance" },
  { value: "CORPORATE PARKING", label: "Corporate Parking Services", group: "Corporate & Finance" },
  { value: "FILING STATION", label: "Filing Station & Petroleum", group: "Energy & Utilities" },
  { value: "SIGN POST", label: "Sign Post & Outdoor Display", group: "Advert & Media" },
  { value: "MOBILE ADVERT", label: "Mobile Advert & Vehicles", group: "Advert & Media" },
  { value: "TV AND RADIO", label: "TV and Radio Broadcast", group: "Advert & Media" },
  { value: "SANITARY INSPECTION", label: "Sanitary Inspection & Waste", group: "Environmental" },
  { value: "HABITATION", label: "Habitation & Residential", group: "Residential" },
  { value: "TENEMENT RENT ZONE A", label: "Tenement Rent Zone A", group: "Tenement & Property" },
  { value: "TENEMENT RENT ZONE B", label: "Tenement Rent Zone B", group: "Tenement & Property" },
  { value: "TENEMENT RENT ZONE C", label: "Tenement Rent Zone C", group: "Tenement & Property" },
  { value: "TENEMENT RENT ZONE D", label: "Tenement Rent Zone D", group: "Tenement & Property" },
  { value: "MARRIAGE REGISTRY", label: "Marriage Registry Services", group: "Civic Services" },
];

const ZONES = ["A", "B", "C", "D", "E"];
const FREQUENCIES: Array<"MONTHLY" | "QUARTERLY" | "YEARLY"> = ["MONTHLY", "QUARTERLY", "YEARLY"];

const INDIVIDUAL_DOC_TYPES = [
  { value: "nin", label: "NIN (11 Digits)" },
  { value: "voters card", label: "Voter's Card (VIN)" },
  { value: "passport", label: "Int'l Passport" },
  { value: "drivers lincense", label: "Driver's License" },
];

export default function AddMemberScreen() {
  const router = useRouter();
  const { user, token, refreshDailyTasks } = useAuth();

  // Step 1: Classification & Frequency
  const [type, setType] = useState<"BUSINESS" | "INDIVIDUAL">("BUSINESS");
  const [category, setCategory] = useState("SHOP AND KIOSK ZONE A & B");
  const [zone, setZone] = useState(user?.zone || "A");
  const [billingFrequency, setBillingFrequency] = useState<"MONTHLY" | "QUARTERLY" | "YEARLY">("MONTHLY");

  // Step 2: Entity & Contact Details
  const [fullname, setFullname] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Step 3: Identity Document & BVN
  const [docType, setDocType] = useState("cac");
  const [docNumber, setDocNumber] = useState("");
  const [bvn, setBvn] = useState("");

  // Step 4: Property Selection from Council Registry
  const [properties, setProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [propertySearch, setPropertySearch] = useState("");

  // Step 5: Location Details
  const [address, setAddress] = useState("");
  const [nearestBusStop, setNearestBusStop] = useState("");
  const [city, setCity] = useState("Abuja Municipal Area Council");
  const [state, setState] = useState("Abuja");
  const [zipcode, setZipcode] = useState("900001");

  // Auto-captured GPS GeoTag without manual user input
  const [geoTag, setGeoTag] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    async function requestLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (pos?.coords) {
            setGeoTag({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          }
        }
      } catch (err) {
        console.warn("Location acquisition notice:", err);
      }
    }

    requestLocation();
  }, []);

  // Form Submission & Success State
  const [submitting, setSubmitting] = useState(false);
  const [registeredResult, setRegisteredResult] = useState<any | null>(null);

  // HeroUI Native Feedback Modal state (Success / Error)
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "error",
    title: "",
    message: "",
  });

  const showFeedback = (
    type: "success" | "error",
    title: string,
    message: string,
    onConfirm?: () => void
  ) => {
    setFeedbackModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
    });
  };

  // Sync docType when switching between Business and Individual
  useEffect(() => {
    if (type === "BUSINESS") {
      setDocType("cac");
    } else if (docType === "cac") {
      setDocType("nin");
    }
  }, [type]);

  // Load registered properties for the enumerator's center
  useEffect(() => {
    async function loadProps() {
      if (!token) return;
      setLoadingProperties(true);
      try {
        const res = await enumeratorService.getProperties(token);
        if (res.ok && Array.isArray(res.data)) {
          setProperties(res.data);
        }
      } catch (err) {
        console.warn("Failed to load properties:", err);
      } finally {
        setLoadingProperties(false);
      }
    }
    loadProps();
  }, [token]);

  const filteredProperties = useMemo(() => {
    if (!propertySearch.trim()) return properties;
    const q = propertySearch.toLowerCase().trim();
    return properties.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const pid = (p.pid || "").toLowerCase();
      const ptype = (p.type || "").toLowerCase();
      const addr = (p.address || p.location?.address || "").toLowerCase();
      return name.includes(q) || pid.includes(q) || ptype.includes(q) || addr.includes(q);
    });
  }, [properties, propertySearch]);

  const handleSelectProperty = (prop: any) => {
    setSelectedPropertyId(prop.id);
    const resolvedAddr = prop.address || prop.location?.address || "";
    if (resolvedAddr) {
      setAddress(resolvedAddr);
    }
  };

  const resetForm = () => {
    setType("BUSINESS");
    setFullname("");
    setBusinessName("");
    setEmail("");
    setPhone("");
    setDocType("cac");
    setDocNumber("");
    setBvn("");
    setSelectedPropertyId("");
    setPropertySearch("");
    setAddress("");
    setNearestBusStop("");
    setCity("Abuja Municipal Area Council");
    setState("Abuja");
    setZipcode("900001");
    setRegisteredResult(null);
  };

  const handleSubmit = async () => {
    // 1. Contact Person Validation
    if (!fullname.trim() || fullname.trim().length < 3) {
      showFeedback("error", "Required", "Please enter the full legal name of the taxpayer / representative (min 3 characters).");
      return;
    }

    // 2. Business Name Validation
    if (type === "BUSINESS" && (!businessName.trim() || businessName.trim().length < 2)) {
      showFeedback("error", "Required", "Please enter the registered business / enterprise name.");
      return;
    }

    // 3. Email Validation
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showFeedback("error", "Required", "Please provide a valid official email address.");
      return;
    }

    // 4. Phone Validation
    const cleanPhone = phone.replace(/[^0-9+]/g, "").trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      showFeedback("error", "Required", "Please enter a valid phone number (at least 10 digits).");
      return;
    }

    // 5. Document Number Validation
    if (!docNumber.trim() || docNumber.trim().length < 3) {
      showFeedback(
        "error",
        "Identification Required",
        type === "BUSINESS"
          ? "Please provide the official CAC Registration Number (RC/BN)."
          : "Please enter the valid identification document number."
      );
      return;
    }

    // If individual doc is NIN, require 11 digits
    if (type === "INDIVIDUAL" && docType === "nin" && !/^\d{11}$/.test(docNumber.trim())) {
      showFeedback("error", "Invalid NIN", "National Identity Number (NIN) must be exactly 11 numeric digits.");
      return;
    }

    // 6. BVN Validation
    const cleanBvn = bvn.replace(/[^0-9]/g, "").trim();
    if (!cleanBvn || cleanBvn.length !== 11 || !/^\d{11}$/.test(cleanBvn)) {
      showFeedback(
        "error",
        "Compulsory BVN",
        "An 11-digit Bank Verification Number (BVN) is compulsory for automated municipal revenue wallet creation."
      );
      return;
    }

    // 7. Property Selection Validation
    if (!selectedPropertyId) {
      showFeedback(
        "error",
        "Select Property",
        "Please select a registered premises/property occupied by this entity from the council directory."
      );
      return;
    }

    // 8. Address Validation
    if (!address.trim() || address.trim().length < 5) {
      showFeedback("error", "Required", "Please enter the detailed physical street address of the premises.");
      return;
    }

    if (!token) {
      showFeedback("error", "Error", "Session invalid. Please sign in again.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedProp = properties.find((p) => p.id === selectedPropertyId);
      const payload: any = {
        fullname: fullname.trim(),
        businessName: type === "BUSINESS" ? businessName.trim() : (businessName.trim() || undefined),
        type,
        category,
        zone,
        billingFrequency,
        center: user?.center || "AMAC Central",
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        bvn: cleanBvn,
        document: {
          type: type === "BUSINESS" ? "cac" : docType,
          number: docNumber.trim(),
          bvn: cleanBvn,
          data: { bvn: cleanBvn },
        },
        location: {
          address: address.trim(),
          nearestBusStop: nearestBusStop.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          zipcode: zipcode.trim() || "900001",
          latitude: geoTag?.latitude,
          longitude: geoTag?.longitude,
        },
        geoTag: geoTag || undefined,
        property: selectedProp
          ? {
              id: selectedProp.id,
              pid: selectedProp.pid,
              name: selectedProp.name,
              type: selectedProp.type,
              size: selectedProp.size,
              address: selectedProp.address || address.trim(),
              location: {
                address: address.trim(),
                nearestBusStop: nearestBusStop.trim() || undefined,
                city: city.trim(),
                state: state.trim(),
                zipcode: zipcode.trim() || "900001",
                latitude: geoTag?.latitude,
                longitude: geoTag?.longitude,
              },
              geoTag: geoTag || selectedProp.geoTag,
              center: user?.center || selectedProp.center,
              zone: zone || selectedProp.zone || "A",
              images: Array.isArray(selectedProp.images) ? selectedProp.images : [],
            }
          : undefined,
        enumeratorId: user?.uid,
        supervisorId: user?.supervisorId,
        password: `Amac@${cleanPhone.slice(-4)}`,
      };

      const res = await enumeratorService.registerMember(payload, token);
      if (res.ok) {
        const createdData = res.data || res.message || payload;
        const newResult = {
          uid: (res as any).member?.uid || (res as any).data?.uid || `MEB-${Date.now().toString().slice(-6)}`,
          name: type === "BUSINESS" ? businessName.trim() : fullname.trim(),
          contact: fullname.trim(),
          type,
          category,
          docType: type === "BUSINESS" ? "CAC" : docType.toUpperCase(),
          docNumber: docNumber.trim(),
          propertyName: selectedProp?.name || "Council Premises",
          phone: cleanPhone,
        };
        refreshDailyTasks();
        showFeedback(
          "success",
          "Entity Registered Successfully!",
          `Enrolled ${newResult.name} with ID ${newResult.uid}. ₦50 reward pending supervisor review.`,
          () => {
            setRegisteredResult(newResult);
          }
        );
      } else {
        showFeedback("error", "Registration Failed", res.message || "Failed to register entity.");
      }
    } catch (err: any) {
      showFeedback("error", "Error", err?.message || "Failed to register entity. Please verify all inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS REGISTRATION VIEW
  if (registeredResult) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ScrollView contentContainerClassName="p-4 gap-4" keyboardShouldPersistTaps="handled">
          <View className="bg-white rounded-3xl p-6 border border-emerald-300 items-center text-center">
            <View className="h-16 w-16 rounded-full bg-emerald-100 items-center justify-center border border-emerald-200 mb-3">
              <CheckCircle2 size={36} color="#059669" />
            </View>

            <View className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex-row items-center gap-1.5 mb-2">
              <Sparkles size={13} color="#059669" />
              <Text className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                Entity Registered Successfully
              </Text>
            </View>

            <Text className="text-xl font-black text-slate-900 text-center">
              Added to AMAC Municipal Registry
            </Text>
            <Text className="text-xs text-slate-500 text-center mt-1">
              Statutory taxpayer entity and revenue wallet have been provisioned in the system.
            </Text>

            {/* Assigned UID Card */}
            <View className="w-full bg-emerald-50 rounded-2xl p-4 border border-emerald-200 mt-4">
              <Text className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Assigned Taxpayer UID
              </Text>
              <Text className="text-xl font-black text-emerald-950 font-mono mt-1">
                {registeredResult.uid}
              </Text>
            </View>

            {/* Summary Details */}
            <View className="w-full bg-slate-50 rounded-2xl p-3.5 border border-slate-200 mt-3 gap-2">
              <View className="flex-row justify-between items-center py-1 border-b border-slate-200">
                <Text className="text-[11px] text-slate-500">Business / Entity</Text>
                <Text className="text-[11px] font-bold text-slate-800">{registeredResult.name}</Text>
              </View>
              <View className="flex-row justify-between items-center py-1 border-b border-slate-200">
                <Text className="text-[11px] text-slate-500">Contact Person</Text>
                <Text className="text-[11px] font-bold text-slate-800">{registeredResult.contact}</Text>
              </View>
              <View className="flex-row justify-between items-center py-1 border-b border-slate-200">
                <Text className="text-[11px] text-slate-500">Document ({registeredResult.docType})</Text>
                <Text className="text-[11px] font-bold text-slate-800">{registeredResult.docNumber}</Text>
              </View>
              <View className="flex-row justify-between items-center py-1 border-b border-slate-200">
                <Text className="text-[11px] text-slate-500">Occupied Property</Text>
                <Text className="text-[11px] font-bold text-slate-800">{registeredResult.propertyName}</Text>
              </View>
              <View className="flex-row justify-between items-center py-1">
                <Text className="text-[11px] text-slate-500">Category & Zone</Text>
                <Text className="text-[11px] font-bold text-slate-800">{registeredResult.category} (Zone {zone})</Text>
              </View>
            </View>

            {/* Reward Notification Banner */}
            <View className="w-full flex-row items-center gap-2 bg-emerald-50 rounded-xl p-3 border border-emerald-200 mt-3">
              <Sparkles size={16} color="#059669" />
              <Text className="flex-1 text-xs text-emerald-900 leading-4 font-medium">
                ₦50 reward has been queued for verification into your revenue ledger.
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="w-full gap-2.5 mt-5">
              <TouchableOpacity
                activeOpacity={0.8}
                className="w-full bg-emerald-600 h-12 rounded-2xl items-center justify-center flex-row gap-2"
                onPress={resetForm}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold">Register Another Taxpayer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                className="w-full bg-slate-100 h-11 rounded-2xl items-center justify-center border border-slate-300"
                onPress={() => {
                  resetForm();
                  router.replace("/(tabs)");
                }}
              >
                <Text className="text-slate-700 text-xs font-bold">Return to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerClassName="p-4 gap-4" keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View className="mb-0.5">
            <Text className="text-xl font-black text-slate-900">Add Taxpayer / Entity</Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              Complete municipal taxpayer registration, statutory document, and premises linkage
            </Text>
          </View>

          {/* Active Revenue Center Badge */}
          <View className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5 flex-1">
              <View className="h-8 w-8 rounded-lg bg-emerald-600 items-center justify-center">
                <ShieldCheck size={18} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-slate-500 uppercase">Active Center</Text>
                <Text className="text-xs font-bold text-slate-900" numberOfLines={1}>
                  {user?.center || "AMAC Secretariat Central"}
                </Text>
              </View>
            </View>
            <View className="bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
              <Text className="text-[10px] font-bold text-emerald-800">Zone {zone}</Text>
            </View>
          </View>

          {/* SECTION 1: CLASSIFICATION & TYPE */}
          <View className="bg-white rounded-3xl p-4 border border-slate-200 gap-3">
            <View className="flex-row items-center gap-1.5 border-b border-slate-100 pb-2">
              <Text className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                1. Classification & Frequency
              </Text>
            </View>

            {/* Type Selector (Individual / Business) */}
            <View className="flex-row bg-slate-100 rounded-2xl p-1 gap-1">
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl gap-1.5 border ${
                  type === "BUSINESS" ? "bg-white border-emerald-500" : "border-transparent"
                }`}
                onPress={() => setType("BUSINESS")}
              >
                <Building size={16} color={type === "BUSINESS" ? "#059669" : "#64748B"} />
                <Text
                  className={`text-xs font-semibold ${
                    type === "BUSINESS" ? "text-emerald-700 font-bold" : "text-slate-500"
                  }`}
                >
                  Business / Enterprise
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl gap-1.5 border ${
                  type === "INDIVIDUAL" ? "bg-white border-emerald-500" : "border-transparent"
                }`}
                onPress={() => setType("INDIVIDUAL")}
              >
                <User size={16} color={type === "INDIVIDUAL" ? "#059669" : "#64748B"} />
                <Text
                  className={`text-xs font-semibold ${
                    type === "INDIVIDUAL" ? "text-emerald-700 font-bold" : "text-slate-500"
                  }`}
                >
                  Individual Citizen
                </Text>
              </TouchableOpacity>
            </View>

            {/* Economic Category Selector */}
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-slate-700">
                Revenue Category <Text className="text-red-500">*</Text>
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {CATEGORY_OPTIONS.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    className={`px-3 py-2 rounded-xl border mr-2 ${
                      category === cat.value
                        ? "bg-emerald-50 border-emerald-500"
                        : "bg-slate-50 border-slate-200"
                    }`}
                    onPress={() => setCategory(cat.value)}
                  >
                    <Text
                      className={`text-xs ${
                        category === cat.value ? "text-emerald-700 font-bold" : "text-slate-600 font-medium"
                      }`}
                    >
                      {cat.label}
                    </Text>
                    <Text className="text-[10px] text-slate-400 mt-0.5">{cat.group}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Rating Zone & Assessment Frequency in 2 cols */}
            <View className="flex-col gap-3">
              {/* Rating Zone */}
              <View className="flex-1 gap-1.5">
                <Text className="text-xs font-semibold text-slate-700">Zone</Text>
                <View className="flex-row gap-1">
                  {ZONES.map((z) => (
                    <TouchableOpacity
                      key={z}
                      className={`flex-1 items-center justify-center py-2 rounded-xl border ${
                        zone === z
                          ? "bg-emerald-50 border-emerald-600"
                          : "bg-slate-50 border-slate-200"
                      }`}
                      onPress={() => setZone(z)}
                    >
                      <Text
                        className={`text-xs ${
                          zone === z ? "text-emerald-700 font-bold" : "text-slate-500 font-semibold"
                        }`}
                      >
                        {z}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Assessment Frequency */}
              <View className="flex-1 gap-1.5">
                <Text className="text-xs font-semibold text-slate-700">Billing Schedule</Text>
                <View className="flex-row gap-1">
                  {FREQUENCIES.map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      className={`flex-1 items-center justify-center py-2 rounded-xl border ${
                        billingFrequency === freq
                          ? "bg-emerald-50 border-emerald-600"
                          : "bg-slate-50 border-slate-200"
                      }`}
                      onPress={() => setBillingFrequency(freq)}
                    >
                      <Text
                        className={`text-[10px] font-bold capitalize ${
                          billingFrequency === freq ? "text-emerald-800" : "text-slate-500"
                        }`}
                        numberOfLines={1}
                      >
                        {freq.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* SECTION 2: ENTITY & CONTACT DETAILS */}
          <View className="bg-white rounded-3xl p-4 border border-slate-200 gap-3">
            <View className="flex-row items-center gap-1.5 border-b border-slate-100 pb-2">
              <Text className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                2. Contact & Entity Information
              </Text>
            </View>

            {/* Contact Person Name */}
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-slate-700">
                {type === "BUSINESS" ? "Representative / Proprietor Name *" : "Full Legal Name *"}
              </Text>
              <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-300 px-3">
                <User size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 h-11 text-xs text-slate-900"
                  placeholder="e.g. Alhaji Ibrahim Musa"
                  placeholderTextColor="#94A3B8"
                  value={fullname}
                  onChangeText={setFullname}
                />
              </View>
            </View>

            {/* Business Name (for Business) */}
            {type === "BUSINESS" && (
              <View className="gap-1.5">
                <Text className="text-xs font-semibold text-slate-700">
                  Registered Business / Enterprise Name <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-300 px-3">
                  <Building size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput
                    className="flex-1 h-11 text-xs text-slate-900"
                    placeholder="e.g. Musa & Sons Global Ltd"
                    placeholderTextColor="#94A3B8"
                    value={businessName}
                    onChangeText={setBusinessName}
                  />
                </View>
              </View>
            )}

            {/* Email Address */}
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-slate-700">
                Official Email Address <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-300 px-3">
                <Mail size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 h-11 text-xs text-slate-900"
                  placeholder="e.g. entity@gmail.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone Number */}
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-slate-700">
                Phone Number <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-300 px-3">
                <Phone size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 h-11 text-xs text-slate-900"
                  placeholder="e.g. 08031234567"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>
            </View>
          </View>

          {/* SECTION 3: STATUTORY DOCUMENT & BVN */}
          <View className="bg-white rounded-3xl p-4 border border-slate-200 gap-3">
            <View className="flex-row items-center gap-1.5 border-b border-slate-100 pb-2">
              <Text className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                3. Statutory Document & BVN
              </Text>
            </View>

            {/* Document Selection */}
            {type === "BUSINESS" ? (
              <View className="gap-1.5">
                <Text className="text-xs font-semibold text-slate-700">
                  Document Type (Corporate Affairs Commission)
                </Text>
                <View className="bg-slate-100 rounded-xl border border-slate-200 px-3 py-2.5 flex-row items-center gap-2">
                  <FileCheck size={16} color="#059669" />
                  <Text className="text-xs font-semibold text-slate-800">
                    CAC Registration Certificate (RC / BN)
                  </Text>
                </View>
              </View>
            ) : (
              <View className="gap-1.5">
                <Text className="text-xs font-semibold text-slate-700">
                  Identification Document Type <Text className="text-red-500">*</Text>
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                  {INDIVIDUAL_DOC_TYPES.map((dt) => (
                    <TouchableOpacity
                      key={dt.value}
                      className={`px-3 py-2 rounded-xl border mr-2 ${
                        docType === dt.value
                          ? "bg-emerald-50 border-emerald-500"
                          : "bg-slate-50 border-slate-200"
                      }`}
                      onPress={() => setDocType(dt.value)}
                    >
                      <Text
                        className={`text-xs ${
                          docType === dt.value ? "text-emerald-700 font-bold" : "text-slate-600 font-medium"
                        }`}
                      >
                        {dt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Document Number Input */}
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-slate-700">
                {type === "BUSINESS"
                  ? "CAC Registration Number (RC / BN) *"
                  : docType === "nin"
                  ? "National Identity Number (NIN - 11 Digits) *"
                  : "Document Identification Number *"}
              </Text>
              <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-300 px-3">
                <Hash size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 h-11 text-xs text-slate-900 font-mono"
                  placeholder={
                    type === "BUSINESS"
                      ? "e.g. RC-1849201 or BN-2938102"
                      : docType === "nin"
                      ? "11-digit NIN"
                      : "e.g. A12345678"
                  }
                  placeholderTextColor="#94A3B8"
                  value={docNumber}
                  onChangeText={setDocNumber}
                  maxLength={docType === "nin" ? 11 : 30}
                  keyboardType={docType === "nin" ? "number-pad" : "default"}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* BVN (COMPULSORY FOR WALLET) */}
            <View className="gap-1.5">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs font-semibold text-slate-700">
                  Bank Verification Number (BVN) <Text className="text-red-500">*</Text>
                </Text>
                <Text
                  className={`text-[11px] font-bold ${
                    bvn.length === 11 ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {bvn.length} / 11 digits
                </Text>
              </View>
              <View
                className={`flex-row items-center bg-slate-50 rounded-xl border px-3 ${
                  bvn.length === 11 ? "border-emerald-600" : "border-slate-300"
                }`}
              >
                <CreditCard size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 h-11 text-xs text-slate-900 font-mono"
                  placeholder="11-digit BVN (Compulsory for Wallet)"
                  placeholderTextColor="#94A3B8"
                  value={bvn}
                  onChangeText={(val) => setBvn(val.replace(/[^0-9]/g, "").slice(0, 11))}
                  keyboardType="number-pad"
                  maxLength={11}
                />
              </View>
              <Text className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                * Compulsory for instant automated municipal revenue wallet creation.
              </Text>
            </View>
          </View>

          {/* SECTION 4: SELECT PROPERTY FROM COUNCIL REGISTRY */}
          <View className="bg-white rounded-3xl p-4 border border-slate-200 gap-3">
            <View className="flex-row justify-between items-center border-b border-slate-100 pb-2">
              <Text className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                4. Select Council Property <Text className="text-red-500">*</Text>
              </Text>
              <Text className="text-[11px] text-slate-500 font-semibold">
                {filteredProperties.length} available
              </Text>
            </View>

            {/* Mini Search Bar */}
            <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-300 px-3 h-10">
              <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                className="flex-1 h-full text-xs text-slate-900"
                placeholder="Search property by name, PID, address..."
                placeholderTextColor="#94A3B8"
                value={propertySearch}
                onChangeText={setPropertySearch}
                autoCapitalize="none"
              />
              {propertySearch.length > 0 && (
                <TouchableOpacity onPress={() => setPropertySearch("")}>
                  <Text className="text-[11px] text-emerald-600 font-semibold">Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Scrollable Property Cards Container */}
            <View className="bg-slate-50 rounded-2xl border border-slate-200 p-2">
              {loadingProperties ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="small" color="#059669" />
                  <Text className="text-xs text-slate-500 mt-1.5">Loading council properties...</Text>
                </View>
              ) : filteredProperties.length === 0 ? (
                <View className="py-5 items-center">
                  <Building2 size={28} color="#CBD5E1" />
                  <Text className="text-xs font-semibold text-slate-500 mt-1">
                    {propertySearch ? "No matching properties found" : "No properties loaded"}
                  </Text>
                </View>
              ) : (
                <ScrollView
                  nestedScrollEnabled={true}
                  style={{ maxHeight: 220 }}
                  contentContainerClassName="gap-2 p-0.5"
                  showsVerticalScrollIndicator={true}
                >
                  {filteredProperties.map((p) => {
                    const isSelected = selectedPropertyId === p.id;
                    const pAddress = p.address || p.location?.address || "AMAC Municipal";
                    return (
                      <TouchableOpacity
                        key={p.id}
                        activeOpacity={0.7}
                        className={`rounded-xl border p-2.5 flex-row items-center gap-2.5 ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50"
                            : "bg-white border-slate-200"
                        }`}
                        onPress={() => handleSelectProperty(p)}
                      >
                        <View className="flex-1">
                          <View className="flex-row items-center gap-1.5 flex-wrap">
                            <Text
                              className={`text-xs font-bold ${
                                isSelected ? "text-emerald-950 font-extrabold" : "text-slate-900"
                              }`}
                            >
                              {p.name}
                            </Text>
                            {p.pid && (
                              <View className="bg-emerald-100 px-1.5 py-0.5 rounded-md">
                                <Text className="text-[10px] font-bold text-emerald-800">{p.pid}</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-[11px] text-slate-500 mt-0.5">
                            {p.type || "Commercial"} • {p.size || "Standard"}
                          </Text>
                          <View className="flex-row items-center gap-1 mt-0.5">
                            <MapPin size={11} color="#94A3B8" />
                            <Text className="text-[11px] text-slate-500 flex-1" numberOfLines={1}>
                              {pAddress}
                            </Text>
                          </View>
                        </View>

                        <View
                          className={`w-5 h-5 rounded-full border items-center justify-center ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-600"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Selected Property confirmation */}
            {selectedPropertyId && (
              <View className="flex-row items-center gap-1.5 bg-emerald-50 px-2.5 py-2 rounded-xl border border-emerald-200">
                <CheckCircle2 size={16} color="#059669" />
                <Text className="text-[11px] font-bold text-emerald-900 flex-1" numberOfLines={1}>
                  Selected: {properties.find((p) => p.id === selectedPropertyId)?.name}
                </Text>
              </View>
            )}
          </View>

          {/* SECTION 5: DETAILED LOCATION & PREMISES */}
          <View className="bg-white rounded-3xl p-4 border border-slate-200 gap-3">
            <View className="flex-row items-center gap-1.5 border-b border-slate-100 pb-2">
              <Text className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                5. Location & Premises Details
              </Text>
            </View>

            {/* Detailed Address */}
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-slate-700">
                Detailed Premises Address <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-300 px-3">
                <MapPin size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 h-11 text-xs text-slate-900"
                  placeholder="e.g. Suite 12, Area 1 Shopping Complex, Garki"
                  placeholderTextColor="#94A3B8"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>

            {/* Nearest Bus Stop / Landmark */}
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-slate-700">
                Nearest Bus Stop / Landmark
              </Text>
              <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-300 px-3">
                <Landmark size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 h-11 text-xs text-slate-900"
                  placeholder="e.g. Opp. NNPC Towers, Area 11 Junction"
                  placeholderTextColor="#94A3B8"
                  value={nearestBusStop}
                  onChangeText={setNearestBusStop}
                />
              </View>
            </View>

            {/* LGA / City & State in 2 cols */}
            <View className="flex-row gap-3">
              <View className="flex-1 gap-1.5">
                <Text className="text-xs font-semibold text-slate-700">LGA / City</Text>
                <TextInput
                  className="h-11 bg-slate-50 rounded-xl border border-slate-300 px-3 text-xs text-slate-900"
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View className="flex-1 gap-1.5">
                <Text className="text-xs font-semibold text-slate-700">State / Territory</Text>
                <TextInput
                  className="h-11 bg-slate-50 rounded-xl border border-slate-300 px-3 text-xs text-slate-900"
                  value={state}
                  onChangeText={setState}
                />
              </View>
            </View>

            {/* Zipcode */}
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-slate-700">Postal / Zip Code</Text>
              <TextInput
                className="h-11 bg-slate-50 rounded-xl border border-slate-300 px-3 text-xs text-slate-900 font-mono"
                placeholder="e.g. 900001"
                placeholderTextColor="#94A3B8"
                value={zipcode}
                onChangeText={setZipcode}
                keyboardType="number-pad"
              />
            </View>

            {/* Auto-detected GPS GeoTag Display */}
            <View className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 flex-1">
                <MapPin size={15} color={geoTag ? "#059669" : "#64748B"} />
                <View className="flex-1">
                  <Text className="text-[11px] font-bold text-slate-800">
                    {geoTag
                      ? `GPS GeoTag: ${geoTag.latitude.toFixed(5)}, ${geoTag.longitude.toFixed(5)}`
                      : "Acquiring GPS fix (allow location permission)..."}
                  </Text>
                  <Text className="text-[10px] text-slate-500">
                    {geoTag
                      ? "Coordinates auto-attached to premises without manual input"
                      : "Auto-detected from device GPS"}
                  </Text>
                </View>
              </View>
              {geoTag && (
                <View className="bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Text className="text-[10px] font-bold text-emerald-800">Locked ✓</Text>
                </View>
              )}
            </View>
          </View>

          {/* Reward Notice */}
          <View className="flex-row items-center gap-2 bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200">
            <Sparkles size={18} color="#059669" />
            <Text className="flex-1 text-xs text-emerald-900 leading-4">
              Registering an entity pays <Text className="font-extrabold">₦50</Text> reward into your revenue wallet upon supervisor verification.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            className={`bg-emerald-600 h-13 rounded-2xl items-center justify-center mb-6 ${
              submitting ? "opacity-50" : ""
            }`}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-sm font-bold">
                Register Entity & Provision Wallet
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* HeroUI Native Feedback Modal (Success / Error) */}
      <Dialog
        isOpen={feedbackModal.isOpen}
        onOpenChange={(open) => {
          if (!open && feedbackModal.onConfirm) {
            feedbackModal.onConfirm();
          }
          setFeedbackModal((prev) => ({ ...prev, isOpen: open }));
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="bg-black/50" />
          <Dialog.Content className="mx-4 p-5 bg-white rounded-3xl border border-slate-200 max-w-sm">
            <View className="items-center text-center">
              <View
                className={`w-14 h-14 rounded-full items-center justify-center mb-3 border ${
                  feedbackModal.type === "success"
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                {feedbackModal.type === "success" ? (
                  <CheckCircle2 size={30} color="#059669" />
                ) : (
                  <AlertCircle size={30} color="#DC2626" />
                )}
              </View>

              <Dialog.Title className="text-base font-bold text-slate-900 text-center">
                {feedbackModal.title}
              </Dialog.Title>

              <Dialog.Description className="text-xs text-slate-500 text-center mt-2 leading-5">
                {feedbackModal.message}
              </Dialog.Description>

              <TouchableOpacity
                activeOpacity={0.85}
                className={`w-full h-11 rounded-xl items-center justify-center mt-5 ${
                  feedbackModal.type === "success" ? "bg-emerald-600" : "bg-slate-900"
                }`}
                onPress={() => {
                  const onConfirm = feedbackModal.onConfirm;
                  setFeedbackModal((prev) => ({ ...prev, isOpen: false }));
                  if (onConfirm) {
                    onConfirm();
                  }
                }}
              >
                <Text className="text-white text-xs font-bold">
                  {feedbackModal.type === "success" ? "Continue" : "Dismiss"}
                </Text>
              </TouchableOpacity>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </SafeAreaView>
  );
}
