import { formatCurrency } from "@/config";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { Transaction } from "@/lib/types";
import * as Clipboard from "expo-clipboard";
import { RelativePathString, useRouter } from "expo-router";
import {
  ArrowLeftRight,
  Bell,
  Copy,
  Eye,
  EyeOff,
  History,
  ScanBarcode,
  CreditCard,
  ShieldCheck
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const router = useRouter();
  const { currentUser, code, createCode, loading, token } = useAuth();
  const { success, failed } = useToast();

  const displayName = currentUser?.fullname?.split(" ")[0] + " " + currentUser?.fullname?.split(" ")[1];
  const [accountCopied, setAccountCopied] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { wallet, toggleHide, hide, refresh, getTransactions } = useWallet();
  const walletBalance = Number(wallet?.balance || 0);
  const walletAccountNo = wallet?.accountNo || 0;
  const walletBank = wallet?.bank?.name || "-";

  //Security Code
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [showCode, setShowCode] = useState(false);

  // Derived — shows automatically when there's no code
  const shouldShowForCode = !loading && (code === "" || code === null);

  // Manual override — lets you hide it after a successful PIN entry,
  // even if `code` hasn't updated yet / the parent hasn't re-rendered with new code
  const [manuallyHidden, setManuallyHidden] = useState(false);

  const pinVisible = shouldShowForCode && !manuallyHidden;

  const handleCopyAccountNumber = async () => {
    if (!wallet?.accountNo) return;
    await Clipboard.setStringAsync(wallet.accountNo);
    setAccountCopied(true);
    setTimeout(() => setAccountCopied(false), 1600);
  };

  const loadTransactions = useCallback(
    async (signal?: { isActive: boolean }) => {
      const userId = currentUser?.uid || currentUser?.id;
      if (!userId || !wallet) {
        setTransactions([]);
        return;
      }

      setHistoryLoading(true);
      try {
        const now = new Date();
        const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        const endDate = now.toISOString().split("T")[0];

        const data = await getTransactions(
          userId|| "",
          startDate,
          endDate,
          token as string
        );

        if (signal && !signal.isActive) return;

        const sorted = [...(data?.data ?? [])].sort(
          (a: Transaction, b: Transaction) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setTransactions(sorted);
      } catch (error) {
        if (signal && !signal.isActive) return;
        console.error("Failed to load transactions:", error);
        setTransactions([]);
      } finally {
        if (!signal || signal.isActive) setHistoryLoading(false);
      }
    },
    [currentUser?.id, currentUser?.uid, getTransactions, token, wallet]
  );

  useEffect(() => {
    const signal = { isActive: true };

    Promise.resolve().then(() => {
      if (signal.isActive) loadTransactions(signal);
    });

    return () => {
      signal.isActive = false;
    };
  }, [loadTransactions]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refresh?.();
      await loadTransactions();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status?: string) => {
    if (status === "SUCCESS") return "#0ea360";
    if (status === "PENDING") return "#f59e0b";
    if (status === "FAILED") return "#ef4444";
    return "#6b7280";
  };

  const handleCreateSecurityCode = async () => {
    if (!currentUser?.uid) return failed("User not found");


    if (!newCode.trim() || !confirmCode.trim())
      return failed("Code required");

    if (newCode.trim() !== confirmCode.trim())
      return failed("Codes do not match");

    const res = await createCode(
      newCode.trim(),
      confirmCode.trim(),
    );

    if (!res.ok) return failed(res.message ?? "Could not change code");

    success(res.message ?? "Code updated");
    setManuallyHidden(true);

  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={{ paddingVertical: 18 }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.headerCard}>
          <View style={styles.headerCardContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={{ fontSize: 24, color: "#000", fontWeight: "bold" }}>{displayName}</Text>
            </View>
            <TouchableOpacity
              style={styles.avatar}
              activeOpacity={0.8}
              onPress={() => router.push("notification" as RelativePathString)}
            >
              <Bell size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {wallet ? (
          <View style={styles.walletCard}>
            <View style={styles.walletTopRow}>
              <Text style={styles.walletTitle}>Wallet Balance</Text>
              <TouchableOpacity
                style={styles.walletIconButton}
                activeOpacity={0.8}
                onPress={() => toggleHide(!hide)}
              >
                {hide ? (
                  <EyeOff size={20} color="#0ea360" />
                ) : (
                  <Eye size={20} color="#0ea360" />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.walletAmount}>
              {hide ? "₦ ••••••" : formatCurrency(walletBalance)}
            </Text>

            <View style={styles.walletBottomRow}>
              <View>
                <Text style={styles.walletAccountLabel}>Account Number</Text>
                <Text style={styles.walletAccountValue}>{walletAccountNo}</Text>
                <View style={styles.walletBorder}></View>
                <Text style={styles.walletAccountValue}>{walletBank}</Text>
              </View>

              <TouchableOpacity
                style={styles.walletIconButton}
                activeOpacity={0.8}
                onPress={handleCopyAccountNumber}
              >
                <Copy size={18} color="#0ea360" />
              </TouchableOpacity>
            </View>

            {accountCopied ? (
              <Text style={styles.walletCopiedText}>Account number copied</Text>
            ) : null}

          </View>
        ) : (
          <View style={styles.completeProfileCard}>
            <Text style={styles.completeProfileTitle}>Setup Your Wallet</Text>
            <Text style={styles.completeProfileDesc}>
              You do not have an active wallet. Complete your profile details to activate your account.
            </Text>
            <TouchableOpacity
              style={styles.completeProfileBtn}
              activeOpacity={0.8}
              onPress={() => router.push("/pages/complete" as RelativePathString)}
            >
              <Text style={styles.completeProfileBtnText}>Complete Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ padding: 18 }}>

          {/* quick action section */}
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#000", marginBottom: 12 }}>Quick Action</Text>
          <View style={styles.quickActionRow}>
            <TouchableOpacity
              style={styles.quickActionItem}
              activeOpacity={0.8}
              onPress={() => router.push("/pages/(pages)/scan" as RelativePathString)}
            >
              <View style={styles.quickActionIconWrap}>
                <ScanBarcode size={20} color="#0ea360" />
              </View>
              <Text style={styles.quickActionText}>Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              activeOpacity={0.8}
              onPress={() => router.push("/pages/(pages)/pay" as RelativePathString)}
            >
              <View style={styles.quickActionIconWrap}>
                <CreditCard size={20} color="#0ea360" />
              </View>
              <Text style={styles.quickActionText}>Pay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              activeOpacity={0.8}
              onPress={() => router.push("/pages/history" as RelativePathString)}
            >
              <View style={styles.quickActionIconWrap}>
                <History size={20} color="#0ea360" />
              </View>
              <Text style={styles.quickActionText}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              activeOpacity={0.8}
              onPress={() => router.push("/pages/verify" as RelativePathString)}
            >
              <View style={styles.quickActionIconWrap}>
                <ShieldCheck size={20} color="#0ea360" />
              </View>
              <Text style={styles.quickActionText}>Verify</Text>
            </TouchableOpacity>
          </View>

          {/*  transaction history section */}
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#000", marginVertical: 12 }}>Transaction History</Text>
          <View style={styles.historyWrap}>
            {historyLoading ? (
              <Text style={styles.historyStateText}>Loading transactions...</Text>
            ) : transactions.length === 0 ? (
              <Text style={styles.historyStateText}>No transactions yet.</Text>
            ) : (
              transactions.slice(0, 6).map((tx) => (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.historyItem}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/pages/transaction/${tx.id}` as RelativePathString)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyTitle}>{tx.event || tx.channel || "Transaction"}</Text>
                    <Text style={styles.historySub}>{tx.gatewayResponse || tx.customerEmail}</Text>
                    <Text style={styles.historyDate}>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "-"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.historyAmount}>{formatCurrency(Number(tx.amount || 0))}</Text>
                    <Text style={[styles.historyStatus, { color: getStatusColor(String(tx.status)) }]}>
                      {String(tx.status)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <Modal transparent visible={pinVisible} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Create Security pin</Text>

              <Text style={styles.label}>Pin</Text>
              {/* New Code */}
              <View style={styles.inputWrapper}>
                <TextInput
                  value={newCode}
                  onChangeText={setNewCode}
                  placeholder="New code"
                  placeholderTextColor="#c7cbd0"
                  style={[styles.input, { paddingRight: 44 }]}
                  secureTextEntry={!showCode}
                  maxLength={6}
                />
                <TouchableOpacity
                  style={styles.eyeToggle}
                  onPress={() => setShowCode((v) => !v)}
                  accessibilityLabel={
                    showCode ? "Hide code" : "Show code"
                  }
                >
                  {showCode ? (
                    <EyeOff color="#5b6b73" />
                  ) : (
                    <Eye color="#5b6b73" />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm pin</Text>
              {/* Confirm Code */}
              <View style={styles.inputWrapper}>
                <TextInput
                  value={confirmCode}
                  onChangeText={setConfirmCode}
                  placeholder="Confirm code"
                  placeholderTextColor="#c7cbd0"
                  style={[styles.input, { paddingRight: 44 }]}
                  secureTextEntry={!showCode}
                  maxLength={6}
                />
                <TouchableOpacity
                  style={styles.eyeToggle}
                  onPress={() => setShowCode((v) => !v)}
                  accessibilityLabel={
                    showCode ? "Hide code" : "Show code"
                  }
                >
                  {showCode ? (
                    <EyeOff color="#5b6b73" />
                  ) : (
                    <Eye color="#5b6b73" />
                  )}
                </TouchableOpacity>
              </View>

              {/* modal buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  activeOpacity={0.85}
                  onPress={() => setManuallyHidden(true)}
                >
                  <Text style={styles.secondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1, marginLeft: 8 }]}
                  activeOpacity={0.85}
                  onPress={handleCreateSecurityCode}
                  disabled={confirmCode.length < 6 || newCode.length < 6}
                >
                  <Text style={styles.primaryText}>Create</Text>
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
  safe: { flex: 1, backgroundColor: "ghostwhite" },
  content: { paddingBottom: 20 },
  headerCard: {
    marginHorizontal: 18,
  },
  headerCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: { fontSize: 18, color: "#0ea360", fontWeight: "bold" },
  quickActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    borderRadius: 16,
  },
  quickActionItem: {
    alignItems: "center",
    justifyContent: "center",
    width: "24%",
  },
  quickActionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e6f9f0",
    borderWidth: 1,
    borderColor: "#d4f5e6",
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
  },
  historyWrap: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e6f9f0",
    padding: 12,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  historySub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  historyDate: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 3,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  historyStatus: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },
  historyStateText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    paddingVertical: 16,
  },
  accountText: { marginTop: 4, color: "#222", fontSize: 18, fontWeight: "600" },
  walletBorder: {
    marginVertical: 8,
    height: 1,
    backgroundColor: "#e6f9f0",
    alignSelf: "stretch",
  },
  walletCard: {
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: "#0ea360",
    padding: 18,
    borderWidth: 1,
    borderColor: "#e6f9f0",
  },
  walletTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletBottomRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletTitle: {
    fontSize: 13,
    letterSpacing: 1,
    color: "#fff",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  walletAmount: {
    marginTop: 4,
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
  },
  walletAccountLabel: {
    fontSize: 14,
    color: "#fff",
    // marginBottom: 2,
  },
  walletAccountValue: {
    fontSize: 18,
    letterSpacing: 1,
    color: "#fff",
    fontWeight: "700",
  },
  walletIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#c6f2dc",
  },
  walletCopiedText: {
    marginTop: 10,
    color: "#0ea360",
    fontSize: 12,
    fontWeight: "600",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#0ea360",
  },
  uidCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 18,
    marginTop: 18,
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "#e6f9f0",
    alignSelf: "stretch",
  },
  uidLabel: {
    fontSize: 12,
    color: "#0ea360",
    fontWeight: "bold",
    marginBottom: 2,
    letterSpacing: 1.2,
  },
  uidRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  uidValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    letterSpacing: 1.1,
  },
  copyBtn: {
    backgroundColor: "#e6f9f0",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10,
  },
  copyBtnText: {
    color: "#0ea360",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1,
  },
  completeProfileCard: {
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  completeProfileTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
  },
  completeProfileDesc: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  completeProfileBtn: {
    backgroundColor: "#0ea360",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  completeProfileBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  modalButtons: { flexDirection: "row", marginTop: 14, alignItems: "center" },
  label: { marginTop: 8, marginBottom: 6, color: "#5b6b73" },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#e6e9eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  eyeToggle: {
    position: "absolute",
    right: 10,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  primaryBtn: {
    backgroundColor: "#0ea360",
    height: 46,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#fff", fontSize: 16 },
  tertiaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d5dadc",
    backgroundColor: "#f10000",
  },
  secondaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d5dadc",
    backgroundColor: "#fff",
  },
  secondaryText: { color: "#0ea360" },
  modalVerifyBtn: {
    height: 48,
    flexDirection: "row",
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#0ea360",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  modalVerifyBtnText: {
    color: "#0ea360",
    fontSize: 15,
    fontWeight: "bold"
  },
});
