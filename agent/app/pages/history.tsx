import { formatCurrency } from "@/config";
import { useAuth } from "@/hooks/use-auth";
import { Transaction } from "@/lib/types";
import { RelativePathString, useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ReceiptText,
  ShieldCheck,
  CreditCard,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@/hooks/use-wallet";
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

export default function HistoryScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { wallet, getTransactions, refresh } = useWallet();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Transaction[]>([]);
  const [fromDate, setFromDate] = useState(
    new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const loadPayments = useCallback(
    async (start?: string, end?: string) => {
      try {
        const userId = currentUser?.id || currentUser?.uid;
        if (!userId || !wallet) {
          setItems([]);
          return;
        }

        setLoading(true);
        const activeStart = start || fromDate;
        const activeEnd = end || toDate;
        const data = await getTransactions(
          wallet?.accountNo || "",
          activeStart,
          activeEnd,
          wallet?.token || ""
        );
        const sorted = [...(data?.transactions || [])].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.timeCreated || 0).getTime();
          const dateB = new Date(b.createdAt || b.timeCreated || 0).getTime();
          return dateB - dateA;
        });
        setItems(sorted);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [currentUser?.id, currentUser?.uid, getTransactions, wallet, fromDate, toDate]
  );

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  const getStatusBadge = (status?: string) => {
    const s = String(status || "").toUpperCase();
    if (s === "SUCCESS" || s === "COMPLETED" || s === "PAID") {
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

  const filteredItems = useMemo(() => items, [items]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.badgeWrap}>
            <ShieldCheck size={11} color="#065f46" />
            <Text style={styles.badgeText}>COLLECTIONS AUDIT</Text>
          </View>
          <Text style={styles.headerTitle}>Transaction History</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#065f46"
            colors={["#065f46"]}
          />
        }
      >
        {/* Date Filter Card */}
        <View style={styles.filterCard}>
          <View style={styles.filterCardHeader}>
            <Calendar size={14} color="#065f46" />
            <Text style={styles.filterCardLabel}>Date Range Filter</Text>
          </View>
          <View style={styles.filterInputsRow}>
            <TextInput
              placeholder="From: YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              value={fromDate}
              onChangeText={setFromDate}
              style={styles.dateInput}
            />
            <TextInput
              placeholder="To: YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              value={toDate}
              onChangeText={setToDate}
              style={styles.dateInput}
            />
            <TouchableOpacity
              style={styles.applyFilterBtn}
              activeOpacity={0.85}
              onPress={() => loadPayments(fromDate, toDate)}
            >
              <Text style={styles.applyFilterBtnText}>Filter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator color="#065f46" size="large" />
            <Text style={styles.stateText}>Loading collection records...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <ReceiptText size={28} color="#065f46" />
            </View>
            <Text style={styles.emptyTitle}>No Transactions Found</Text>
            <Text style={styles.emptyText}>
              There are no collections recorded for the selected date range. Try broadening your filter or collect a payment.
            </Text>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              activeOpacity={0.85}
              onPress={() => router.push("/pages/(pages)/pay" as RelativePathString)}
            >
              <CreditCard size={15} color="#fff" />
              <Text style={styles.primaryActionBtnText}>Collect Payment Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredItems.map((tx) => {
              const status = getStatusBadge(String(tx.status));
              const isCredit =
                String(tx.status).toUpperCase() === "SUCCESS" ||
                String(tx.narration || tx.event).toLowerCase().includes("credit");
              return (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.transactionCard}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push(`/pages/transaction/${tx.id}` as RelativePathString)
                  }
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
                      {tx.narration || tx.transactionCategory || "Field Collection"}
                    </Text>
                    <Text style={styles.txSub} numberOfLines={1}>
                      {tx.paymentVendorReference ||
                        tx.billingVendorReference ||
                        tx.recipientAccountName ||
                        "AMAC Revenue Settlement"}
                    </Text>
                    <Text style={styles.txDate}>
                      {tx.timeCreated
                        ? new Date(tx.timeCreated).toLocaleString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : tx.createdAt
                        ? new Date(tx.createdAt).toLocaleDateString()
                        : "-"}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.txAmount}>
                      {formatCurrency(Number(tx.amount || 0))}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: status.bg,
                          borderColor: status.border,
                        },
                      ]}
                    >
                      <Text style={[styles.statusBadgeText, { color: status.text }]}>
                        {status.label}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  filterCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    marginBottom: 16,
  },
  filterCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  filterCardLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#065f46",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterInputsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dateInput: {
    flex: 1,
    height: 42,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 12,
    color: "#0f172a",
  },
  applyFilterBtn: {
    height: 42,
    paddingHorizontal: 16,
    backgroundColor: "#065f46",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  applyFilterBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  stateWrap: {
    paddingVertical: 50,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  stateText: {
    fontSize: 13,
    color: "#64748b",
  },
  emptyWrap: {
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 24,
    alignItems: "center",
    marginTop: 10,
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
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
  },
  primaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#065f46",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  listContainer: {
    gap: 10,
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  txIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  txSub: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  txDate: {
    fontSize: 11,
    color: "#94a3b8",
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
