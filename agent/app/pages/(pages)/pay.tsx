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
  ShieldCheck,
  Building2,
  Calendar,
  X,
  CheckCircle2,
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
    } catch {
      // Ignore silent refresh error
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
        label: "Paid",
      };
    }
    if (s === "PENDING") {
      return {
        bg: "#fffbeb",
        text: "#d97706",
        border: "#fde68a",
        label: "Pending",
      };
    }
    return {
      bg: "#fef2f2",
      text: "#dc2626",
      border: "#fecaca",
      label: "Unpaid",
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
        <View style={styles.badgeWrap}>
          <ShieldCheck size={12} color="#065f46" />
          <Text style={styles.badgeText}>FIELD BILL COLLECTION</Text>
        </View>
        <Text style={styles.headerTitle}>Collect Member Bills</Text>
        <Text style={styles.headerSubtitle}>
          Look up taxpayer demand notices, assess overdue penalties & process collections
        </Text>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <Text style={styles.searchLabel}>Taxpayer UID / Phone / Payment ID</Text>
        <View style={styles.searchInputRow}>
          <View style={styles.inputWrapper}>
            <Search size={18} color="#94a3b8" style={styles.inputSearchIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. AMAC-TAX-0012 or 08012345678"
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
              <Text style={styles.searchBtnText}>Lookup</Text>
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
            <Text style={styles.loadingText}>Verifying taxpayer assessment records...</Text>
          </View>
        ) : memberDetail ? (
          <View style={styles.contentWrap}>
            {/* Member Profile Card */}
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
                    <Text style={styles.verifiedTagText}>Verified Taxpayer</Text>
                  </View>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {memberDetail.fullname}
                  </Text>
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
                {memberDetail.category ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Business Category</Text>
                    <Text style={styles.detailValue}>{memberDetail.category}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Assessment Section Heading */}
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionHeading}>Pending Demand Notices</Text>
              <Text style={styles.sectionCount}>
                {paymentsList.length} bill{paymentsList.length !== 1 ? "s" : ""} found
              </Text>
            </View>

            {paymentsList.length === 0 ? (
              <View style={styles.emptyNoticeCard}>
                <AlertCircle size={32} color="#065f46" />
                <Text style={styles.emptyNoticeTitle}>No Outstanding Bills</Text>
                <Text style={styles.emptyNoticeText}>
                  This taxpayer currently has no pending revenue assessments or active demand notices.
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

                  const paymentDate = new Date(payment?.due);
                  const currentDate = new Date();

                  let daysOverdue = 0;
                  if (currentDate > paymentDate) {
                    const diffTime = currentDate.getTime() - paymentDate.getTime();
                    daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                  }

                  if (String(payment?.status).toLowerCase() === "paid") {
                    daysOverdue = 0;
                  }

                  const penaltyRatePerDay = 0.00005;
                  const penalty = subtotal * penaltyRatePerDay * daysOverdue;
                  const totalAmount = subtotal + penalty;

                  const status = getStatusBadge(payment.status);
                  const isPaid = String(payment.status).toUpperCase() === "PAID" || String(payment.status).toUpperCase() === "SUCCESS";

                  return (
                    <View
                      key={payment.id || payment.reference || index}
                      style={styles.paymentCard}
                    >
                      <View style={styles.paymentCardHeader}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.paymentTitle} numberOfLines={1}>
                            {payment.pricing?.title || payment.payment || "Municipal Assessment"}
                          </Text>
                          <Text style={styles.paymentRef}>
                            Ref: {payment.reference}
                          </Text>
                          <View style={styles.dueDateRow}>
                            <Calendar size={12} color="#64748b" />
                            <Text style={styles.paymentDate}>
                              Due: {formatDate(payment.due || payment.date)}
                            </Text>
                            {daysOverdue > 0 && (
                              <Text style={styles.overdueBadge}>
                                {daysOverdue}d overdue
                              </Text>
                            )}
                          </View>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: status.bg, borderColor: status.border },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: status.text },
                            ]}
                          >
                            {status.label}
                          </Text>
                        </View>
                      </View>

                      {/* Financial Breakdown Grid */}
                      <View style={styles.breakdownBox}>
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>Assessment Fee</Text>
                          <Text style={styles.breakdownValue}>{formatCurrency(principal)}</Text>
                        </View>
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>VAT (7.5%) & Charges</Text>
                          <Text style={styles.breakdownValue}>{formatCurrency(vat + charges)}</Text>
                        </View>
                        {penalty > 0 && (
                          <View style={styles.breakdownRow}>
                            <Text style={[styles.breakdownLabel, { color: "#dc2626" }]}>
                              Overdue Penalty
                            </Text>
                            <Text style={[styles.breakdownValue, { color: "#dc2626" }]}>
                              +{formatCurrency(penalty)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.breakdownDivider} />
                        <View style={styles.breakdownTotalRow}>
                          <Text style={styles.breakdownTotalLabel}>Total Payable</Text>
                          <Text style={styles.breakdownTotalValue}>{formatCurrency(totalAmount)}</Text>
                        </View>
                      </View>

                      {/* Action Button */}
                      {!isPaid ? (
                        <TouchableOpacity
                          style={styles.payNowBtn}
                          onPress={() =>
                            handlePayPress(payment.reference || payment.id)
                          }
                          activeOpacity={0.85}
                        >
                          <CreditCard size={16} color="#fff" />
                          <Text style={styles.payNowBtnText}>Collect Payment Now</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.printBtn}
                          onPress={async () => {
                            try {
                              const printAmt = payment?.paid || payment?.amount || totalAmount;
                              await printReceipt({
                                reference: payment?.reference || payment?.id || "REF-N/A",
                                amount: printAmt,
                                paymentType: "AMAC Revenue Fee",
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
                          activeOpacity={0.85}
                        >
                          <Printer size={16} color="#065f46" />
                          <Text style={styles.printBtnText}>Print Official Receipt</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Search size={32} color="#065f46" />
            </View>
            <Text style={styles.emptyStateTitle}>Search for Taxpayer Account</Text>
            <Text style={styles.emptyStateSubtext}>
              Enter a Taxpayer UID, phone number, or demand notice reference above to view bill details and collect payments.
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  badgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e6f9f0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#065f46",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
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
  sectionCount: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  emptyNoticeCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  emptyNoticeTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 6,
  },
  emptyNoticeText: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },
  paymentsList: {
    gap: 14,
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
  },
  paymentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
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
  overdueBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#dc2626",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
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
    marginBottom: 14,
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
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 4,
  },
  breakdownTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownTotalLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  breakdownTotalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#065f46",
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
