import { formatCurrency } from "@/config";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getMember } from "@/lib/services/member";
import { getPayments, getRecords } from "@/lib/services/payment";
import { Member, Payment } from "@/lib/types";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { RelativePathString, useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Copy,
  CreditCard,
  FileText,
  History,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MemberDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { failed, success } = useToast();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Tab view toggler: "payments" | "history"
  const [activeTab, setActiveTab] = useState<"payments" | "history">("payments");

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      // 1. Fetch member profile
      const memRes = await getMember(id, token as string);
      setMember(memRes?.data || null);

      // 2. Fetch payments
      try {
        const payRes = await getPayments(id, token as string);
        if (payRes && payRes.ok) {
          setPayments(payRes.payments || []);
        } else {
          setPayments([]);
        }
      } catch (payErr: any) {
        setPayments([]);
      }

      // 3. Fetch transactions
      try {
        const txRes = await getRecords(id, token as string);
        if (txRes && Array.isArray(txRes.transactions)) {
          setTransactions(txRes.transactions);
        } else if (Array.isArray(txRes)) {
          setTransactions(txRes);
        } else {
          setTransactions([]);
        }
      } catch (txErr: any) {
        setTransactions([]);
      }
    } catch (err: any) {
      failed(err.message || "Failed to load member profile details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, token, failed]);

  useEffect(() => {
    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const copyToClipboard = async (text?: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    success("Copied to clipboard");
  };

  const formatLocation = (loc: any) => {
    if (!loc) return "Abuja Municipal, FCT";
    if (typeof loc === "string") return loc;
    const parts = [loc.address, loc.city, loc.state, loc.zipcode].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Abuja Municipal, FCT";
  };

  const getStatusBadge = (status?: string) => {
    const s = String(status || "").toUpperCase();
    if (s === "PAID" || s === "SUCCESS" || s === "COMPLETED") {
      return {
        bg: "#ecfdf5",
        border: "#a7f3d0",
        text: "#065f46",
        label: "PAID",
      };
    }
    if (s === "PENDING") {
      return {
        bg: "#fffbeb",
        border: "#fde68a",
        text: "#b45309",
        label: "PENDING",
      };
    }
    return {
      bg: "#fef2f2",
      border: "#fecaca",
      text: "#dc2626",
      label: s || "UNPAID",
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#065f46" />
          <Text style={styles.loadingText}>Loading taxpayer record...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft color="#0f172a" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Entity Record</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerBox}>
          <AlertCircle size={44} color="#ef4444" />
          <Text style={styles.errorTitle}>Taxpayer Not Found</Text>
          <Text style={styles.errorSub}>
            Unable to locate entity details for the specified reference.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft color="#0f172a" size={20} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Taxpayer Record</Text>
          <Text style={styles.headerSub}>AMAC Municipal Revenue Service</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#065f46"]}
            tintColor="#065f46"
          />
        }
      >
        {/* Executive Hero Card */}
        <LinearGradient
          colors={["#064e3b", "#022c22"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>
                {(member.fullname || "M").charAt(0).toUpperCase()}
              </Text>
              <View style={styles.avatarVerified}>
                <CheckCircle2 size={12} color="#ffffff" />
              </View>
            </View>

            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.heroName} numberOfLines={1}>
                {member.fullname}
              </Text>
              {member.businessName ? (
                <Text style={styles.heroBusiness} numberOfLines={1}>
                  {member.businessName}
                </Text>
              ) : null}
              <View style={styles.heroTagRow}>
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>
                    {member.category || "General"} • {member.type || "Individual"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* UID Bar */}
          <View style={styles.uidBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.uidLabel}>TAXPAYER IDENTIFICATION NUMBER (UID)</Text>
              <Text style={styles.uidValue}>{member.uid || member.id}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => copyToClipboard(member.uid || member.id)}
              activeOpacity={0.7}
            >
              <Copy size={14} color="#a7f3d0" />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Contact & Registration Information */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <ShieldCheck size={16} color="#065f46" />
            <Text style={styles.cardHeaderText}>Verification & Contact Info</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Mail size={16} color="#065f46" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{member.email || "Not specified"}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Phone size={16} color="#065f46" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{member.phone || "Not specified"}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Briefcase size={16} color="#065f46" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Classification</Text>
              <Text style={styles.infoValue}>
                {member.type || "Individual"} ({member.category || "Standard Commercial"})
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.iconBox}>
              <MapPin size={16} color="#065f46" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Premises / Address</Text>
              <Text style={styles.infoValue}>{formatLocation(member.location)}</Text>
            </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "payments" && styles.tabButtonActive]}
            onPress={() => setActiveTab("payments")}
            activeOpacity={0.8}
          >
            <CreditCard
              size={16}
              color={activeTab === "payments" ? "#ffffff" : "#64748b"}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "payments" && styles.tabButtonTextActive,
              ]}
            >
              Demand Notices ({payments.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "history" && styles.tabButtonActive]}
            onPress={() => setActiveTab("history")}
            activeOpacity={0.8}
          >
            <History
              size={16}
              color={activeTab === "history" ? "#ffffff" : "#64748b"}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "history" && styles.tabButtonTextActive,
              ]}
            >
              Payment Logs ({transactions.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === "payments" ? (
          payments.length === 0 ? (
            <View style={styles.emptyCard}>
              <FileText size={40} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Demand Notices</Text>
              <Text style={styles.emptySub}>
                There are currently no active billing assessments issued to this entity.
              </Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {payments.map((p, index) => {
                const statusMeta = getStatusBadge(p.status);

                const principal = Number(p.debt > 0 ? p.debt : p.amount);
                const vat = principal * 0.075;
                const charges = principal * 0.015;
                const subtotal = principal + vat + charges;

                const paymentDate = new Date(p.date);
                const currentDate = new Date();
                let daysOverdue = 0;
                if (currentDate > paymentDate) {
                  const diffTime = currentDate.getTime() - paymentDate.getTime();
                  daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                }

                const penaltyRatePerDay = 0.00005;
                const penalty = subtotal * penaltyRatePerDay * daysOverdue;
                const totalAmount = subtotal + penalty;

                return (
                  <View key={p.id || p.reference || index} style={styles.billCard}>
                    <View style={styles.billCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.billTitle}>
                          {p.pricing?.title || "Assessment Notice"}
                        </Text>
                        <Text style={styles.billRef}>Ref: {p.reference}</Text>
                      </View>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: statusMeta.bg,
                            borderColor: statusMeta.border,
                          },
                        ]}
                      >
                        <Text style={[styles.badgeText, { color: statusMeta.text }]}>
                          {statusMeta.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.billFinancials}>
                      <View style={styles.financeCol}>
                        <Text style={styles.financeLabel}>Total Assessment</Text>
                        <Text style={styles.financeValue}>{formatCurrency(totalAmount)}</Text>
                      </View>
                      <View style={styles.financeCol}>
                        <Text style={styles.financeLabel}>Balance Outstanding</Text>
                        <Text style={[styles.financeValue, { color: "#dc2626" }]}>
                          {formatCurrency(
                            p.debt > 0 ? p.debt : Math.max(0, p.amount - (p.paid || 0))
                          )}
                        </Text>
                      </View>
                    </View>

                    {daysOverdue > 0 && (
                      <View style={styles.overdueAlert}>
                        <Text style={styles.overdueText}>
                          ⚠️ Overdue by {daysOverdue} days • Statutory surcharge applies
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.collectActionBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        router.push(
                          `/pages/payment?id=${p.reference || p.id}` as RelativePathString
                        );
                      }}
                    >
                      <Text style={styles.collectActionBtnText}>Collect Payment Now</Text>
                      <ChevronRight size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )
        ) : transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <History size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Transaction History</Text>
            <Text style={styles.emptySub}>
              No verified settlement or collection receipts have been recorded yet.
            </Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {transactions.map((tx, index) => {
              const statusMeta = getStatusBadge(tx.status);
              return (
                <TouchableOpacity
                  key={tx.id || index}
                  style={styles.txCard}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push(`/pages/transaction/${tx.id}` as RelativePathString)
                  }
                >
                  <View style={styles.txLeftIcon}>
                    <ArrowDownLeft size={18} color="#065f46" />
                  </View>

                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.txTitle} numberOfLines={1}>
                      {tx.narration || tx.transactionCategory || tx.name || "AMAC Fee Collection"}
                    </Text>
                    <Text style={styles.txSub}>
                      {tx.createdAt || tx.timeCreated || tx.date
                        ? new Date(
                            tx.createdAt || tx.timeCreated || tx.date
                          ).toLocaleDateString()
                        : "Verified Record"}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.txAmount}>
                      {formatCurrency(Number(tx.amount || 0))}
                    </Text>
                    <View
                      style={[
                        styles.miniBadge,
                        {
                          backgroundColor: statusMeta.bg,
                          borderColor: statusMeta.border,
                        },
                      ]}
                    >
                      <Text style={[styles.miniBadgeText, { color: statusMeta.text }]}>
                        {statusMeta.label}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  headerSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  errorSub: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },

  // Hero Card
  heroCard: {
    borderRadius: 22,
    padding: 20,
    shadowColor: "#064e3b",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#065f46",
  },
  avatarVerified: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#065f46",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#064e3b",
  },
  heroName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  heroBusiness: {
    fontSize: 13,
    color: "#a7f3d0",
    fontWeight: "600",
    marginTop: 2,
  },
  heroTagRow: {
    marginTop: 6,
    flexDirection: "row",
  },
  categoryChip: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  categoryChipText: {
    fontSize: 11,
    color: "#ffffff",
    fontWeight: "600",
  },
  uidBar: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  uidLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#a7f3d0",
    letterSpacing: 0.6,
  },
  uidValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },

  // Info Card
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 18,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 6,
  },
  cardHeaderText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f8fafc",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 2,
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: "#065f46",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  tabButtonTextActive: {
    color: "#ffffff",
  },

  // Items List
  itemsList: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  emptySub: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },

  // Demand Notice Bill Cards
  billCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    gap: 12,
  },
  billCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  billTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  billRef: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontFamily: "monospace",
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  billFinancials: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
  },
  financeCol: {
    flex: 1,
  },
  financeLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  financeValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  overdueAlert: {
    backgroundColor: "#fef2f2",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  overdueText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#dc2626",
  },
  collectActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#065f46",
    borderRadius: 12,
    paddingVertical: 12,
  },
  collectActionBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Transaction Cards
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
  },
  txLeftIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
  },
  txTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  txSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  miniBadge: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
});
