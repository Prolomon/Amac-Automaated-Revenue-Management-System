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
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  History,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
  UserCheck,
  Wallet,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {
  const router = useRouter();
  const { currentUser, token } = useAuth();
  const { success } = useToast();

  const [accountCopied, setAccountCopied] = useState(false);
  const [pidCopied, setPidCopied] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { wallet, toggleHide, hide, refresh, getTransactions } = useWallet();

  const walletBalance = Number(wallet?.balance || 0);
  const walletAccountNo = wallet?.accountNo || "";
  const walletBank = wallet?.bank?.name || "AMAC Partner Bank";
  const accountName = wallet?.accountName || currentUser?.fullname || "AMAC Taxpayer";

  const primaryProperty = currentUser?.property || (currentUser?.properties && currentUser.properties.length > 0 ? currentUser.properties[0] : null);

  const displayName = currentUser?.fullname || "Taxpayer";
  const userInitials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleCopyAccountNumber = async () => {
    if (!walletAccountNo) return;
    await Clipboard.setStringAsync(walletAccountNo);
    setAccountCopied(true);
    success("Account number copied");
    setTimeout(() => setAccountCopied(false), 2000);
  };

  const handleCopyPid = async () => {
    if (!primaryProperty?.pid) return;
    await Clipboard.setStringAsync(primaryProperty.pid);
    setPidCopied(true);
    success("Property ID (PID) copied");
    setTimeout(() => setPidCopied(false), 2000);
  };

  const loadTransactions = useCallback(async () => {
    try {
      const userId = currentUser?.id || currentUser?.uid;
      if (!userId || !wallet) {
        setTransactions([]);
        return;
      }
      setHistoryLoading(true);
      const data = await getTransactions(currentUser.uid || "", token);
      setTransactions(data?.transactions || []);
    } catch {
      setTransactions([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [currentUser?.id, currentUser?.uid, getTransactions, wallet, token]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refresh();
      await loadTransactions();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status?: TransactionStatus) => {
    const s = String(status || "").toUpperCase();
    if (s === "SUCCESS") {
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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0ea360"
            colors={["#0ea360"]}
          />
        }
      >
        {/* Top Executive Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.govBadge}>
              <ShieldCheck size={12} color="#065f46" />
              <Text style={styles.govBadgeText}>AMAC REVENUE PORTAL</Text>
            </View>
            <Text style={styles.welcomeGreeting} numberOfLines={1}>
              {displayName}
            </Text>
            {currentUser?.businessName ? (
              <Text style={styles.businessSubtitle} numberOfLines={1}>
                {currentUser.businessName}
              </Text>
            ) : null}
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
              onPress={() => router.push("/(pages)/profile" as RelativePathString)}
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
                  <Text style={styles.cardTypeChipText}>ASSESSMENT WALLET</Text>
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
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceValue}>
                  {hide ? "₦ ••••••••" : formatCurrency(walletBalance)}
                </Text>
              </View>

              {/* Virtual Account Section */}
              <View style={styles.accountCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bankNameText}>{walletBank}</Text>
                  <Text style={styles.accountNumberText}>
                    {walletAccountNo ? walletAccountNo.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3") : "Generating..."}
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
                  <Text style={[styles.copyAccountText, accountCopied && { color: "#059669" }]}>
                    {accountCopied ? "Copied" : "Copy"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* In-Card Quick Actions */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.cardActionPrimary}
                  activeOpacity={0.85}
                  onPress={() => router.push("/payment" as RelativePathString)}
                >
                  <CreditCard size={15} color="#064e3b" />
                  <Text style={styles.cardActionPrimaryText}>Pay Assessment</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cardActionSecondary}
                  activeOpacity={0.85}
                  onPress={() => router.push("/transfer" as RelativePathString)}
                >
                  <ArrowLeftRight size={15} color="#ffffff" />
                  <Text style={styles.cardActionSecondaryText}>Transfer</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.setupWalletCard}>
            <View style={styles.setupWalletIconWrap}>
              <Wallet size={28} color="#0ea360" />
            </View>
            <Text style={styles.setupWalletTitle}>Activate Virtual Account</Text>
            <Text style={styles.setupWalletDesc}>
              Complete your tax registration profile to generate an automated AMAC payment account number.
            </Text>
            <TouchableOpacity
              style={styles.setupWalletBtn}
              activeOpacity={0.85}
              onPress={() => router.push("/complete" as RelativePathString)}
            >
              <Text style={styles.setupWalletBtnText}>Complete Verification</Text>
              <ChevronRight size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Action Hub */} 
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Services</Text>
        </View>

        <View style={styles.quickActionGrid}>
          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => router.push("/payment" as RelativePathString)}
          >
            <View style={styles.quickActionIconWrap}>
              <CreditCard size={22} color="#064e3b" strokeWidth={2.2} />
            </View>
            <Text style={styles.quickActionTitle}>Payment Records</Text>
            <Text style={styles.quickActionSubtitle}>Instant Remittance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => router.push("agent" as RelativePathString)}
          >
            <View style={styles.quickActionIconWrap}>
              <UserCheck size={22} color="#064e3b" strokeWidth={2.2} />
            </View>
            <Text style={styles.quickActionTitle}>Assigned Agent</Text>
            <Text style={styles.quickActionSubtitle}>AMAC Revenue Officer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => router.push("/transfer" as RelativePathString)}
          >
            <View style={styles.quickActionIconWrap}>
              <ArrowLeftRight size={22} color="#064e3b" strokeWidth={2.2} />
            </View>
            <Text style={styles.quickActionTitle}>Transfer</Text>
            <Text style={styles.quickActionSubtitle}>Wallet Payout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => router.push("history" as RelativePathString)}
          >
            <View style={styles.quickActionIconWrap}>
              <History size={22} color="#064e3b" strokeWidth={2.2} />
            </View>
            <Text style={styles.quickActionTitle}>Receipts</Text>
            <Text style={styles.quickActionSubtitle}>Tax Audit Trail</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("history" as RelativePathString)}
          >
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionContainer}>
          {historyLoading ? (
            <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>Updating audit ledger...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Transactions Recorded</Text>
              <Text style={styles.emptySubtitle}>
                Payments and settlements will reflect here automatically.
              </Text>
            </View>
          ) : (
            transactions.slice(0, 5).map((tx, idx) => {
              const isCredit =
                String(tx.metadata?.transactionType || "").toLowerCase().includes("credit") ||
                String(tx.event || "").toLowerCase().includes("credit");
              const badge = getStatusBadge(tx.status);

              return (
                <TouchableOpacity
                  key={tx.id || idx}
                  style={[
                    styles.transactionItem,
                    idx === Math.min(transactions.length, 5) - 1 && { borderBottomWidth: 0 },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/transaction/${tx.reference}` as RelativePathString)}
                >
                  <View
                    style={[
                      styles.txIconCircle,
                      { backgroundColor: isCredit ? "#ecfdf5" : "#f1f5f9" },
                    ]}
                  >
                    {isCredit ? (
                      <ArrowDownLeft size={18} color="#059669" />
                    ) : (
                      <ArrowUpRight size={18} color="#475569" />
                    )}
                  </View>

                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.txTitle} numberOfLines={1}>
                      {tx.metadata?.transactionType || tx.event || "Assessment Payment"}
                    </Text>
                    <Text style={styles.txNarration} numberOfLines={1}>
                      {tx.metadata?.narration || tx.metadata?.senderName || tx.reference || "AMAC Tax Settlement"}
                    </Text>
                    <Text style={styles.txDate}>
                      {tx.createdAt
                        ? new Date(tx.createdAt).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Recent"}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.txAmount, isCredit && { color: "#059669" }]}>
                      {isCredit ? "+" : "-"}
                      {formatCurrency(Number(tx.amount || 0))}
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: badge.bg, borderColor: badge.border },
                      ]}
                    >
                      <Text style={[styles.statusPillText, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  govBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    gap: 4,
  },
  govBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#065f46",
    letterSpacing: 0.8,
  },
  welcomeGreeting: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  businessSubtitle: {
    fontSize: 13,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0ea360",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#064e3b",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 2,
    borderColor: "#059669",
  },
  avatarInitials: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  avatarVerifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#059669",
    borderRadius: 8,
  },
  walletContainer: {
    paddingHorizontal: 20,
    marginTop: 6,
  },
  walletCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#047857",
    shadowColor: "#064e3b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(6, 95, 70, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(110, 231, 183, 0.3)",
    gap: 6,
  },
  cardTypeChipText: {
    color: "#6ee7b7",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  visibilityBtn: {
    padding: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
  },
  balanceSection: {
    marginTop: 14,
  },
  balanceLabel: {
    fontSize: 12,
    color: "#a7f3d0",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 4,
    letterSpacing: -0.5,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.22)",
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  bankNameText: {
    color: "#6ee7b7",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  accountNumberText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginVertical: 2,
  },
  accountHolderText: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "500",
  },
  copyAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  copyAccountText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  cardActionPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardActionPrimaryText: {
    color: "#064e3b",
    fontSize: 13,
    fontWeight: "800",
  },
  cardActionSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  cardActionSecondaryText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  setupWalletCard: {
    marginHorizontal: 20,
    marginTop: 6,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  setupWalletIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  setupWalletTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  setupWalletDesc: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  setupWalletBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0ea360",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 14,
    width: "100%",
    gap: 6,
  },
  setupWalletBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "##064e3b",
  },
  quickActionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionItem: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  quickActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  quickActionSubtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  transactionContainer: {
    marginHorizontal: 20,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  loadingBox: {
    paddingVertical: 24,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    color: "#64748b",
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    textAlign: "center",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  txIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  txTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  txNarration: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  txDate: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
