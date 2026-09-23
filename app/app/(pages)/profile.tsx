import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { LinearGradient } from "expo-linear-gradient";
import { RelativePathString, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Home,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
  Users,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { forgetPassword, getMember } from "@/lib/services/member";
import { Property } from "@/lib/types";

export default function Profile() {
  const router = useRouter();
  const { currentUser, logout, createCode, token, refreshUser } = useAuth();
  const { success, failed } = useToast();

  const name = currentUser?.fullname || "Taxpayer Member";
  const businessName = currentUser?.businessName;
  const initial = name ? name.charAt(0).toUpperCase() : "U";

  // Location string
  const locationObj = currentUser?.location;
  const location = locationObj
    ? typeof locationObj === "string"
      ? locationObj
      : [locationObj.address, locationObj.city, locationObj.state, locationObj.zipcode]
          .filter(Boolean)
          .join(", ")
    : "";

  // Property state
  const [property, setProperty] = useState<Property | null>(
    currentUser?.property || (currentUser?.properties && currentUser.properties[0]) || null
  );
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Password modal state
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // PIN modal state
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinData, setPinData] = useState<{ pin: string; confirm: string }>({ pin: "", confirm: "" });
  const [creatingPin, setCreatingPin] = useState(false);

  // Sync / fetch latest property details
  const fetchPropertyData = useCallback(async () => {
    if (!currentUser?.uid || !token) return;
    try {
      setLoadingProperty(true);
      const res = await getMember(currentUser.uid, token);
      const memberData = res?.data || res?.member || res;
      if (memberData?.property || (memberData?.properties && memberData.properties.length > 0)) {
        setProperty(memberData.property || memberData.properties[0]);
      }
    } catch {
      // quiet fallback
    } finally {
      setLoadingProperty(false);
    }
  }, [currentUser?.uid, token]);

  useEffect(() => {
    if (currentUser?.property) {
      setProperty(currentUser.property);
    } else {
      fetchPropertyData();
    }
  }, [currentUser?.property, fetchPropertyData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (refreshUser) {
        await refreshUser();
      }
      await fetchPropertyData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopiedField(label);
    success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateCode = async () => {
    try {
      if (!pinData.pin || pinData.pin.length < 6) {
        failed("Please enter a valid 6-digit security code.");
        return;
      }
      if (pinData.pin !== pinData.confirm) {
        failed("Security codes do not match.");
        return;
      }
      setCreatingPin(true);
      const res = await createCode(pinData.pin, pinData.confirm);
      if (!res.ok) {
        failed(res.message || "Failed to create security code.");
        return;
      }
      success("Security code created successfully.");
      setPinModalVisible(false);
      setPinData({ pin: "", confirm: "" });
    } catch {
      failed("Failed to create security code.");
    } finally {
      setCreatingPin(false);
    }
  };

  const openPasswordModal = () => {
    setNewPassword("");
    setConfirmPassword("");
    setPasswordVisible(true);
  };

  const handleForgotPassword = async () => {
    if (!currentUser?.uid) return failed("User not found");
    if (!newPassword.trim() || newPassword.length < 6) {
      return failed("Password must be at least 6 characters.");
    }
    if (newPassword !== confirmPassword) {
      return failed("Passwords do not match.");
    }
    try {
      setUpdatingPassword(true);
      const res = await forgetPassword(
        newPassword.trim(),
        newPassword.trim(),
        confirmPassword.trim(),
        currentUser.uid,
        token as string
      );
      if (!res.ok) return failed(res.message ?? "Could not reset password");
      success(res.message ?? "Password updated successfully");
      setPasswordVisible(false);
    } catch (err: any) {
      failed(err?.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <LinearGradient
        colors={["rgba(14,163,96,0.12)", "rgba(248,250,252,0.98)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.35 }}
        style={styles.bgGradient}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#0ea360"
              colors={["#0ea360"]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Top Title Bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.pageTitle}>Taxpayer Profile</Text>
              <Text style={styles.pageSubtitle}>AMAC Municipal Revenue Registry</Text>
            </View>
            <TouchableOpacity
              style={styles.refreshBtn}
              activeOpacity={0.7}
              onPress={handleRefresh}
            >
              <RefreshCw
                size={18}
                color="#0ea360"
                style={refreshing ? styles.spinning : undefined}
              />
            </TouchableOpacity>
          </View>

          {/* User Hero Card */}
          <View style={styles.heroCard}>
            <LinearGradient
              colors={["#064e3b", "#065f46"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroHeader}>
                {currentUser?.avatar ? (
                  <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarInitial}>{initial}</Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <View style={styles.verifiedBadge}>
                    <ShieldCheck size={12} color="#10b981" />
                    <Text style={styles.verifiedText}>Verified Taxpayer</Text>
                  </View>
                  <Text style={styles.heroName} numberOfLines={1}>
                    {name}
                  </Text>
                  {businessName ? (
                    <Text style={styles.heroBusiness} numberOfLines={1}>
                      {businessName}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* UID & Cadastral Bar */}
              <View style={styles.uidBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uidLabel}>Taxpayer AMAC UID</Text>
                  <Text style={styles.uidValue}>{currentUser?.uid || "AMAC-TAX-0000"}</Text>
                </View>

                <TouchableOpacity
                  style={styles.copyBtn}
                  activeOpacity={0.8}
                  onPress={() => handleCopy(currentUser?.uid || "", "Taxpayer UID")}
                >
                  <Copy size={14} color="#a7f3d0" />
                  <Text style={styles.copyBtnText}>
                    {copiedField === "Taxpayer UID" ? "Copied" : "Copy"}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Registered Property & Premises Section */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconWrap}>
              <Home size={18} color="#0ea360" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Registered Property & Premises</Text>
              <Text style={styles.sectionSub}>Assigned municipal premises and assessment record</Text>
            </View>
          </View>

          {property ? (
            <View style={styles.propertyCard}>
              {/* Property Header */}
              <View style={styles.propertyTopRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.propertyName} numberOfLines={2}>
                    {property.name || "Commercial Premises"}
                  </Text>
                  <View style={styles.propertyBadgesRow}>
                    <View style={styles.typeBadge}>
                      <Building2 size={12} color="#0ea360" />
                      <Text style={styles.typeBadgeText}>{property.type || "Commercial"}</Text>
                    </View>
                    <View style={styles.sizeBadge}>
                      <Layers size={12} color="#0284c7" />
                      <Text style={styles.sizeBadgeText}>{property.size || "Standard"}</Text>
                    </View>
                    {property.zone ? (
                      <View style={styles.zoneBadge}>
                        <Text style={styles.zoneBadgeText}>{property.zone}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {property.status ? (
                  <View
                    style={[
                      styles.statusPill,
                      property.status === "APPROVED"
                        ? styles.statusApproved
                        : styles.statusPending,
                    ]}
                  >
                    <CheckCircle2
                      size={13}
                      color={property.status === "APPROVED" ? "#047857" : "#b45309"}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        property.status === "APPROVED"
                          ? styles.statusApprovedText
                          : styles.statusPendingText,
                      ]}
                    >
                      {property.status}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* PID & Copy Strip */}
              <View style={styles.pidRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pidLabel}>Property ID (PID)</Text>
                  <Text style={styles.pidCode}>{property.pid || "PID-PENDING"}</Text>
                </View>
                {property.pid ? (
                  <TouchableOpacity
                    style={styles.propertyCopyBtn}
                    activeOpacity={0.8}
                    onPress={() => handleCopy(property.pid || "", "Property PID")}
                  >
                    <Copy size={13} color="#0ea360" />
                    <Text style={styles.propertyCopyText}>
                      {copiedField === "Property PID" ? "Copied" : "Copy PID"}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Physical Address */}
              <View style={styles.addressRow}>
                <MapPin size={16} color="#0ea360" style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.addressLabel}>Premises Address</Text>
                  <Text style={styles.addressValue}>
                    {property.address || location || "Abuja Municipal Area Council (AMAC), FCT"}
                  </Text>
                </View>
              </View>

              {/* Photos Gallery */}
              {property.images && property.images.length > 0 ? (
                <View style={styles.galleryContainer}>
                  <View style={styles.galleryHeader}>
                    <ImageIcon size={14} color="#64748b" />
                    <Text style={styles.galleryTitle}>
                      Premises Evidence Photos ({property.images.length})
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.galleryScroll}
                  >
                    {property.images.map((imgUrl, idx) => (
                      <View key={idx} style={styles.photoThumbWrap}>
                        <Image source={{ uri: imgUrl }} style={styles.photoThumb} />
                        <View style={styles.photoIndexBadge}>
                          <Text style={styles.photoIndexText}>#{idx + 1}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.emptyPropertyCard}>
              <View style={styles.emptyPropertyIconWrap}>
                <Home size={26} color="#94a3b8" />
              </View>
              <Text style={styles.emptyPropertyTitle}>No Property Assigned</Text>
              <Text style={styles.emptyPropertyDesc}>
                No physical premises or commercial plaza is currently linked to this taxpayer profile.
                When verified by AMAC enumerators, your property record will display here automatically.
              </Text>
            </View>
          )}

          {/* Taxpayer Information Group */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconWrap}>
              <Tag size={18} color="#0ea360" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Taxpayer Information</Text>
              <Text style={styles.sectionSub}>Official business and registration records</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Entity Type</Text>
              <Text style={styles.infoValue}>{currentUser?.type || "Individual"}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Revenue Category</Text>
              <Text style={[styles.infoValue, { color: "#0ea360", fontWeight: "600" }]}>
                {currentUser?.category || "Standard Municipal Assessment"}
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Revenue Center</Text>
              <Text style={styles.infoValue}>{currentUser?.center || "AMAC HQ Center"}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cadastral Zone</Text>
              <Text style={styles.infoValue}>
                {currentUser?.zone || property?.zone || "Municipal Zone A"}
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned Agent</Text>
              <Text style={styles.infoValue}>{currentUser?.agent || "Area Revenue Inspector"}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Billing Frequency</Text>
              <Text style={styles.infoValue}>{currentUser?.billingFrequency || "Annual"}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Status</Text>
              <View style={styles.activeStatusPill}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>
                  {currentUser?.status !== false ? "Active Registry" : "Inactive"}
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Details Group */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconWrap}>
              <Phone size={18} color="#0ea360" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Contact & Location</Text>
              <Text style={styles.sectionSub}>Communication channel and registered address</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Mail size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Email Address</Text>
              </View>
              <Text style={styles.infoValue}>{currentUser?.email || "-"}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Phone size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Phone Number</Text>
              </View>
              <Text style={styles.infoValue}>{currentUser?.phone || "-"}</Text>
            </View>
            <View style={styles.divider} />

            <View style={[styles.infoRow, { alignItems: "flex-start" }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                <MapPin size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Tax Address</Text>
              </View>
              <Text style={[styles.infoValue, { flex: 1, textAlign: "right", marginLeft: 16 }]}>
                {location || "Abuja, Federal Capital Territory"}
              </Text>
            </View>
          </View>

          {/* Security & Account Actions */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconWrap}>
              <Lock size={18} color="#0ea360" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Security & Account</Text>
              <Text style={styles.sectionSub}>Manage transaction PIN and account credentials</Text>
            </View>
          </View>

          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={styles.actionRowBtn}
              activeOpacity={0.7}
              onPress={() => setPinModalVisible(true)}
            >
              <View style={styles.actionIconWrap}>
                <Lock size={18} color="#0ea360" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.actionRowTitle}>Change Security PIN</Text>
                <Text style={styles.actionRowSub}>Set 6-digit transaction authorization code</Text>
              </View>
              <ChevronRight size={18} color="#94a3b8" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity
              style={styles.actionRowBtn}
              activeOpacity={0.7}
              onPress={openPasswordModal}
            >
              <View style={styles.actionIconWrap}>
                <KeyRound size={18} color="#0ea360" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.actionRowTitle}>Change Password</Text>
                <Text style={styles.actionRowSub}>Update your account login password</Text>
              </View>
              <ChevronRight size={18} color="#94a3b8" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity
              style={styles.logoutRowBtn}
              activeOpacity={0.7}
              onPress={async () => {
                try {
                  await logout();
                  router.replace("login" as RelativePathString);
                  success("Logged out successfully");
                } catch {
                  failed("Logout failed");
                }
              }}
            >
              <View style={styles.logoutIconWrap}>
                <LogOut size={18} color="#ef4444" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.logoutText}>Sign Out</Text>
                <Text style={styles.logoutSub}>Exit your AMAC taxpayer session</Text>
              </View>
              <ChevronRight size={18} color="#fca5a5" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Change Password Modal */}
      <Modal transparent visible={passwordVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <KeyRound size={20} color="#0ea360" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <Text style={styles.modalSub}>Enter your new password to secure your account.</Text>
              </View>
              <TouchableOpacity onPress={() => setPasswordVisible(false)} hitSlop={10}>
                <Text style={{ fontSize: 20, color: "#94a3b8" }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#94a3b8"
                style={[styles.input, { paddingRight: 44 }]}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                style={styles.eyeToggle}
                onPress={() => setShowNewPassword((v) => !v)}
              >
                {showNewPassword ? <EyeOff color="#64748b" size={18} /> : <Eye color="#64748b" size={18} />}
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#94a3b8"
                style={[styles.input, { paddingRight: 44 }]}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeToggle}
                onPress={() => setShowConfirmPassword((v) => !v)}
              >
                {showConfirmPassword ? <EyeOff color="#64748b" size={18} /> : <Eye color="#64748b" size={18} />}
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.8}
                onPress={() => setPasswordVisible(false)}
                disabled={updatingPassword}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1 }]}
                activeOpacity={0.8}
                onPress={handleForgotPassword}
                disabled={updatingPassword}
              >
                {updatingPassword ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Security Code PIN Modal */}
      <Modal visible={pinModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Lock size={20} color="#0ea360" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.modalTitle}>Set 6-Digit PIN</Text>
                <Text style={styles.modalSub}>Code for authorizing payments & transactions.</Text>
              </View>
              <TouchableOpacity onPress={() => setPinModalVisible(false)} hitSlop={10}>
                <Text style={{ fontSize: 20, color: "#94a3b8" }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>New 6-Digit PIN</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit code"
                value={pinData.pin}
                onChangeText={(text) => setPinData({ ...pinData, pin: text })}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                placeholderTextColor="#94a3b8"
              />
            </View>

            <Text style={styles.inputLabel}>Confirm 6-Digit PIN</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Confirm 6-digit code"
                value={pinData.confirm}
                onChangeText={(text) => setPinData({ ...pinData, confirm: text })}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.8}
                onPress={() => setPinModalVisible(false)}
                disabled={creatingPin}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1 }]}
                activeOpacity={0.8}
                onPress={handleCreateCode}
                disabled={creatingPin}
              >
                {creatingPin ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Save PIN</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  bgGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 18,
    paddingBottom: 48,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  spinning: {
    transform: [{ rotate: "45deg" }],
  },

  // Hero Card
  heroCard: {
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#064e3b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroGradient: {
    padding: 20,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(16,185,129,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#a7f3d0",
    letterSpacing: 0.2,
  },
  heroName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.2,
  },
  heroBusiness: {
    fontSize: 13,
    color: "#a7f3d0",
    marginTop: 2,
    fontWeight: "500",
  },
  uidBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  uidLabel: {
    fontSize: 10,
    color: "#93c5fd",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  uidValue: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 1,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#a7f3d0",
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    marginTop: 6,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  sectionSub: {
    fontSize: 11,
    color: "#64748b",
  },

  // Property Card
  propertyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  propertyTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  propertyName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  propertyBadgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  sizeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sizeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284c7",
  },
  zoneBadge: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  zoneBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusApproved: {
    backgroundColor: "#d1fae5",
  },
  statusApprovedText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#047857",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
  },
  statusPendingText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#b45309",
  },
  statusPillText: {
    textTransform: "uppercase",
  },
  pidRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  pidLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
  },
  pidCode: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0ea360",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 1,
  },
  propertyCopyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  propertyCopyText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0ea360",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  addressValue: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "500",
    marginTop: 2,
    lineHeight: 18,
  },
  galleryContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  galleryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  galleryTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  galleryScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  photoThumbWrap: {
    width: 100,
    height: 70,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    position: "relative",
  },
  photoThumb: {
    width: "100%",
    height: "100%",
  },
  photoIndexBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  photoIndexText: {
    fontSize: 9,
    color: "#ffffff",
    fontWeight: "700",
  },
  emptyPropertyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    marginBottom: 22,
  },
  emptyPropertyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyPropertyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },
  emptyPropertyDesc: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 8,
  },

  // Info Cards
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 22,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  activeStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  activeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },

  // Security & Actions Card
  actionsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  actionRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  actionRowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  actionRowSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  actionDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginLeft: 66,
  },
  logoutRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  logoutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ef4444",
  },
  logoutSub: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 1,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginTop: 12,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  eyeToggle: {
    position: "absolute",
    right: 12,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  primaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#0ea360",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0ea360",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});
