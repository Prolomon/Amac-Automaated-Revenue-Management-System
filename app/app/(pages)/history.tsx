import { formatCurrency } from "@/config";
import { useAuth } from "@/hooks/use-auth";
import { getTransactions } from "@/lib/services/transaction";
import { Transaction } from "@/lib/types";
import { RelativePathString, useRouter } from "expo-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ChevronRight,
  History as HistoryIcon,
  Receipt,
  Search,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
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

export default function History() {
  const { currentUser, token } = useAuth();
  const [transactionList, setTransactionList] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [query, setQuery] = useState("");
  const router = useRouter();

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTransactions(
        currentUser?.uid as string,
        token as string,
        fromDate || undefined,
        toDate || undefined,
        query || undefined
      );
      const transactions = data.transactions
        ? Array.isArray(data.transactions)
          ? data.transactions
          : [data.transactions]
        : [];
      setTransactionList(transactions as Transaction[]);
    } catch {
      setTransactionList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, currentUser, fromDate, toDate, query]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const getStatusBadge = (rawStatus?: string) => {
    const s = String(rawStatus || "").toUpperCase();
    if (s === "SUCCESS") {
      return {
        bg: "#ecfdf5",
        text: "#059669",
        border: "#a7f3d0",
        label: "Settled",
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
            <HistoryIcon size={13} color="#065f46" />
            <Text style={styles.govTagText}>REVENUE AUDIT TRAIL</Text>
          </View>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <Text style={styles.headerSubtitle}>
            Verified receipts, bank deposits, and assessment remittances
          </Text>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputWrap}>
            <Search size={18} color="#94a3b8" />
            <TextInput
              placeholder="Search reference, narration, or type..."
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => setQuery("")}>
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Date range filter */}
          <View style={styles.dateFilterRow}>
            <View style={styles.dateInputBox}>
              <Calendar size={14} color="#64748b" />
              <TextInput
                placeholder="From: YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                style={styles.dateInput}
                value={fromDate}
                onChangeText={setFromDate}
              />
              {fromDate ? (
                <TouchableOpacity onPress={() => setFromDate("")}>
                  <X size={14} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.dateInputBox}>
              <Calendar size={14} color="#64748b" />
              <TextInput
                placeholder="To: YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                style={styles.dateInput}
                value={toDate}
                onChangeText={setToDate}
              />
              {toDate ? (
                <TouchableOpacity onPress={() => setToDate("")}>
                  <X size={14} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* Transactions List */}
        <View style={styles.listContainer}>
          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#0ea360" />
              <Text style={styles.loadingText}>Fetching records...</Text>
            </View>
          ) : transactionList.length === 0 ? (
            <View style={styles.emptyBox}>
              <Receipt size={40} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Transactions Found</Text>
              <Text style={styles.emptySubtitle}>
                {query || fromDate || toDate
                  ? "Try adjusting your search query or date range filters."
                  : "Settlements and payments will appear here."}
              </Text>
            </View>
          ) : (
            <View style={styles.transactionCardGroup}>
              {transactionList.map((tx, idx) => {
                const title = tx.metadata?.transactionType || tx.event || "Assessment Payment";
                const narration = tx.metadata?.narration || tx.metadata?.senderName || tx.reference || "-";
                const date = tx.createdAt
                  ? new Date(tx.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "-";
                const isCredit =
                  String(tx.metadata?.transactionType || "").toLowerCase().includes("credit") ||
                  String(tx.event || "").toLowerCase().includes("credit");
                const amount = tx.amount ? formatCurrency(Number(tx.amount)) : "₦0.00";
                const badge = getStatusBadge(tx.status);

                return (
                  <TouchableOpacity
                    key={tx.id || idx}
                    style={[
                      styles.transactionItem,
                      idx === transactionList.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/transaction/${tx.reference}` as RelativePathString)}
                  >
                    <View
                      style={[
                        styles.iconCircle,
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
                        {title}
                      </Text>
                      <Text style={styles.txNarration} numberOfLines={1}>
                        {narration}
                      </Text>
                      <Text style={styles.txDate}>{date}</Text>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[styles.txAmount, isCredit && { color: "#059669" }]}>
                        {isCredit ? "+" : "-"}
                        {amount}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: badge.bg, borderColor: badge.border },
                        ]}
                      >
                        <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>

                    <ChevronRight size={16} color="#cbd5e1" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                );
              })}
            </View>
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
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
  },
  dateFilterRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  dateInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 6,
  },
  dateInput: {
    flex: 1,
    fontSize: 12,
    color: "#0f172a",
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748b",
  },
  emptyBox: {
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
  emptySubtitle: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  transactionCardGroup: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  iconCircle: {
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
