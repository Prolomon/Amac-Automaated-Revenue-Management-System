import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { RelativePathString, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Users,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AgentProfileScreen() {
  const router = useRouter();
  const { currentUser, logout, forgot, changeCode } = useAuth();
  const { success, failed } = useToast();

  const name = (currentUser?.fullname || "Agent").trim();
  const entityId = currentUser?.uid || "AMAC-AGT-0000";
  const email = currentUser?.email || "-";
  const phone = currentUser?.phone || "-";
  const location = currentUser?.location || "Abuja Municipal Area Council";
  const gender = currentUser?.gender || "-";
  const center = currentUser?.center || "AMAC Central Operations";
  const batchNo = currentUser?.batchNo || "-";
  const status =
    typeof currentUser?.status === "boolean"
      ? currentUser.status
        ? "Active"
        : "Inactive"
      : currentUser?.status || "Active";
  const initial = name.charAt(0).toUpperCase();

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Security Code PIN Modal state
  const [securityVisible, setSecurityVisible] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [oldCode, setOldCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [savingCode, setSavingCode] = useState(false);

  // Change password modal state
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleCopy = async (text: string, fieldName: string) => {
    if (!text || text === "-") return;
    await Clipboard.setStringAsync(text);
    setCopiedField(fieldName);
    success(`${fieldName} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openSecurityModal = () => {
    setSecurityVisible(true);
    setNewCode("");
    setConfirmCode("");
    setOldCode("");
  };

  const openPasswordModal = () => {
    setNewPassword("");
    setConfirmPassword("");
    setOldPassword("");
    setPasswordVisible(true);
  };

  const handleForgotPassword = async () => {
    if (!currentUser?.uid) return failed("User not found");

    if (!newPassword.trim() || !confirmPassword.trim())
      return failed("New password is required");

    if (newPassword.trim() !== confirmPassword.trim())
      return failed("New passwords do not match");

    try {
      setSavingPassword(true);
      const res = await forgot(
        currentUser.uid,
        newPassword.trim(),
        confirmPassword.trim(),
        oldPassword.trim()
      );

      if (!res.ok) return failed(res.message ?? "Could not update password");

      success(res.message ?? "Password updated successfully");
      setPasswordVisible(false);
    } catch {
      failed("An error occurred updating password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChangeSecurityCode = async () => {
    if (!currentUser?.uid) return failed("User not found");

    if (!newCode.trim() || !confirmCode.trim())
      return failed("Security code is required");

    if (newCode.trim().length < 6)
      return failed("Security code must be at least 6 digits");

    if (newCode.trim() !== confirmCode.trim())
      return failed("Security codes do not match");

    try {
      setSavingCode(true);
      const res = await changeCode(
        oldCode.trim(),
        newCode.trim(),
        confirmCode.trim()
      );

      if (!res.ok) return failed(res.message ?? "Could not change code");

      success(res.message ?? "Security code updated successfully");
      setSecurityVisible(false);
    } catch {
      failed("An error occurred updating security code");
    } finally {
      setSavingCode(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("login" as RelativePathString);
      success("Logged out successfully");
    } catch (_: any) {
      failed(_?.error || _?.message || "Logout failed");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Agent Profile</Text>
          <Text style={styles.headerSubtitle}>
            Official AMAC Enforcement & Revenue Officer Credentials
          </Text>
        </View>

        {/* Executive Hero Card */}
        <View style={styles.heroCardContainer}>
          <LinearGradient
            colors={["#064e3b", "#022c22"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroAvatarRow}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={12} color="#10b981" />
                  <Text style={styles.verifiedText}>Authorized AMAC Agent</Text>
                </View>
                <Text style={styles.heroName} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={styles.heroRole} numberOfLines={1}>
                  Field Operations & Revenue Officer
                </Text>
              </View>
            </View>

            {/* UID Bar */}
            <View style={styles.uidBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.uidLabel}>Official Agent UID</Text>
                <Text style={styles.uidValue}>{entityId}</Text>
              </View>

              <TouchableOpacity
                style={styles.copyBtn}
                activeOpacity={0.8}
                onPress={() => handleCopy(entityId, "Agent UID")}
              >
                <Copy size={14} color="#a7f3d0" />
                <Text style={styles.copyBtnText}>
                  {copiedField === "Agent UID" ? "Copied" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Section: Official Credentials */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconWrap}>
            <User size={18} color="#065f46" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Official Credentials</Text>
            <Text style={styles.sectionSub}>Field officer identity and contact data</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoLabelWrap}>
              <Mail size={16} color="#64748b" />
              <Text style={styles.infoLabel}>Official Email</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={1}>{email}</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabelWrap}>
              <Phone size={16} color="#64748b" />
              <Text style={styles.infoLabel}>Phone Number</Text>
            </View>
            <Text style={styles.infoValue}>{phone}</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabelWrap}>
              <MapPin size={16} color="#64748b" />
              <Text style={styles.infoLabel}>Base Area</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={1}>{location}</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabelWrap}>
              <Users size={16} color="#64748b" />
              <Text style={styles.infoLabel}>Gender / Batch</Text>
            </View>
            <Text style={styles.infoValue}>
              {gender} {batchNo !== "-" ? `• Batch ${batchNo}` : ""}
            </Text>
          </View>
        </View>

        {/* Section: Operational Center & Status */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconWrap}>
            <Building size={18} color="#065f46" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Deployment Center</Text>
            <Text style={styles.sectionSub}>Assigned municipal collection center</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoLabelWrap}>
              <Building size={16} color="#64748b" />
              <Text style={styles.infoLabel}>Collection Center</Text>
            </View>
            <Text style={[styles.infoValue, { color: "#065f46", fontWeight: "700" }]}>{center}</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabelWrap}>
              <ShieldCheck size={16} color="#64748b" />
              <Text style={styles.infoLabel}>Operational Status</Text>
            </View>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>{status}</Text>
            </View>
          </View>
        </View>

        {/* Section: Security & Credentials */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconWrap}>
            <Lock size={18} color="#065f46" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Security & Account</Text>
            <Text style={styles.sectionSub}>Manage transaction PIN and login password</Text>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionRowBtn}
            activeOpacity={0.7}
            onPress={openSecurityModal}
          >
            <View style={styles.actionIconWrap}>
              <Lock size={18} color="#065f46" />
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
              <KeyRound size={18} color="#065f46" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.actionRowTitle}>Change Password</Text>
              <Text style={styles.actionRowSub}>Update your account login password</Text>
            </View>
            <ChevronRight size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <LogOut size={18} color="#dc2626" />
          <Text style={styles.logoutBtnText}>Sign Out from AMAC Terminal</Text>
        </TouchableOpacity>

        {/* Change Password Modal */}
        <Modal transparent visible={passwordVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIconWrap}>
                  <KeyRound size={20} color="#065f46" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.modalTitle}>Change Password</Text>
                  <Text style={styles.modalSub}>Update your login credentials.</Text>
                </View>
                <TouchableOpacity onPress={() => setPasswordVisible(false)} hitSlop={10}>
                  <Text style={{ fontSize: 20, color: "#94a3b8" }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="Enter current password"
                  placeholderTextColor="#94a3b8"
                  style={styles.modalInput}
                  secureTextEntry={!showPassword}
                />
              </View>

              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#94a3b8"
                  style={styles.modalInput}
                  secureTextEntry={!showPassword}
                />
              </View>

              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#94a3b8"
                  style={styles.modalInput}
                  secureTextEntry={!showPassword}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  activeOpacity={0.8}
                  onPress={() => setPasswordVisible(false)}
                  disabled={savingPassword}
                >
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1 }]}
                  activeOpacity={0.8}
                  onPress={handleForgotPassword}
                  disabled={savingPassword}
                >
                  {savingPassword ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Change Security PIN Modal */}
        <Modal transparent visible={securityVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIconWrap}>
                  <Lock size={20} color="#065f46" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.modalTitle}>Update Security PIN</Text>
                  <Text style={styles.modalSub}>6-digit code for field authorization.</Text>
                </View>
                <TouchableOpacity onPress={() => setSecurityVisible(false)} hitSlop={10}>
                  <Text style={{ fontSize: 20, color: "#94a3b8" }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Current PIN</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={oldCode}
                  onChangeText={setOldCode}
                  placeholder="Enter current 6-digit PIN"
                  placeholderTextColor="#94a3b8"
                  style={styles.modalInput}
                  secureTextEntry={!showCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <Text style={styles.inputLabel}>New 6-Digit PIN</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={newCode}
                  onChangeText={setNewCode}
                  placeholder="Enter new 6-digit PIN"
                  placeholderTextColor="#94a3b8"
                  style={styles.modalInput}
                  secureTextEntry={!showCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <Text style={styles.inputLabel}>Confirm New PIN</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={confirmCode}
                  onChangeText={setConfirmCode}
                  placeholder="Confirm new 6-digit PIN"
                  placeholderTextColor="#94a3b8"
                  style={styles.modalInput}
                  secureTextEntry={!showCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  activeOpacity={0.8}
                  onPress={() => setSecurityVisible(false)}
                  disabled={savingCode}
                >
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1 }]}
                  activeOpacity={0.8}
                  onPress={handleChangeSecurityCode}
                  disabled={savingCode || newCode.length < 6 || confirmCode.length < 6}
                >
                  {savingCode ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Save PIN</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  heroCardContainer: {
    marginBottom: 24,
    shadowColor: "#064e3b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
  },
  heroAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 2,
    borderColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#a7f3d0",
    letterSpacing: 0.4,
  },
  heroName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.2,
  },
  heroRole: {
    fontSize: 12,
    color: "#cbd5e1",
    marginTop: 2,
  },
  uidBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  uidLabel: {
    fontSize: 10,
    color: "#a7f3d0",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  uidValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
    fontFamily: "monospace",
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 11,
    color: "#64748b",
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    maxWidth: "50%",
    textAlign: "right",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#059669",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#059669",
  },
  actionsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  actionRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#e6f9f0",
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
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#dc2626",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    marginTop: 10,
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  modalInput: {
    height: 46,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
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
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  primaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#065f46",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
});
