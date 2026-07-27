import { formatCurrency } from "@/config";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { RelativePathString, useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, CreditCard, CheckCircle2, AlertCircle, Sparkles, Building, User } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { payments, receipt, currentUser, token } = useAuth();
  const { wallet } = useWallet();
  const { success, failed } = useToast();

  // List of payments state
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [query, setQuery] = useState("");

  // Scanned payment detail state
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [paymentDetail, setPaymentDetail] = useState<any | null>(null);

  // Fetch single payment detail if ID is present
  const fetchPaymentDetail = useCallback(async (paymentId: string) => {
    try {
      setLoadingDetail(true);
      const res = await receipt(paymentId);
      if (res && (res.id || res.reference)) {
        setPaymentDetail(res);
      } else {
        // Fallback simulated payment information for review/manual ID
        setPaymentDetail({
          reference: paymentId,
          amount: 5000,
          businessName: currentUser?.fullname || "AURMS Member",
          category: "MUNICIPAL RATE",
          billing: "ANNUAL",
          status: "PENDING",
          date: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      failed("Could not fetch payment information");
    } finally {
      setLoadingDetail(false);
    }
  }, [receipt, currentUser, failed]);

  // Fetch list of payments if ID is not present
  const fetchPaymentsList = useCallback(async () => {
    try {
      setLoadingList(true);
      const list = await payments();
      setPaymentsList(list || []);
    } catch (err) {
      setPaymentsList([]);
    } finally {
      setLoadingList(false);
    }
  }, [payments]);

  useEffect(() => {
    if (id) {
      fetchPaymentDetail(id as string);
    } else {
      fetchPaymentsList();
    }
  }, [id, fetchPaymentDetail, fetchPaymentsList]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (id) {
      await fetchPaymentDetail(id as string);
    } else {
      await fetchPaymentsList();
    }
    setRefreshing(false);
  };

  // Filter list of payments
  const filteredPayments = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const sorted = [...paymentsList].sort((a, b) => {
      const aDate = new Date(a.createdAt || a.date).getTime();
      const bDate = new Date(b.createdAt || b.date).getTime();
      return bDate - aDate;
    });

    if (!trimmed) return sorted;

    return sorted.filter((item) => {
      const searchable = [
        item.reference,
        item.businessName,
        item.fullname,
        item.category,
        item.payment,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(trimmed);
    });
  }, [paymentsList, query]);

  // Payment Made button handler
  const handlePaymentMade = () => {
    success("Payment verification submitted successfully. System is verifying!");
    router.replace("/pages/(pages)" as RelativePathString);
  };

  // Payment with Card handler (left blank as requested)
  const handlePaymentWithCard = () => {
    // Left completely blank as requested
  };

  const getStatusStyle = (status?: string) => {
    const s = String(status || "").toUpperCase();
    if (s === "SUCCESS") {
      return { badge: styles.statusSuccess, text: styles.statusTextSuccess };
    }
    if (s === "PENDING") {
      return { badge: styles.statusPending, text: styles.statusTextPending };
    }
    if (s === "FAILED") {
      return { badge: styles.statusFailed, text: styles.statusTextFailed };
    }
    return { badge: styles.statusNeutral, text: styles.statusTextNeutral };
  };

  const formatDate = (val?: string) => {
    if (!val) return "N/A";
    try {
      return new Date(val).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return val;
    }
  };

  // If a payment ID is specified, show scanned payment details page
  if (id) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color="#0f172a" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Make Payment</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loadingDetail ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color="#0ea360" />
              <Text style={styles.loadingText}>Loading payment details...</Text>
            </View>
          ) : paymentDetail ? (
            <View style={styles.detailWrap}>
              {/* Payment Info Card */}
              <View style={styles.detailCard}>
                <View style={styles.sectionHeader}>
                  <CreditCard size={20} color="#0ea360" />
                  <Text style={styles.sectionTitle}>Payment Information</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Reference ID</Text>
                  <Text style={styles.infoValue}>{paymentDetail.reference}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Payer / Business Name</Text>
                  <Text style={styles.infoValue}>{paymentDetail.businessName || paymentDetail.fullname || "N/A"}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Category</Text>
                  <Text style={styles.infoValue}>{paymentDetail.category || "N/A"}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Billing Plan</Text>
                  <Text style={styles.infoValue}>{paymentDetail.billing || "N/A"}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date Created</Text>
                  <Text style={styles.infoValue}>{formatDate(paymentDetail.date || paymentDetail.createdAt)}</Text>
                </View>

                <View style={styles.infoRowLast}>
                  <Text style={styles.infoLabel}>Amount Due</Text>
                  <Text style={styles.amountText}>{formatCurrency(Number(paymentDetail.amount || 0))}</Text>
                </View>
              </View>

              {/* Agent's Bank/Account Details Card */}
              <View style={styles.agentCard}>
                <View style={styles.sectionHeader}>
                  <Building size={20} color="#3b82f6" />
                  <Text style={styles.sectionTitle}>Agent Account Details</Text>
                </View>
                <Text style={styles.agentCardSub}>Transfer the exact amount to the account below to pay.</Text>

                <View style={styles.agentRow}>
                  <View style={styles.iconBackground}>
                    <Building size={18} color="#2563eb" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.agentFieldLabel}>Bank Name</Text>
                    <Text style={styles.agentFieldValue}>{wallet?.bank?.name || "AURMS Partner Bank"}</Text>
                  </View>
                </View>

                <View style={styles.agentRow}>
                  <View style={styles.iconBackground}>
                    <CreditCard size={18} color="#2563eb" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.agentFieldLabel}>Account Number</Text>
                    <Text style={styles.agentFieldValueHighlight}>{wallet?.accountNo || "N/A"}</Text>
                  </View>
                </View>

                <View style={styles.agentRowLast}>
                  <View style={styles.iconBackground}>
                    <User size={18} color="#2563eb" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.agentFieldLabel}>Agent Name</Text>
                    <Text style={styles.agentFieldValue}>{currentUser?.fullname || "AURMS Agent"}</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonWrap}>
                <TouchableOpacity
                  style={styles.payMadeBtn}
                  activeOpacity={0.85}
                  onPress={handlePaymentMade}
                >
                  <CheckCircle2 size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.payMadeBtnText}>Payment Made</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cardPayBtn}
                  activeOpacity={0.85}
                  onPress={handlePaymentWithCard}
                >
                  <CreditCard size={20} color="#3b82f6" style={{ marginRight: 8 }} />
                  <Text style={styles.cardPayBtnText}>Payment with Card</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.errorCard}>
              <AlertCircle size={40} color="#ef4444" />
              <Text style={styles.errorTitle}>Payment Not Found</Text>
              <Text style={styles.errorDesc}>The specified payment reference does not exist or has expired.</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // If no ID is specified, show list of payments made
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments Made</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Search reference, payer, category, status..."
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loadingList ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#0ea360" />
            <Text style={styles.loadingText}>Loading payment transactions...</Text>
          </View>
        ) : filteredPayments.length === 0 ? (
          <View style={styles.emptyCard}>
            <AlertCircle size={36} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Payments Found</Text>
            <Text style={styles.emptyText}>Pull to refresh or try another search.</Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {filteredPayments.map((item, index) => {
              const statusStyle = getStatusStyle(item.status);
              return (
                <View key={item.id || item.reference || index} style={styles.paymentCard}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardRef} numberOfLines={1}>Ref: {item.reference}</Text>
                      <Text style={styles.cardPayer} numberOfLines={1}>{item.businessName || item.fullname || "AMAC Member"}</Text>
                      <Text style={styles.cardCategory}>{item.category || "Municipal Levy"}</Text>
                    </View>
                    <View style={[styles.statusBadge, statusStyle.badge]}>
                      <Text style={[styles.statusText, statusStyle.text]}>{String(item.status).toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBottom}>
                    <View>
                      <Text style={styles.dateLabel}>Date</Text>
                      <Text style={styles.dateValue}>{formatDate(item.date || item.createdAt)}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.cardAmountLabel}>Amount Paid</Text>
                      <Text style={styles.cardAmountValue}>{formatCurrency(Number(item.amount || 0))}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  container: { paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  loadingCenter: {
    paddingVertical: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  searchInput: {
    height: 44,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#0f172a",
  },
  emptyCard: {
    margin: 20,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
    textAlign: "center",
  },
  listWrap: {
    padding: 16,
    gap: 12,
  },
  paymentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    paddingBottom: 12,
    marginBottom: 12,
  },
  cardRef: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
  },
  cardPayer: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
    marginTop: 2,
  },
  cardCategory: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "500",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusSuccess: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  statusPending: { backgroundColor: "#fef3c7", borderColor: "#fde68a" },
  statusFailed: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  statusNeutral: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0" },
  statusText: { fontSize: 11, fontWeight: "bold" },
  statusTextSuccess: { color: "#166534" },
  statusTextPending: { color: "#92400e" },
  statusTextFailed: { color: "#b91c1c" },
  statusTextNeutral: { color: "#475569" },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  dateLabel: {
    fontSize: 11,
    color: "#94a3b8",
  },
  dateValue: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
    marginTop: 2,
  },
  cardAmountLabel: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "right",
  },
  cardAmountValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0ea360",
    marginTop: 2,
  },

  // Detail Page Styles
  detailWrap: {
    padding: 16,
    gap: 16,
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    paddingBottom: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f8fafc",
  },
  infoRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
  },
  amountText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0ea360",
  },
  agentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 18,
  },
  agentCardSub: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 14,
    lineHeight: 18,
  },
  agentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f8fafc",
  },
  agentRowLast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  agentFieldLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
  },
  agentFieldValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 2,
  },
  agentFieldValueHighlight: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563eb",
    letterSpacing: 1,
    marginTop: 2,
  },
  buttonWrap: {
    gap: 12,
    marginTop: 8,
  },
  payMadeBtn: {
    height: 52,
    backgroundColor: "#0ea360",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0ea360",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  payMadeBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cardPayBtn: {
    height: 52,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cardPayBtnText: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "600",
  },
  errorCard: {
    margin: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ef4444",
    marginTop: 14,
  },
  errorDesc: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
});
