import { formatCurrency } from "@/config";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { payNow } from "@/lib/services/payment";
import { Member } from "@/lib/types";
import { useState } from "react";
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
import {
  CreditCard,
  User,
  Search,
  AlertCircle,
  Printer,
} from "lucide-react-native";
import { RelativePathString, useRouter } from "expo-router";
import { printReceipt } from "@/utils/receipt-printer";

export default function PayScreen() {
  const router = useRouter();
  const { success, failed } = useToast();
  const { currentUser } = useAuth();

  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [memberDetail, setMemberDetail] = useState<Member | null>(null);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);

  const handleSearch = async () => {
    const trimmedId = searchId.trim();
    if (!trimmedId) {
      failed("Please enter a Member ID, Phone Number, or Payment ID");
      return;
    }

    setLoading(true);
    setMemberDetail(null);
    setPaymentsList([]);

    try {
      const res = await payNow(trimmedId);
      if (res.ok && res.data) {
        setMemberDetail(res.data.member || null);
        setPaymentsList(res.data.payments || []);
        success("Account verified successfully!");
      } else {
        failed(res.message || "Could not verify payment details");
      }
    } catch (err: any) {
      failed(err?.message || "Could not verify payment details");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    const trimmedId = searchId.trim();
    if (!trimmedId) return;
    setRefreshing(true);
    try {
      const res = await payNow(trimmedId);
      if (res.ok && res.data) {
        setMemberDetail(res.data.member || null);
        setPaymentsList(res.data.payments || []);
      }
    } catch (e) {
      // Ignore silent refresh error
    } finally {
      setRefreshing(false);
    }
  };

  const handlePayPress = (paymentId: string) => {
    router.push(`/pages/payment?id=${paymentId}` as RelativePathString);
  };

  const getStatusColor = (status?: string) => {
    const s = String(status || "").toUpperCase();
    if (s === "SUCCESS" || s === "COMPLETED") return "#0ea360";
    if (s === "PENDING") return "#f59e0b";
    return "#ef4444";
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

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pay Member Bills</Text>
        <Text style={styles.headerSubtitle}>
          Enter Member ID, phone number, or Payment ID to look up bills
        </Text>
      </View>

      {/* Input section at the top */}
      <View style={styles.searchSection}>
        <Text style={styles.label}>Account ID / Phone / Payment ID</Text>
        <View style={styles.searchInputRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g. USR-910283 or 08012345678"
            placeholderTextColor="#94a3b8"
            value={searchId}
            onChangeText={setSearchId}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Search color="#fff" size={20} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          memberDetail ? (
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          ) : undefined
        }
      >
        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#0ea360" />
            <Text style={styles.loadingText}>Verifying account details...</Text>
          </View>
        ) : memberDetail ? (
          <View style={styles.contentWrap}>
            {/* Member Details */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <User size={18} color="#0ea360" />
                <Text style={styles.cardTitle}>Member Profile Details</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Full Name</Text>
                <Text style={styles.detailValue}>{memberDetail.fullname}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email Address</Text>
                <Text style={styles.detailValue}>{memberDetail.email}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>
                  {memberDetail.phone || "N/A"}
                </Text>
              </View>

              {memberDetail.businessName && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Business Name</Text>
                  <Text style={styles.detailValue}>
                    {memberDetail.businessName}
                  </Text>
                </View>
              )}

              {memberDetail.category && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>
                    {memberDetail.category}
                  </Text>
                </View>
              )}
            </View>

            {/* Current Payments */}
            <Text style={styles.sectionHeading}>Active Payments Found</Text>

            {paymentsList.length === 0 ? (
              <View style={styles.emptyCard}>
                <AlertCircle size={32} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No Payments Listed</Text>
                <Text style={styles.emptyText}>
                  This member currently has no bills or transaction history.
                </Text>
              </View>
            ) : (
              <View style={styles.paymentsList}>
                {paymentsList.map((wrap, index) => {
                  const payment = wrap.payment || wrap;

                  const principal = payment.debt > 0 ? Number(payment.debt) : Number(payment.amount || 0);
                  const vat = principal * 0.075;
                  const charges = principal * 0.015;
                  const subtotal = principal + vat + charges;

                  // Get payment date and current date
                  const paymentDate = new Date(payment?.due);
                  const currentDate = new Date();

                  // Calculate days overdue
                  let daysOverdue = 0;
                  if (currentDate > paymentDate) {
                    const diffTime =
                      currentDate.getTime() - paymentDate.getTime(); // ✅ use getTime()
                    daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // convert ms → days
                  }

                  if (String(payment?.status).toLowerCase() === String('PAID').toLowerCase()) {
                    daysOverdue = 0;
                  }

                  // Penalty: 0.005% per day overdue
                  const penaltyRatePerDay = 0.00005; // 0.005% = 0.00005
                  const penalty = subtotal * penaltyRatePerDay * daysOverdue;

                  const totalAmount = subtotal + penalty;

                  return (
                    <View
                      key={payment.id || payment.reference || index}
                      style={styles.paymentItem}
                    >
                      <View style={styles.paymentHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.paymentTitle}>
                            {payment.pricing?.title || "Bill Payment"}
                          </Text>
                          <Text style={styles.paymentRef}>
                            Ref: {payment.reference}
                          </Text>
                          <Text style={styles.paymentDate}>
                            Due: {formatDate(payment.due || payment.date)}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            { borderColor: getStatusColor(payment.status) },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: getStatusColor(payment.status) },
                            ]}
                          >
                            {String(payment.status).toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.paymentBody}>
                        <View style={styles.amountCol}>
                          <Text style={styles.amountLabel}>Payment Amount</Text>
                          <Text style={styles.amountValue}>
                            {formatCurrency(totalAmount)}
                          </Text>
                        </View>

                        <View style={styles.amountCol}>
                          <Text style={styles.amountLabel}>Paid Amount</Text>
                          <Text
                            style={[
                              styles.amountValue,
                              { color: "#0ea360" },
                            ]}
                          >
                            {formatCurrency(payment.paid || 0)}
                          </Text>
                        </View>

                        <View style={styles.amountCol}>
                          <Text style={styles.amountLabel}>Debt</Text>
                          <Text
                            style={[styles.amountValue, { color: "#ef4444" }]}
                          >
                            {formatCurrency(payment.debt || 0)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.paymentBody}>
                        <View style={styles.amountCol}>
                          <Text style={styles.amountLabel}>Charges</Text>
                          <Text style={styles.amountValue}>
                            {formatCurrency(charges)}
                          </Text>
                        </View>

                        <View style={styles.amountCol}>
                          <Text style={styles.amountLabel}>Vat (7.5%)</Text>
                          <Text
                            style={[
                              styles.amountValue,
                              { color: "#0ea360" },
                            ]}
                          >
                            {formatCurrency(vat || 0)}
                          </Text>
                        </View>

                        <View style={styles.amountCol}>
                          <Text style={styles.amountLabel}>Penalty</Text>
                          <Text
                            style={[styles.amountValue, { color: "#ef4444" }]}
                          >
                            {formatCurrency(
                              penalty || 0)}
                          </Text>
                        </View>
                      </View>

                      {String(payment.status).toLowerCase() !== String('PAID').toLowerCase() ? (
                        <TouchableOpacity
                          style={styles.payNowBtn}
                          onPress={() =>
                            handlePayPress(payment.reference || payment.id)
                          }
                          activeOpacity={0.8}
                        >
                          <CreditCard
                            size={16}
                            color="#fff"
                            style={{ marginRight: 6 }}
                          />
                          <Text style={styles.payNowBtnText}>Pay Bill</Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.payNowBtn}
                            onPress={async () => {
                              try {
                                const p = payment;
                                const printAmt = p?.paid || p?.amount || 0;
                                await printReceipt({
                                  reference: p?.reference || p?.id || 'REF-N/A',
                                  amount: printAmt,
                                  paymentType: 'AMAC Revenue Fee',
                                  memberName: memberDetail?.fullname,
                                  memberId: memberDetail?.uid || memberDetail?.id,
                                  businessName: memberDetail?.businessName,
                                  category: memberDetail?.category,
                                  narration: payment?.payment || 'AMAC Revenue Fee',
                                  date: p?.date || new Date().toISOString(),
                                  status: p?.status || 'SUCCESS',
                                  agentName: currentUser?.fullname || currentUser?.name,
                                  center: memberDetail?.center || currentUser?.center,
                                });
                              } catch (err: any) {
                                failed("Could not print receipt: " + (err?.message || "Unknown error"));
                              }
                            }}
                            activeOpacity={0.8}
                          >
                            <Printer
                              size={16}
                              color="#fff"
                              style={{ marginRight: 6 }}
                            />
                            <Text style={styles.payNowBtnText}>Print Receipt</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <AlertCircle size={40} color="#94a3b8" />
            <Text style={styles.emptyStateText}>No Account Verified Yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Enter a valid Member ID, Phone Number, or Payment ID above and
              press search to verify.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "ghostwhite" },
  container: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
  searchSection: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  searchInputRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "ghostwhite",
    fontSize: 15,
    color: "#0f172a",
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#0ea360",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCenter: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748b",
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  contentWrap: {
    padding: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    paddingBottom: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0f172a",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#f8fafc",
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  paymentsList: {
    gap: 12,
  },
  paymentItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    paddingBottom: 10,
    marginBottom: 10,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
  },
  paymentRef: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  paymentDate: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  paymentBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  amountCol: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 11,
    color: "#94a3b8",
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 2,
  },
  payNowBtn: {
    height: 40,
    backgroundColor: "#0ea360",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  payNowBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
