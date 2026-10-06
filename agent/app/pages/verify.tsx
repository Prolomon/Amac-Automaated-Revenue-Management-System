import { formatCurrency } from "@/config";
import { useToast } from "@/hooks/use-toast";
import { verifyPayment } from "@/lib/services/payment";
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
  ArrowLeft,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  X,
  FileCheck,
} from "lucide-react-native";
import { RelativePathString, useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { printReceipt } from "@/utils/receipt-printer";

// Strips a leading "PAY|" (case-insensitive) so we never end up with "PAY|PAY|..."
const stripPrefix = (id: string) => id.replace(/^PAY\|/i, "");

export default function VerifyPaymentScreen() {
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
      failed("Please enter a Payment ID or Reference");
      return;
    }

    setLoading(true);
    setMemberDetail(null);
    setPaymentsList([]);

    try {
      const res = await verifyPayment("PAY|" + stripPrefix(trimmedId));
      if (res.ok && res.payment) {
        setMemberDetail(res.payment.member || null);
        setPaymentsList([res.payment]);
        success("Payment verification successful!");
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
      const res = await verifyPayment("PAY|" + stripPrefix(trimmedId));
      if (res.ok && res.payment) {
        setMemberDetail(res.payment.member || null);
        setPaymentsList([res.payment]);
      }
    } catch {
      // Ignore
    } finally {
      setRefreshing(false);
    }
  };

  const handlePayPress = (paymentId: string) => {
    router.push(`/pages/payment?id=${paymentId}` as RelativePathString);
  };

  const getStatusBadge = (status?: string) => {
    const s = String(status || "").toUpperCase();
    if (s === "SUCCESS" || s === "PAID" || s === "COMPLETED") {
      return {
        bg: "#ecfdf5",
        text: "#059669",
        border: "#a7f3d0",
        label: "Verified Paid",
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
      label: "Unpaid / Failed",
    };
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
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.badgeWrap}>
            <ShieldCheck size={11} color="#065f46" />
            <Text style={styles.badgeText}>PAYMENT AUTHENTICATION</Text>
          </View>
          <Text style={styles.headerTitle}>Verify Assessment</Text>
        </View>
      </View>

      {/* Input Section */}
      <View style={styles.searchSection}>
        <Text style={styles.searchLabel}>Payment Reference ID</Text>
        <View style={styles.searchInputRow}>
          <View style={styles.inputWrapper}>
            <Search size={18} color="#94a3b8" style={styles.inputSearchIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. PAY|20260708012345678"
              placeholderTextColor="#94a3b8"
              value={searchId}
              onChangeText={setSearchId}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            {searchId.length > 0 && (
              <TouchableOpacity onPress={() => setSearchId("")} hitSlop={10}>
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={handleSearch}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.searchBtnText}>Verify</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          memberDetail ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#065f46"
              colors={["#065f46"]}
            />
          ) : undefined
        }
      >
        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#065f46" />
            <Text style={styles.loadingText}>Validating payment authenticity...</Text>
          </View>
        ) : memberDetail ? (
          <View style={styles.contentWrap}>
            {/* Taxpayer Information Card */}
            <View style={styles.memberCard}>
              <View style={styles.memberCardTop}>
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarInitial}>
                    {(memberDetail.fullname || "T").charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={styles.verifiedTag}>
                    <ShieldCheck size={11} color="#059669" />
                    <Text style={styles.verifiedTagText}>Billed Taxpayer</Text>
                  </View>
                  <Text style={styles.memberName} numberOfLines={1}>{memberDetail.fullname}</Text>
                  {memberDetail.businessName ? (
                    <Text style={styles.memberBusiness} numberOfLines={1}>
                      {memberDetail.businessName}
                    </Text>
                  ) : null}
                  <Text style={styles.memberUid}>ID: {memberDetail.uid || "-"}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.memberDetailsGrid}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email Address</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{memberDetail.email || "N/A"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone Number</Text>
                  <Text style={styles.detailValue}>{memberDetail.phone || "N/A"}</Text>
                </View>
              </View>
            </View>

            {/* Verified Payment Records */}
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionHeading}>Authentication Result</Text>
              <View style={styles.authBadge}>
                <FileCheck size={13} color="#059669" />
                <Text style={styles.authBadgeText}>Authentic Record</Text>
              </View>
            </View>

            {paymentsList.map((payment, index) => {
              const status = getStatusBadge(payment.status);
              const isPaid =
                String(payment.status).toUpperCase() === "PAID" ||
                String(payment.status).toUpperCase() === "SUCCESS";
              const amount = Number(payment.paid || payment.amount || 0);

              return (
                <View key={payment.id || payment.reference || index} style={styles.paymentCard}>
                  <View style={styles.paymentCardHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.paymentTitle} numberOfLines={1}>
                        {payment.pricing?.title || payment.payment || "Municipal Assessment"}
                      </Text>
                      <Text style={styles.paymentRef}>Ref: {payment.reference}</Text>
                      <View style={styles.dueDateRow}>
                        <Calendar size={12} color="#64748b" />
                        <Text style={styles.paymentDate}>
                          Processed: {formatDate(payment.date || payment.createdAt)}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: status.bg, borderColor: status.border },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: status.text }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.breakdownBox}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Registered Amount</Text>
                      <Text style={styles.breakdownValue}>{formatCurrency(amount)}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Payment Status</Text>
                      <Text style={[styles.breakdownValue, { color: status.text }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  {isPaid ? (
                    <TouchableOpacity
                      style={styles.printBtn}
                      activeOpacity={0.85}
                      onPress={async () => {
                        try {
                          await printReceipt({
                            reference: payment?.reference || payment?.id || "REF-N/A",
                            amount: amount,
                            paymentType: "AMAC Verified Fee",
                            memberName: memberDetail?.fullname,
                            memberId: memberDetail?.uid || memberDetail?.id,
                            businessName: memberDetail?.businessName,
                            category: memberDetail?.category,
                            narration: payment?.payment || "AMAC Revenue Assessment",
                            date: payment?.date || new Date().toISOString(),
                            status: payment?.status || "SUCCESS",
                            agentName: currentUser?.fullname || currentUser?.name,
                            center: memberDetail?.center || currentUser?.center,
                          });
                        } catch (err: any) {
                          failed("Could not print receipt: " + (err?.message || "Unknown error"));
                        }
                      }}
                    >
                      <Printer size={16} color="#065f46" />
                      <Text style={styles.printBtnText}>Re-print Verified Receipt</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.payNowBtn}
                      activeOpacity={0.85}
                      onPress={() => handlePayPress(payment.reference || payment.id)}
                    >
                      <CreditCard size={16} color="#fff" />
                      <Text style={styles.payNowBtnText}>Collect Payment Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Search size={32} color="#065f46" />
            </View>
            <Text style={styles.emptyStateTitle}>Verify Payment Legitimacy</Text>
            <Text style={styles.emptyStateSubtext}>
              Enter a Payment ID or transaction reference above to check verification status and print audit receipts.
            </Text>
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
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  searchLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  searchInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  inputSearchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#0f172a",
  },
  searchBtn: {
    height: 48,
    paddingHorizontal: 18,
    backgroundColor: "#065f46",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#065f46",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingCenter: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  contentWrap: {
    padding: 16,
    gap: 16,
  },
  memberCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  memberCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e6f9f0",
    borderWidth: 1,
    borderColor: "#d4f5e6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarInitial: {
    color: "#065f46",
    fontWeight: "800",
    fontSize: 20,
  },
  verifiedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 3,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  memberName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  memberBusiness: {
    fontSize: 12,
    color: "#065f46",
    fontWeight: "700",
    marginBottom: 2,
  },
  memberUid: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#94a3b8",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 12,
  },
  memberDetailsGrid: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  sectionHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.2,
  },
  authBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  authBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  paymentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  paymentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  paymentRef: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "monospace",
    marginBottom: 4,
  },
  dueDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  paymentDate: {
    fontSize: 11,
    color: "#64748b",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  breakdownBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  payNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    backgroundColor: "#065f46",
    borderRadius: 14,
    shadowColor: "#065f46",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  payNowBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  printBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    backgroundColor: "#e6f9f0",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 14,
  },
  printBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#065f46",
  },
  emptyState: {
    paddingVertical: 70,
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },
});