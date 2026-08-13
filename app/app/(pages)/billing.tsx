import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { getPayments, makePayment } from "@/lib/services/payment";
import { getPricingByCenter } from "@/lib/services/pricing";
import { Payment, Pricing } from "@/lib/types";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

const VAT_RATE = 0.075;
const CHARGE_RATE = 0.015;
const PENALTY_RATE_PER_DAY = 0.00005;

/**
 * Single source of truth for the fee breakdown.
 * Previously this math was duplicated (once in the "Pay now" card button,
 * once inline in the modal render) and read slightly different fields
 * each time, which let the two silently drift apart.
 */
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
  const { failed, } = useToast();

  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [pricing, setPricing] = useState<Pricing[]>([]);

  const fetchPricing = useCallback(async () => {
    try {
      const data = await getPricingByCenter(currentUser?.center || "", token as string);
      if (data.ok && data.data) {
        setPricing(data.data);
      } else {
        setPricing([]);
        failed(data.message || "Failed to fetch pricing");
      }
    } catch (error: any) {
      setPricing([]);
      failed(error.message || "An error occurred while fetching pricing");
    }
  }, [currentUser?.center, token, failed]);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const formatAmount = (value: number, withSymbol = true) => {
    const formatted = value.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    });
    return withSymbol ? formatted : formatted.replace("₦", "").trim();
  };

  const formatDate = (value?: string | Date | null) => {
    if (!value) return "N/A";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
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
        failed(data.message || "Failed to fetch payments");
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

  const sortedPayments = [...allPayments].sort((left, right) => {
    const leftDate = new Date(left.due || left.date).getTime();
    const rightDate = new Date(right.due || right.date).getTime();
    return rightDate - leftDate;
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={styles.safe}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.back}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
            >
              <ArrowLeft color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Make Payment</Text>
            <View style={{ width: 32 }} />
          </View>
        </View>

        {loadingPayments ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#0ea360" />
          </View>
        ) : sortedPayments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No payments found</Text>
            <Text style={styles.emptyText}>
              Your payment history will appear here.
            </Text>
          </View>
        ) : (
          <View style={{ marginHorizontal: 14 }}>
            {sortedPayments.map((payment, index) => {
              const pricingInfo = pricing.find((item) => item.id === payment.payment);
              const statusLabel =
                payment.status.charAt(0).toUpperCase() + payment.status.slice(1).toLowerCase();
              const isSuccess = payment.status.toLowerCase() === "success";

              return (
                <View
                  key={payment.reference || `${payment.userId}-${index}`}
                  style={styles.paymentCard}
                >
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={styles.planLabel} numberOfLines={1}>
                        {pricingInfo?.title || "Payment"}
                      </Text>
                      {pricingInfo?.category ? (
                        <Text style={styles.paymentMeta} numberOfLines={1}>
                          {pricingInfo.category}
                        </Text>
                      ) : null}
                      <Text style={styles.paymentMeta}>
                        Due {formatDate(payment.due)}
                      </Text>
                    </View>

                    <View style={[styles.statusBadge, isSuccess ? styles.statusSuccess : styles.statusPending]}>
                      <Text style={[styles.statusText, isSuccess ? styles.statusTextSuccess : styles.statusTextPending]}>
                        {statusLabel}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.amountGrid}>
                    <View style={styles.amountBadge}>
                      <Text style={styles.amountLabel}>
                        Amount
                      </Text>
                      <Text style={styles.amountValue}>
                        {formatAmount(Number(computeBreakdown(payment).total) || 0)}
                      </Text>
                    </View>
                    <View style={styles.debtBadge}>
                      <Text style={styles.debtLabel}>Outstanding</Text>
                      <Text style={styles.debtValue}>
                        {formatAmount(Number(payment.debt) || 0, false)}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.payNowButton}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/checkout?reference=${payment.reference}`)}
                  >
                    <Text style={styles.payNowText}>Pay now</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "ghostwhite" },
  container: { paddingBottom: 40 },
  header: { paddingVertical: 22, paddingHorizontal: 14 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, color: "#000" },
  loadingCard: {
    marginHorizontal: 14,
    borderRadius: 10,
    padding: 16,
    backgroundColor: "#eaf9f0",
    borderWidth: 1,
    borderColor: "#d9f0e3",
  },
  emptyCard: {
    marginHorizontal: 14,
    borderRadius: 10,
    padding: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eef2f3",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  emptyText: { marginTop: 6, fontSize: 13, color: "#64748b" },
  paymentCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "column",
    gap: 14,
  },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  planLabel: { fontSize: 16, fontWeight: "800", color: "#0f172a", lineHeight: 20 },
  paymentMeta: { marginTop: 4, fontSize: 13, color: "#64748b", lineHeight: 18 },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  statusPending: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  statusText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
  statusTextSuccess: { color: "#166534" },
  statusTextPending: { color: "#1d4ed8" },
  amountGrid: {
    flexDirection: "row",
    gap: 10,
  },
  amountBadge: {
    flex: 1,
    backgroundColor: "#dcfce7",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    minWidth: 70,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0ea360",
  },
  amountLabel: { fontSize: 12, color: "#0f172a", fontWeight: "600" },
  amountValue: { fontSize: 16, color: "#0ea360", fontWeight: "700", marginTop: 2 },
  debtBadge: {
    flex: 1,
    backgroundColor: "#fee2e2",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    minWidth: 70,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dc2626",
  },
  debtLabel: { fontSize: 12, color: "#0f172a", fontWeight: "600" },
  debtValue: { fontSize: 16, color: "#dc2626", fontWeight: "700", marginTop: 2 },
  payNowButton: {
    width: "100%",
    backgroundColor: "#0ea360",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  payNowText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  categoryBadge: { backgroundColor: "#f1f5f9", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
});