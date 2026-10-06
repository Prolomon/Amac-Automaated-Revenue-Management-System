import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft, Check, CheckCircle2, Lock, ShieldCheck, Wallet } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { createCode, token, currentUser } = useAuth();
  const { wallet, createWallet, refresh, setUid } = useWallet();
  const { success, failed } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [bvn, setBvn] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [confirmSecurityCode, setConfirmSecurityCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [idType, setIdType] = useState<"BVN" | "NIN">("BVN");

  useEffect(() => {
    if (currentUser?.uid) {
      setUid(currentUser.uid);
      refresh();
    }
  }, [currentUser?.uid, refresh, router, setUid]);

  const validationState = useMemo(() => {
    const hasWallet = wallet ? true : false;
    const hasAccountNumber = wallet?.accountNo ? true : false;
    const isActive = wallet?.status ? true : false;
    const isVerified = wallet?.verify ? true : false;

    return {
      hasWallet,
      hasAccountNumber,
      isActive,
      isVerified,
      isValid: hasWallet && hasAccountNumber && isActive && isVerified,
    };
  }, [wallet]);

  const handleValidateWallet = () => {
    success("Wallet validation checked");
    if (validationState.hasWallet) {
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleCreateWallet = async () => {
    setLoading(true);
    try {
      const res = await createWallet(
        currentUser?.fullname || currentUser?.name,
        bvn.trim(),
        "AGENT",
        currentUser?.uid || "",
        token as string
      );

      if (res?.ok === false || res?.status === false) {
        failed(res?.message || "Wallet creation failed");
        return;
      }

      success(res?.message || "Wallet created successfully");
      setStep(3);
    } catch (error: any) {
      failed(error?.message || "Wallet creation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async () => {
    if (!securityCode || !confirmSecurityCode) {
      failed("Enter and confirm security code");
      return;
    }

    if (securityCode.length < 6) {
      failed("Security code must be at least 6 digits");
      return;
    }

    if (securityCode !== confirmSecurityCode) {
      failed("Security codes do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await createCode(securityCode, confirmSecurityCode);
      if (!res.ok) {
        failed(res.message || "Failed to set security code");
        return;
      }

      success("Security code configured successfully");
      router.replace("/pages/(pages)" as RelativePathString);
    } catch (e: any) {
      failed(e?.message || "An error occurred setting security code");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await refresh();
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.badgeWrap}>
            <ShieldCheck size={11} color="#065f46" />
            <Text style={styles.badgeText}>FIELD AGENT ONBOARDING</Text>
          </View>
          <Text style={styles.headerTitle}>Complete Profile</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor="#065f46" colors={["#065f46"]} />
        }
      >
        {/* Step Progress Tracker */}
        <View style={styles.stepsRow}>
          <View style={[styles.stepChip, step >= 1 && styles.stepChipActive]}>
            <Text style={[styles.stepText, step >= 1 && styles.stepTextActive]}>1. Verify</Text>
          </View>
          <View style={[styles.stepDivider, step >= 2 && styles.stepDividerActive]} />
          <View style={[styles.stepChip, step >= 2 && styles.stepChipActive]}>
            <Text style={[styles.stepText, step >= 2 && styles.stepTextActive]}>2. Wallet</Text>
          </View>
          <View style={[styles.stepDivider, step >= 3 && styles.stepDividerActive]} />
          <View style={[styles.stepChip, step >= 3 && styles.stepChipActive]}>
            <Text style={[styles.stepText, step >= 3 && styles.stepTextActive]}>3. PIN</Text>
          </View>
        </View>

        {/* Step Container Card */}
        <View style={styles.card}>
          {step === 1 ? (
            <>
              <View style={styles.cardHeadRow}>
                <View style={styles.iconWrap}>
                  <Wallet size={20} color="#065f46" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Collection Wallet Status</Text>
                  <Text style={styles.cardSub}>Review provisioned banking prerequisites.</Text>
                </View>
              </View>

              <View style={styles.statusBox}>
                <StatusRow label="Settlement Wallet Provisioned" ok={validationState.hasWallet} />
                <View style={styles.statusDivider} />
                <StatusRow label="AMAC Dedicated Virtual Account" ok={validationState.hasAccountNumber} />
                <View style={styles.statusDivider} />
                <StatusRow label="Account Active & Operational" ok={validationState.isActive} />
                <View style={styles.statusDivider} />
                <StatusRow label="Identity KYC Verified" ok={validationState.isVerified} />
              </View>

              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.85}
                onPress={handleValidateWallet}
              >
                <Text style={styles.buttonText}>
                  {validationState.hasWallet ? "Proceed to Security PIN" : "Setup Collection Wallet"}
                </Text>
              </TouchableOpacity>
            </>
          ) : step === 2 ? (
            <>
              <View style={styles.cardHeadRow}>
                <View style={styles.iconWrap}>
                  <ShieldCheck size={20} color="#065f46" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Identity Verification</Text>
                  <Text style={styles.cardSub}>Enter your BVN to provision an automated account.</Text>
                </View>
              </View>

              <View style={styles.idTypeSelector}>
                <TouchableOpacity
                  style={[styles.idTypeOption, idType === "BVN" && styles.idTypeOptionActive]}
                  activeOpacity={0.85}
                  onPress={() => setIdType("BVN")}
                >
                  <View style={styles.idTypeRadioOuter}>
                    {idType === "BVN" ? <View style={styles.idTypeRadioInner} /> : null}
                  </View>
                  <Text style={[styles.idTypeOptionText, idType === "BVN" && styles.idTypeOptionTextActive]}>
                    Bank Verification Number (BVN)
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Enter 11-digit {idType}</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={bvn}
                  onChangeText={setBvn}
                  keyboardType="number-pad"
                  placeholder="22XXXXXXXXX"
                  placeholderTextColor="#94a3b8"
                  maxLength={11}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, (loading || bvn.length < 11) && styles.buttonDisabled]}
                activeOpacity={0.85}
                onPress={handleCreateWallet}
                disabled={loading || bvn.length < 11}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Provision Collection Wallet</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.85}
                onPress={() => setStep(1)}
              >
                <Text style={styles.secondaryText}>Back to Status Check</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.cardHeadRow}>
                <View style={styles.iconWrap}>
                  <Lock size={20} color="#065f46" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Configure Security PIN</Text>
                  <Text style={styles.cardSub}>Required to authorize collections & field transfers.</Text>
                </View>
              </View>

              <Text style={styles.label}>New 6-Digit PIN</Text>
              <View style={styles.inputWrap}>
                <Lock size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  value={securityCode}
                  onChangeText={setSecurityCode}
                  keyboardType="number-pad"
                  secureTextEntry
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#94a3b8"
                  maxLength={6}
                />
              </View>

              <Text style={styles.label}>Confirm 6-Digit PIN</Text>
              <View style={styles.inputWrap}>
                <Lock size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  value={confirmSecurityCode}
                  onChangeText={setConfirmSecurityCode}
                  keyboardType="number-pad"
                  secureTextEntry
                  placeholder="Confirm 6-digit code"
                  placeholderTextColor="#94a3b8"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, (loading || securityCode.length < 6 || confirmSecurityCode.length < 6) && styles.buttonDisabled]}
                activeOpacity={0.85}
                onPress={handleCreateCode}
                disabled={loading || securityCode.length < 6 || confirmSecurityCode.length < 6}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save PIN & Complete</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.85}
                onPress={() => (validationState.isVerified ? setStep(1) : setStep(2))}
              >
                <Text style={styles.secondaryText}>Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusDot, ok ? styles.statusDotOk : styles.statusDotBad]} />
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={[styles.statusValue, ok ? styles.statusValueOk : styles.statusValueBad]}>
        {ok ? "Ready" : "Pending"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.2,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  stepChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  stepChipActive: {
    backgroundColor: "#065f46",
    borderColor: "#065f46",
  },
  stepText: {
    color: "#64748b",
    fontWeight: "700",
    fontSize: 12,
  },
  stepTextActive: {
    color: "#ffffff",
  },
  stepDivider: {
    flex: 1,
    height: 2,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 6,
  },
  stepDividerActive: {
    backgroundColor: "#065f46",
  },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  cardHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#e6f9f0",
    borderWidth: 1,
    borderColor: "#d4f5e6",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  cardSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  statusBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotOk: {
    backgroundColor: "#059669",
  },
  statusDotBad: {
    backgroundColor: "#f59e0b",
  },
  statusLabel: {
    flex: 1,
    fontSize: 13,
    color: "#334155",
    fontWeight: "500",
  },
  statusValue: {
    fontSize: 12,
    fontWeight: "800",
  },
  statusValueOk: {
    color: "#059669",
  },
  statusValueBad: {
    color: "#d97706",
  },
  statusDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  idTypeSelector: {
    marginBottom: 4,
  },
  idTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
  },
  idTypeOptionActive: {
    backgroundColor: "#e6f9f0",
    borderColor: "#a7f3d0",
  },
  idTypeRadioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#065f46",
    alignItems: "center",
    justifyContent: "center",
  },
  idTypeRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#065f46",
  },
  idTypeOptionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  idTypeOptionTextActive: {
    color: "#065f46",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginTop: 4,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#0f172a",
  },
  button: {
    height: 48,
    backgroundColor: "#065f46",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#065f46",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  secondaryButton: {
    height: 44,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
});
