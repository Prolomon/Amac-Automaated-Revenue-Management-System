import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getPayments } from "@/lib/services/payment";
import { getPricingByCenter } from "@/lib/services/pricing";
import { Payment, Pricing } from "@/lib/types";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  FileText,
  Receipt,
  ShieldAlert,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VAT_RATE = 0.075;
const CHARGE_RATE = 0.015;
const PENALTY_RATE_PER_DAY = 0.00005;

function computeBreakdown(payment: Payment | null) {
  if (!payment) {
    return { principal: 0, vat: 0, charges: 0, subtotal: 0, daysOverdue: 0, penalty: 0, total: 0 };
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;

  const principal = round2(
    Number(Number(payment.debt) > 0 ? payment.debt : payment.amount || 0)
  );
  const vat = round2(principal * VAT_RATE);
  const charges = round2(principal * CHARGE_RATE);
  const subtotal = round2(principal + vat + charges);

  const paymentDate = new Date(payment.due || payment.date || "");
  const currentDate = new Date();

  let daysOverdue = 0;
  if (!Number.isNaN(paymentDate.getTime()) && currentDate > paymentDate) {
    daysOverdue = Math.floor(
      (currentDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  const penalty = round2(subtotal * PENALTY_RATE_PER_DAY * daysOverdue);
  const total = round2(subtotal + penalty);

  return { principal, vat, charges, subtotal, daysOverdue, penalty, total };
}

export default function MakePayment() {
  const router = useRouter();
  const { currentUser, token } = useAuth();
  const { failed, success } = useToast();

  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "PAID">("ALL");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const fetchPricing = useCallback(async () => {
    try {
      const data = await getPricingByCenter(currentUser?.center || "", token as string);
      if (data.ok && data.data) {
        setPricing(data.data);
      } else {
        setPricing([]);
      }
    } catch {
      setPricing([]);
    }
  }, [currentUser?.center, token]);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const formatAmount = (value: number) => {
    return value.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    });
  };

  const formatDate = (value?: string | Date | null) => {
    if (!value) return "N/A";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleDateString("en-NG", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  const fetchPayments = useCallback(async () => {
    try {
      if (!currentUser?.uid) {
        setAllPayments([]);
        return;
      }

      setLoadingPayments(true);
      const data = await getPayments(currentUser.uid, token as string);

      if (data.ok && data.payments) {
        setAllPayments(data.payments);
      } else {
        setAllPayments([]);
      }
    } catch (error: any) {
      setAllPayments([]);
      failed(error.message || "An error occurred while fetching payments");
    } finally {
      setLoadingPayments(false);
    }
  }, [currentUser?.uid, token, failed]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  const handleCopyRef = async (ref: string) => {
    await Clipboard.setStringAsync(ref);
    setCopiedRef(ref);
    success("Demand Notice Reference copied");
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const sortedPayments = useMemo(() => {
    return [...allPayments].sort((left, right) => {
      const leftDate = new Date(left.due || left.date).getTime();
      const rightDate = new Date(right.due || right.date).getTime();
      return rightDate - leftDate;
    });
  }, [allPayments]);

  const filteredPayments = useMemo(() => {
    if (filter === "ALL") return sortedPayments;
    if (filter === "PAID") {
      return sortedPayments.filter(
        (p) => String(p.status).toLowerCase() === "success" || String(p.status).toLowerCase() === "paid"
      );
    }
    return sortedPayments.filter(
      (p) => String(p.status).toLowerCase() !== "success" && String(p.status).toLowerCase() !== "paid"
    );
  }, [sortedPayments, filter]);

  // Summary Metrics
  const totalOutstanding = useMemo(() => {
    return sortedPayments
      .filter((p) => String(p.status).toLowerCase() !== "success" && String(p.status).toLowerCase() !== "paid")
      .reduce((acc, curr) => acc + computeBreakdown(curr).total, 0);
  }, [sortedPayments]);

  const pendingCount = useMemo(() => {
    return sortedPayments.filter(
      (p) => String(p.status).toLowerCase() !== "success" && String(p.status).toLowerCase() !== "paid"
    ).length;
  }, [sortedPayments]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0ea360"
              colors={["#0ea360"]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.govTag}>
              <Receipt size={13} color="#065f46" />
              <Text style={styles.govTagText}>REVENUE DEMAND NOTICES</Text>
            </View>
            <Text style={styles.headerTitle}>Official Assessments</Text>
            <Text style={styles.headerSubtitle}>
              Statutory council taxes, tenements, and municipal levies
            </Text>
          </View>

          {/* Metrics summary cards */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Due</Text>
              <Text style={styles.metricValue}>{formatAmount(totalOutstanding)}</Text>
              <Text style={styles.metricHint}>Includes VAT & Statutory fees</Text>
            </View>

            <View style={styles.metricCardSecondary}>
              <Text style={styles.metricLabelSec}>Active Notices</Text>
              <Text style={styles.metricValueSec}>{pendingCount}</Text>
              <Text style={styles.metricHintSec}>
                {pendingCount === 0 ? "All bills settled" : "Action required"}
              </Text>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterPill, filter === "ALL" && styles.filterPillActive]}
              activeOpacity={0.8}
              onPress={() => setFilter("ALL")}
            >
              <Text style={[styles.filterPillText, filter === "ALL" && styles.filterPillTextActive]}>
                All ({sortedPayments.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, filter === "PENDING" && styles.filterPillActive]}
              activeOpacity={0.8}
              onPress={() => setFilter("PENDING")}
            >
              <Text style={[styles.filterPillText, filter === "PENDING" && styles.filterPillTextActive]}>
                Due / Unpaid ({pendingCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, filter === "PAID" && styles.filterPillActive]}
              activeOpacity={0.8}
              onPress={() => setFilter("PAID")}
            >
              <Text style={[styles.filterPillText, filter === "PAID" && styles.filterPillTextActive]}>
                Paid ({sortedPayments.length - pendingCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Payments list */}
          {loadingPayments ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#0ea360" />
              <Text style={styles.loadingText}>Fetching tax notices...</Text>
            </View>
          ) : filteredPayments.length === 0 ? (
            <View style={styles.emptyCard}>
              <FileText size={40} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Assessments Found</Text>
              <Text style={styles.emptyText}>
                {filter === "PAID"
                  ? "You have no settled demand notices."
                  : filter === "PENDING"
                  ? "Great! You have no outstanding demand notices."
                  : "Demand notices issued by AMAC will appear here."}
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredPayments.map((payment, index) => {
                const pricingInfo = pricing.find((item) => item.id === payment.payment);
                const isPaid =
                  payment.status?.toLowerCase() === "success" || payment.status?.toLowerCase() === "paid";
                const breakdown = computeBreakdown(payment);
                const isOverdue = breakdown.daysOverdue > 0 && !isPaid;

                return (
                  <View
                    key={payment.reference || `${payment.userId}-${index}`}
                    style={styles.paymentCard}
                  >
                    {/* Top Row: Title & Status Badge */}
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.assessmentTitle} numberOfLines={1}>
                          {pricingInfo?.title || payment.pricing?.title || "Council Assessment"}
                        </Text>
                        <View style={styles.metaRow}>
                          {pricingInfo?.category ? (
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryBadgeText}>
                                {pricingInfo.category}
                              </Text>
                            </View>
                          ) : null}

                          <TouchableOpacity
                            style={styles.refBadge}
                            activeOpacity={0.7}
                            onPress={() => handleCopyRef(payment.reference || `REF-${index}`)}
                          >
                            <Text style={styles.refBadgeText}>
                              {payment.reference || `REF-${index}`}
                            </Text>
                            <Copy
                              size={10}
                              color={copiedRef === payment.reference ? "#0ea360" : "#64748b"}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          isPaid
                            ? styles.statusPaid
                            : isOverdue
                            ? styles.statusOverdue
                            : styles.statusDue,
                        ]}
                      >
                        {isPaid ? (
                          <CheckCircle2 size={12} color="#059669" />
                        ) : isOverdue ? (
                          <ShieldAlert size={12} color="#dc2626" />
                        ) : (
                          <Clock size={12} color="#d97706" />
                        )}
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isPaid
                              ? { color: "#059669" }
                              : isOverdue
                              ? { color: "#dc2626" }
                              : { color: "#d97706" },
                          ]}
                        >
                          {isPaid ? "Paid" : isOverdue ? "Overdue" : "Pending"}
                        </Text>
                      </View>
                    </View>

                    {/* Due Date Row */}
                    <View style={styles.dueRow}>
                      <Calendar size={13} color="#64748b" />
                      <Text style={styles.dueText}>
                        Due Date: <Text style={{ fontWeight: "700", color: "#0f172a" }}>{formatDate(payment.due)}</Text>
                      </Text>
                      {isOverdue ? (
                        <Text style={styles.overdueDaysText}>
                          ({breakdown.daysOverdue} days past due)
                        </Text>
                      ) : null}
                    </View>

                    {/* Breakdown Box */}
                    <View style={styles.breakdownBox}>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Principal Assessment</Text>
                        <Text style={styles.breakdownValue}>{formatAmount(breakdown.principal)}</Text>
                      </View>

                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>VAT (7.5%)</Text>
                        <Text style={styles.breakdownValue}>{formatAmount(breakdown.vat)}</Text>
                      </View>

                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Admin & Processing</Text>
                        <Text style={styles.breakdownValue}>{formatAmount(breakdown.charges)}</Text>
                      </View>

                      {breakdown.penalty > 0 ? (
                        <View style={styles.breakdownRow}>
                          <Text style={[styles.breakdownLabel, { color: "#dc2626" }]}>
                            Statutory Overdue Penalty
                          </Text>
                          <Text style={[styles.breakdownValue, { color: "#dc2626" }]}>
                            +{formatAmount(breakdown.penalty)}
                          </Text>
                        </View>
                      ) : null}

                      <View style={styles.divider} />

                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Payable</Text>
                        <Text style={styles.totalValue}>{formatAmount(breakdown.total)}</Text>
                      </View>
                    </View>

                    {/* Action Button */}
                    {!isPaid ? (
                      <TouchableOpacity
                        style={styles.payBtn}
                        activeOpacity={0.85}
                        onPress={() => router.push(`/checkout?reference=${payment.reference}`)}
                      >
                        <CreditCard size={16} color="#ffffff" />
                        <Text style={styles.payBtnText}>Pay Assessment ({formatAmount(breakdown.total)})</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.settledBanner}>
                        <CheckCircle2 size={16} color="#059669" />
                        <Text style={styles.settledBannerText}>Settled & Verified</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  govTag: {
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
  govTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#065f46",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1.4,
    backgroundColor: "#064e3b",
    borderRadius: 18,
    padding: 16,
  },
  metricLabel: {
    color: "#a7f3d0",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValue: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: -0.3,
  },
  metricHint: {
    color: "#6ee7b7",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "500",
  },
  metricCardSecondary: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metricLabelSec: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValueSec: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: -0.3,
  },
  metricHintSec: {
    color: "#0ea360",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterPillActive: {
    backgroundColor: "#0ea360",
    borderColor: "#0ea360",
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  filterPillTextActive: {
    color: "#ffffff",
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748b",
  },
  emptyCard: {
    marginHorizontal: 20,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  listContainer: {
    paddingHorizontal: 20,
    gap: 14,
  },
  paymentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
  },
  categoryBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  refBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 4,
  },
  refBadgeText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
  },
  statusPaid: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  statusOverdue: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  statusDue: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  dueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  dueText: {
    fontSize: 12,
    color: "#64748b",
  },
  overdueDaysText: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "700",
  },
  breakdownBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  breakdownLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 2,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0ea360",
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0ea360",
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 14,
    gap: 8,
    shadowColor: "#0ea360",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  payBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  settledBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ecfdf5",
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  settledBannerText: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "700",
  },
});