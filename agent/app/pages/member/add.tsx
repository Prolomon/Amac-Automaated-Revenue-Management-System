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
  ShieldCheck,
  Layers,
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
      failed("Please enter the contact person or taxpayer legal name.");
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
      failed("An 11-digit Bank Verification Number (BVN) is required for wallet creation.");
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
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Navigation Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color="#0f172a" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.badgeWrap}>
              <ShieldCheck size={11} color="#065f46" />
              <Text style={styles.badgeText}>TAXPAYER ENROLLMENT</Text>
            </View>
            <Text style={styles.screenTitle}>Register New Entity</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Classification Toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, type === "BUSINESS" && styles.toggleBtnActive]}
              onPress={() => setType("BUSINESS")}
              activeOpacity={0.85}
            >
              <Building size={16} color={type === "BUSINESS" ? "#065f46" : "#64748B"} />
              <Text style={[styles.toggleBtnText, type === "BUSINESS" && styles.toggleBtnTextActive]}>
                Business Entity
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, type === "INDIVIDUAL" && styles.toggleBtnActive]}
              onPress={() => setType("INDIVIDUAL")}
              activeOpacity={0.85}
            >
              <User size={16} color={type === "INDIVIDUAL" ? "#065f46" : "#64748B"} />
              <Text style={[styles.toggleBtnText, type === "INDIVIDUAL" && styles.toggleBtnTextActive]}>
                Individual Taxpayer
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>Contact & Legal Identity</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {type === "BUSINESS" ? "Contact Person Full Name *" : "Taxpayer Legal Full Name *"}
              </Text>
              <View style={styles.inputWrapper}>
                <User size={16} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Aliko Dangote"
                  placeholderTextColor="#94a3b8"
                  value={fullname}
                  onChangeText={setFullname}
                />
              </View>
            </View>

            {type === "BUSINESS" && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Registered Enterprise Name *</Text>
                <View style={styles.inputWrapper}>
                  <Building2 size={16} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Dangote Cement Plc"
                    placeholderTextColor="#94a3b8"
                    value={businessName}
                    onChangeText={setBusinessName}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Official Email Address *</Text>
              <View style={styles.inputWrapper}>
                <Mail size={16} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. info@enterprise.ng"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={styles.inputWrapper}>
                <Phone size={16} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 08012345678"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={11}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bank Verification Number (BVN) *</Text>
              <View style={styles.inputWrapper}>
                <CreditCard size={16} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="11-digit BVN"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  maxLength={11}
                  value={bvn}
                  onChangeText={setBvn}
                />
              </View>
              <Text style={styles.bvnHint}>
                Required for provisioning the taxpayer's AMAC virtual wallet account.
              </Text>
            </View>
          </View>

          {/* Premises / Property Association Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>Assigned Premises & Property</Text>
            <Text style={styles.cardHeaderSub}>
              Select the property where this taxpayer or business conducts operations.
            </Text>

            {/* Property Search */}
            <View style={styles.searchBar}>
              <Search size={16} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search registered properties by name, PID, or address..."
                placeholderTextColor="#94a3b8"
                value={propertySearch}
                onChangeText={setPropertySearch}
              />
            </View>

            {loadingProperties ? (
              <ActivityIndicator color="#065f46" size="small" style={{ marginVertical: 14 }} />
            ) : (
              <View style={styles.propertyScrollContainer}>
                {filteredProperties.slice(0, 5).map((prop) => {
                  const isSelected = selectedPropertyId === prop.id;
                  return (
                    <TouchableOpacity
                      key={prop.id}
                      style={[styles.propertyCard, isSelected && styles.propertyCardSelected]}
                      onPress={() => handleSelectProperty(prop)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <Check size={12} color="#ffffff" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={styles.propertyName} numberOfLines={1}>{prop.name}</Text>
                          <View style={styles.pidBadge}>
                            <Text style={styles.pidBadgeText}>{prop.pid || "PID"}</Text>
                          </View>
                        </View>
                        <Text style={styles.propertyAddress} numberOfLines={1}>
                          {prop.address || prop.location?.address || "Address not provided"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street / Premises Address *</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={16} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Plot number, Street name, District"
                  placeholderTextColor="#94a3b8"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>
          </View>

          {/* Classification & Operational Zone Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>Business Category & Revenue Zone</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Trade Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, category === cat && styles.chipActive]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Revenue Collection Zone</Text>
              <View style={styles.zoneRow}>
                {ZONES.map((z) => (
                  <TouchableOpacity
                    key={z}
                    style={[styles.zoneBtn, zone === z && styles.zoneBtnActive]}
                    onPress={() => setZone(z)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.zoneBtnText, zone === z && styles.zoneBtnTextActive]}>
                      Zone {z}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Submit Action */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Register Taxpayer & Provision Wallet</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  badgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e6f9f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#065f46",
    letterSpacing: 0.5,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.2,
  },
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  typeToggle: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  toggleBtnTextActive: {
    color: "#065f46",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    gap: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  cardHeaderSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: -8,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#0f172a",
  },
  bvnHint: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "500",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    color: "#0f172a",
  },
  propertyScrollContainer: {
    gap: 8,
  },
  propertyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
  },
  propertyCardSelected: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    backgroundColor: "#065f46",
    borderColor: "#065f46",
  },
  propertyName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  pidBadge: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pidBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0369a1",
  },
  propertyAddress: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginHorizontal: 4,
  },
  chipActive: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  chipText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#065f46",
    fontWeight: "800",
  },
  zoneRow: {
    flexDirection: "row",
    gap: 8,
  },
  zoneBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  zoneBtnActive: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  zoneBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  zoneBtnTextActive: {
    color: "#065f46",
    fontWeight: "800",
  },
  submitBtn: {
    height: 50,
    backgroundColor: "#065f46",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#065f46",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
});
