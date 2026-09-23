import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Building,
  Building2,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Search,
  Check,
  CheckCircle2,
} from "lucide-react-native";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { createMember, getProperties } from "@/lib/services/member";

const ZONES = ["A", "B", "C", "D", "E"];
const CATEGORIES = [
  "Commerce & Retail",
  "Hospitality & Tourism",
  "Transport & Logistics",
  "Professional Services",
  "Artisans & Crafts",
  "Manufacturing & Mining",
];

export default function AgentAddEntityScreen() {
  const router = useRouter();
  const { currentUser, token } = useAuth();
  const { success, failed } = useToast();

  const [type, setType] = useState<"INDIVIDUAL" | "BUSINESS">("BUSINESS");
  const [fullname, setFullname] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bvn, setBvn] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("Commerce & Retail");
  const [zone, setZone] = useState("A");

  const [properties, setProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [propertySearch, setPropertySearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadProps() {
      setLoadingProperties(true);
      try {
        const res = await getProperties(token as string);
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

  const handleSubmit = async () => {
    if (!fullname.trim()) {
      failed("Please enter the contact person or taxpayer full legal name.");
      return;
    }
    if (type === "BUSINESS" && !businessName.trim()) {
      failed("Please enter the registered enterprise name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      failed("Please provide a valid official email address.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      failed("Please enter a valid phone number (at least 10 digits).");
      return;
    }
    if (!bvn.trim() || bvn.trim().length !== 11 || !/^\d{11}$/.test(bvn.trim())) {
      failed("An 11-digit Bank Verification Number (BVN) is compulsory for virtual wallet generation.");
      return;
    }
    if (!selectedPropertyId) {
      failed("Please select a registered premises/property from the list.");
      return;
    }
    if (!address.trim()) {
      failed("Please enter the street premises address.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedProp = properties.find((p) => p.id === selectedPropertyId);
      const payload = {
        fullname: fullname.trim(),
        businessName: type === "BUSINESS" ? businessName.trim() : undefined,
        type,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        bvn: bvn.trim(),
        category,
        zone,
        center: (currentUser as any)?.center || "AMAC Central",
        agent: currentUser?.uid || currentUser?.id,
        location: {
          address: address.trim(),
          city: "Abuja",
          state: "FCT",
        },
        property: selectedProp
          ? {
              id: selectedProp.id,
              pid: selectedProp.pid,
              name: selectedProp.name,
              type: selectedProp.type,
              size: selectedProp.size,
              address: selectedProp.address || address.trim(),
              images: Array.isArray(selectedProp.images) ? selectedProp.images : [],
            }
          : undefined,
        password: `Amac@${phone.trim().slice(-4)}`,
      };

      const res = await createMember(payload, token as string);
      if (res?.ok || res?.member) {
        success("Entity registered successfully with automated wallet provisioned!");
        setFullname("");
        setBusinessName("");
        setEmail("");
        setPhone("");
        setBvn("");
        setAddress("");
        setSelectedPropertyId("");
        setPropertySearch("");
        router.back();
      } else {
        failed(res?.message || "Failed to register entity.");
      }
    } catch (err: any) {
      failed(err?.message || "Failed to register entity. Please check details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Navigation Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>Add Taxpayer / Entity</Text>
            <Text style={styles.screenSubtitle}>
              Register a taxpayer under your agent coverage
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Classification Toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, type === "BUSINESS" && styles.toggleBtnActive]}
              onPress={() => setType("BUSINESS")}
            >
              <Building size={16} color={type === "BUSINESS" ? "#0ea360" : "#64748B"} />
              <Text style={[styles.toggleBtnText, type === "BUSINESS" && styles.toggleBtnTextActive]}>
                Business Entity
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, type === "INDIVIDUAL" && styles.toggleBtnActive]}
              onPress={() => setType("INDIVIDUAL")}
            >
              <User size={16} color={type === "INDIVIDUAL" ? "#0ea360" : "#64748B"} />
              <Text style={[styles.toggleBtnText, type === "INDIVIDUAL" && styles.toggleBtnTextActive]}>
                Individual Taxpayer
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Contact Full Name <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <User size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Alhaji Ibrahim Musa"
                  placeholderTextColor="#94A3B8"
                  value={fullname}
                  onChangeText={setFullname}
                />
              </View>
            </View>

            {/* Business Name (if Business) */}
            {type === "BUSINESS" && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Enterprise / Company Name <Text style={{ color: "#EF4444" }}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Building size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Summit Logistics Global Ltd"
                    placeholderTextColor="#94A3B8"
                    value={businessName}
                    onChangeText={setBusinessName}
                  />
                </View>
              </View>
            )}

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Official Email Address <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. info@company.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Phone Number <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Phone size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 08031234567"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>
            </View>

            {/* BVN (COMPULSORY FOR WALLET) */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.label}>
                  Bank Verification Number (BVN) <Text style={{ color: "#EF4444" }}>*</Text>
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: bvn.length === 11 ? "#0ea360" : "#D97706",
                  }}
                >
                  {bvn.length} / 11 digits
                </Text>
              </View>
              <View style={[styles.inputWrapper, bvn.length === 11 && { borderColor: "#0ea360" }]}>
                <CreditCard size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  placeholder="11-digit BVN (Compulsory for Wallet)"
                  placeholderTextColor="#94A3B8"
                  value={bvn}
                  onChangeText={setBvn}
                  keyboardType="number-pad"
                  maxLength={11}
                />
              </View>
              <Text style={styles.bvnHint}>
                * Compulsory for automated virtual wallet provisioning & verification.
              </Text>
            </View>

            {/* Select Property from Council Registry */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.label}>
                  Select Property / Premises <Text style={{ color: "#EF4444" }}>*</Text>
                </Text>
                <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "600" }}>
                  {filteredProperties.length} available
                </Text>
              </View>

              {/* Mini Search Bar */}
              <View style={styles.searchBar}>
                <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search property by name, PID, address..."
                  placeholderTextColor="#94A3B8"
                  value={propertySearch}
                  onChangeText={setPropertySearch}
                  autoCapitalize="none"
                />
                {propertySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setPropertySearch("")}>
                    <Text style={{ fontSize: 11, color: "#0ea360", fontWeight: "600" }}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Scrollable Property Cards Container */}
              <View style={styles.propertyScrollContainer}>
                {loadingProperties ? (
                  <View style={{ paddingVertical: 24, alignItems: "center" }}>
                    <ActivityIndicator size="small" color="#0ea360" />
                    <Text style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>
                      Loading registered properties...
                    </Text>
                  </View>
                ) : filteredProperties.length === 0 ? (
                  <View style={{ paddingVertical: 20, alignItems: "center" }}>
                    <Building2 size={28} color="#CBD5E1" />
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#64748B", marginTop: 4 }}>
                      {propertySearch ? "No matching properties found" : "No properties loaded"}
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    nestedScrollEnabled={true}
                    style={{ maxHeight: 220 }}
                    contentContainerStyle={{ gap: 8, padding: 2 }}
                    showsVerticalScrollIndicator={true}
                  >
                    {filteredProperties.map((p) => {
                      const isSelected = selectedPropertyId === p.id;
                      const pAddress = p.address || p.location?.address || "AMAC Municipal";
                      return (
                        <TouchableOpacity
                          key={p.id}
                          activeOpacity={0.7}
                          style={[
                            styles.propertyCard,
                            isSelected && styles.propertyCardSelected,
                          ]}
                          onPress={() => handleSelectProperty(p)}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <Text style={[styles.propertyName, isSelected && { color: "#065F46" }]}>
                                {p.name}
                              </Text>
                              {p.pid && (
                                <View style={styles.pidBadge}>
                                  <Text style={styles.pidBadgeText}>{p.pid}</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.propertyMeta}>
                              {p.type || "Commercial"} • {p.size || "Standard"}
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                              <MapPin size={11} color="#94A3B8" />
                              <Text style={styles.propertyAddress} numberOfLines={1}>
                                {pAddress}
                              </Text>
                            </View>
                          </View>

                          <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
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
                <View style={styles.selectedConfirmBox}>
                  <CheckCircle2 size={16} color="#0ea360" />
                  <Text style={styles.selectedConfirmText} numberOfLines={1}>
                    Selected: {properties.find((p) => p.id === selectedPropertyId)?.name}
                  </Text>
                </View>
              )}
            </View>

            {/* Physical Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Physical Premises Address <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <MapPin size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Suite 12, Area 1 Shopping Complex, Garki"
                  placeholderTextColor="#94A3B8"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Sector / Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, category === cat && styles.chipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Zone Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>AMAC Revenue Zone</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {ZONES.map((z) => (
                  <TouchableOpacity
                    key={z}
                    style={[styles.zoneBtn, zone === z && styles.zoneBtnActive]}
                    onPress={() => setZone(z)}
                  >
                    <Text style={[styles.zoneBtnText, zone === z && styles.zoneBtnTextActive]}>
                      Zone {z}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Register Entity & Create Wallet</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  screenSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  container: {
    padding: 16,
    gap: 16,
  },
  typeToggle: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  toggleBtnTextActive: {
    color: "#0ea360",
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 13,
    color: "#0F172A",
  },
  bvnHint: {
    fontSize: 11,
    color: "#0ea360",
    marginTop: 2,
    fontWeight: "500",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 12,
    color: "#0F172A",
  },
  propertyScrollContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 8,
    marginTop: 4,
  },
  propertyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  propertyCardSelected: {
    borderColor: "#0ea360",
    backgroundColor: "#ECFDF5",
  },
  propertyName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  pidBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pidBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0369A1",
  },
  propertyMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  propertyAddress: {
    fontSize: 11,
    color: "#64748B",
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  radioCircleSelected: {
    borderColor: "#0ea360",
    backgroundColor: "#0ea360",
  },
  selectedConfirmBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  selectedConfirmText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065F46",
    flex: 1,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
  },
  chipText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#0ea360",
    fontWeight: "700",
  },
  zoneBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  zoneBtnActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#0ea360",
  },
  zoneBtnText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  zoneBtnTextActive: {
    color: "#0ea360",
    fontWeight: "700",
  },
  submitBtn: {
    backgroundColor: "#0ea360",
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
