import { formatCurrency } from "@/config";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { Transaction, TransactionStatus } from "@/lib/types";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { RelativePathString, useRouter } from "expo-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  History,
  Lock,
  ReceiptText,
  ScanBarcode,
  ShieldCheck,
  User,
  Users,
  Wallet,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AgentDashboard() {
  const router = useRouter();
  const { currentUser, code, createCode, loading, token } = useAuth();
  const { success, failed } = useToast();

  const [accountCopied, setAccountCopied] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { wallet, toggleHide, hide, refresh, getTransactions } = useWallet();

  const walletBalance = Number(wallet?.balance || 0);
  const walletAccountNo = wallet?.accountNo ? String(wallet.accountNo) : "";
  const walletBank = wallet?.bank?.name || "AMAC Partner Bank";
  const accountName = wallet?.accountName || currentUser?.fullname || "AMAC Field Agent";

  const displayName = currentUser?.fullname || "Revenue Agent";
  const userInitials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Security Code Setup
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [creatingCode, setCreatingCode] = useState(false);

  const shouldShowForCode = !loading && (code === "" || code === null);
  const [manuallyHidden, setManuallyHidden] = useState(false);
  const pinVisible = shouldShowForCode && !manuallyHidden;

  const handleCopyAccountNumber = async () => {
    if (!walletAccountNo) return;
    await Clipboard.setStringAsync(walletAccountNo);
    setAccountCopied(true);
    success("Account number copied");
    setTimeout(() => setAccountCopied(false), 2000);
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
          userId || "",
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

  const getStatusBadge = (status?: string | TransactionStatus) => {
    const s = String(status || "").toUpperCase();
    if (s === "SUCCESS" || s === "COMPLETED") {
      return {
        bg: "#ecfdf5",
        text: "#059669",
        border: "#a7f3d0",
        label: "Successful",
      };
    }
    if (s === "PENDING") {
      return {
        bg: "#fffbeb",
        text: "#d97706",
        border: "#fde68a",
        label: "Processing",
      };
    }
    return {
      bg: "#fef2f2",
      text: "#dc2626",
      border: "#fecaca",
      label: "Failed",
    };
  };

  const handleCreateSecurityCode = async () => {
    if (!currentUser?.uid) return failed("User not found");

    if (!newCode.trim() || !confirmCode.trim())
      return failed("Security code is required");

    if (newCode.trim().length < 6)
      return failed("Security code must be at least 6 digits");

    if (newCode.trim() !== confirmCode.trim())
      return failed("Security codes do not match");

    try {
      setCreatingCode(true);
      const res = await createCode(newCode.trim(), confirmCode.trim());
      if (!res.ok) return failed(res.message ?? "Could not save code");

      success(res.message ?? "Security PIN saved successfully");
      setManuallyHidden(true);
    } catch {
      failed("An error occurred setting PIN");
    } finally {
      setCreatingCode(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#065f46"
            colors={["#065f46"]}
          />
        }
      >
        {/* Top Executive Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.govBadge}>
              <ShieldCheck size={12} color="#065f46" />
              <Text style={styles.govBadgeText}>AMAC FIELD AGENT PORTAL</Text>
            </View>
            <Text style={styles.welcomeGreeting} numberOfLines={1}>
              {displayName}
            </Text>
            {currentUser?.center ? (
              <Text style={styles.agentCenterText} numberOfLines={1}>
                Coverage Center: {currentUser.center}
              </Text>
            ) : (
              <Text style={styles.agentCenterText} numberOfLines={1}>
                AMAC Enforcement & Field Collection
              </Text>
            )}
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notificationBtn}
              activeOpacity={0.8}
              onPress={() => router.push("notification" as RelativePathString)}
              accessibilityLabel="Notifications"
            >
              <Bell size={20} color="#0f172a" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileAvatar}
              activeOpacity={0.8}
              onPress={() => router.push("/pages/(pages)/profile" as RelativePathString)}
            >
              <Text style={styles.avatarInitials}>{userInitials}</Text>
              <View style={styles.avatarVerifiedBadge}>
                <CheckCircle2 size={12} color="#ffffff" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Executive Fintech Wallet Card */}
        {wallet ? (
          <View style={styles.walletContainer}>
            <LinearGradient
              colors={["#064e3b", "#022c22"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.walletCard}
            >
              {/* Card Top Pill */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTypeChip}>
                  <Wallet size={12} color="#6ee7b7" />
                  <Text style={styles.cardTypeChipText}>AGENT COLLECTION WALLET</Text>
                </View>
                <TouchableOpacity
                  style={styles.visibilityBtn}
                  activeOpacity={0.7}
                  onPress={() => toggleHide(!hide)}
                >
                  {hide ? (
                    <EyeOff size={18} color="#a7f3d0" />
                  ) : (
                    <Eye size={18} color="#a7f3d0" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Balance Display */}
              <View style={styles.balanceSection}>
                <Text style={styles.balanceLabel}>Current Float / Collections</Text>
                <Text style={styles.balanceValue}>
                  {hide ? "₦ ••••••••" : formatCurrency(walletBalance)}
                </Text>
              </View>

              {/* Virtual Account Section */}
              <View style={styles.accountCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bankNameText}>{walletBank}</Text>
                  <Text style={styles.accountNumberText}>
                    {walletAccountNo
                      ? walletAccountNo.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")
                      : "Generating..."}
                  </Text>
                  <Text style={styles.accountHolderText} numberOfLines={1}>
                    {accountName}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.copyAccountBtn}
                  activeOpacity={0.8}
                  onPress={handleCopyAccountNumber}
                >
                  <Copy size={16} color={accountCopied ? "#059669" : "#ffffff"} />
                  <Text
                    style={[
                      styles.copyAccountText,
                      accountCopied && { color: "#059669" },
                    ]}
                  >
                    {accountCopied ? "Copied" : "Copy"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* In-Card Quick Actions */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.cardActionPrimary}
                  activeOpacity={0.85}
                  onPress={() => router.push("/pages/(pages)/pay" as RelativePathString)}
                >
                  <CreditCard size={15} color="#064e3b" />
                  <Text style={styles.cardActionPrimaryText}>Collect Payment</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cardActionSecondary}
                  activeOpacity={0.85}
                  onPress={() => router.push("/pages/(pages)/scan" as RelativePathString)}
                >
                  <ScanBarcode size={15} color="#ffffff" />
                  <Text style={styles.cardActionSecondaryText}>Scan QR</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.setupWalletCard}>
            <View style={styles.setupWalletIconWrap}>
              <Wallet size={28} color="#065f46" />
            </View>
            <Text style={styles.setupWalletTitle}>Activate Settlement Account</Text>
            <Text style={styles.setupWalletDesc}>
              Complete your agent verification profile to provision your official collection wallet and virtual account.
            </Text>
            <TouchableOpacity
              style={styles.setupWalletBtn}
              activeOpacity={0.85}
              onPress={() => router.push("/pages/complete" as RelativePathString)}
            >
              <Text style={styles.setupWalletBtnText}>Complete Verification</Text>
              <ChevronRight size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Action Hub */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Field Operations</Text>
        </View>

        <View style={styles.quickActionGrid}>
          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => router.push("/pages/(pages)/scan" as RelativePathString)}
          >
            <View style={styles.quickActionIconWrap}>
              <ScanBarcode size={22} color="#064e3b" strokeWidth={2.2} />
            </View>
            <Text style={styles.quickActionLabel}>Scan QR</Text>
            <Text style={styles.quickActionSub}>Tax barcode</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => router.push("/pages/(pages)/pay" as RelativePathString)}
          >
            <View style={styles.quickActionIconWrap}>
              <CreditCard size={22} color="#064e3b" strokeWidth={2.2} />
            </View>
            <Text style={styles.quickActionLabel}>Collect Bill</Text>
            <Text style={styles.quickActionSub}>Direct receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => router.push("/pages/history" as RelativePathString)}
          >
            <View style={styles.quickActionIconWrap}>
              <History size={22} color="#064e3b" strokeWidth={2.2} />
            </View>
            <Text style={styles.quickActionLabel}>Audit History</Text>
            <Text style={styles.quickActionSub}>Collections log</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => router.push("/pages/verify" as RelativePathString)}
          >
            <View style={styles.quickActionIconWrap}>
              <ShieldCheck size={22} color="#064e3b" strokeWidth={2.2} />
            </View>
            <Text style={styles.quickActionLabel}>Verify</Text>
            <Text style={styles.quickActionSub}>Assessment status</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History Section */}
        <View style={[styles.sectionHeaderRow, { marginTop: 16 }]}>
          <Text style={styles.sectionTitle}>Recent Collections</Text>
          <TouchableOpacity
            onPress={() => router.push("/pages/history" as RelativePathString)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyContainer}>
          {historyLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#065f46" size="small" />
              <Text style={styles.loadingText}>Fetching collection records...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <ReceiptText size={28} color="#065f46" />
              </View>
              <Text style={styles.emptyTitle}>No Collections Yet</Text>
              <Text style={styles.emptySubtitle}>
                Payments collected from taxpayers will appear here with instant receipt validation.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                activeOpacity={0.85}
                onPress={() => router.push("/pages/(pages)/scan" as RelativePathString)}
              >
                <Text style={styles.emptyActionBtnText}>Scan Taxpayer QR</Text>
              </TouchableOpacity>
            </View>
          ) : (
            transactions.slice(0, 5).map((tx) => {
              const status = getStatusBadge(tx.status);
              const isCredit = tx.event?.toLowerCase().includes("credit") || String(tx.status).toUpperCase() === "SUCCESS";
              return (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.transactionCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/pages/transaction/${tx.id}` as RelativePathString)}
                >
                  <View style={styles.txIconWrap}>
                    {isCredit ? (
                      <ArrowDownLeft size={20} color="#059669" />
                    ) : (
                      <ArrowUpRight size={20} color="#dc2626" />
                    )}
                  </View>

                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.txTitle} numberOfLines={1}>
                      {tx.event || tx.channel || "Tax Assessment Payment"}
                    </Text>
                    <Text style={styles.txSubtitle} numberOfLines={1}>
                      {tx.gatewayResponse || tx.customerEmail || tx.reference || "AMAC Automated Terminal"}
                    </Text>
                    <Text style={styles.txDate}>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }) : "Recently"}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.txAmount}>
                      {formatCurrency(Number(tx.amount || 0))}
                    </Text>
                    <View style={[styles.txBadge, { backgroundColor: status.bg, borderColor: status.border }]}>
                      <Text style={[styles.txBadgeText, { color: status.text }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Security PIN Setup Modal */}
        <Modal transparent visible={pinVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIconWrap}>
                  <Lock size={20} color="#065f46" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.modalTitle}>Set 6-Digit PIN</Text>
                  <Text style={styles.modalSub}>Required for authorizing collections & field payouts.</Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>New 6-Digit PIN</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={newCode}
                  onChangeText={setNewCode}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#94a3b8"
                  style={styles.modalInput}
                  secureTextEntry={!showCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={styles.eyeToggle}
                  onPress={() => setShowCode((v) => !v)}
                >
                  {showCode ? <EyeOff color="#64748b" size={18} /> : <Eye color="#64748b" size={18} />}
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Confirm 6-Digit PIN</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={confirmCode}
                  onChangeText={setConfirmCode}
                  placeholder="Confirm 6-digit code"
                  placeholderTextColor="#94a3b8"
                  style={styles.modalInput}
                  secureTextEntry={!showCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={styles.eyeToggle}
                  onPress={() => setShowCode((v) => !v)}
                >
                  {showCode ? <EyeOff color="#64748b" size={18} /> : <Eye color="#64748b" size={18} />}
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  activeOpacity={0.8}
                  onPress={() => setManuallyHidden(true)}
                  disabled={creatingCode}
                >
                  <Text style={styles.secondaryBtnText}>Later</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1 }]}
                  activeOpacity={0.8}
                  onPress={handleCreateSecurityCode}
                  disabled={creatingCode || newCode.length < 6 || confirmCode.length < 6}
                >
                  {creatingCode ? (
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  govBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#e6f9f0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginBottom: 4,
  },
  govBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#065f46",
    letterSpacing: 0.5,
  },
  welcomeGreeting: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  agentCenterText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    position: "absolute",
    top: 9,
    right: 10,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#065f46",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#065f46",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  avatarVerifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#059669",
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  walletContainer: {
    marginBottom: 20,
    shadowColor: "#064e3b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  walletCard: {
    borderRadius: 24,
    padding: 20,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  cardTypeChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6ee7b7",
    letterSpacing: 0.6,
  },
  visibilityBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceSection: {
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#a7f3d0",
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 30,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  bankNameText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#a7f3d0",
  },
  accountNumberText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 1,
    marginVertical: 2,
  },
  accountHolderText: {
    fontSize: 11,
    color: "#cbd5e1",
    fontWeight: "500",
  },
  copyAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  copyAccountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  cardActionPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardActionPrimaryText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#064e3b",
  },
  cardActionSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 12,
    borderRadius: 14,
  },
  cardActionSecondaryText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },
  setupWalletCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  setupWalletIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  setupWalletTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  setupWalletDesc: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  setupWalletBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#065f46",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  setupWalletBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#065f46",
  },
  quickActionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  quickActionItem: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  quickActionSub: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
    textAlign: "center",
  },
  historyContainer: {
    gap: 8,
  },
  loadingWrap: {
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748b",
  },
  emptyContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  emptyActionBtn: {
    backgroundColor: "#065f46",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  txSubtitle: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 2,
  },
  txDate: {
    fontSize: 10,
    color: "#94a3b8",
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  txBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  txBadgeText: {
    fontSize: 10,
    fontWeight: "700",
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
    height: 48,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingRight: 40,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  eyeToggle: {
    position: "absolute",
    right: 12,
    padding: 4,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  secondaryBtn: {
    paddingVertical: 13,
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
    paddingVertical: 13,
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
