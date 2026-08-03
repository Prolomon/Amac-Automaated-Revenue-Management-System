import { formatCurrency } from "@/config";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getMember } from "@/lib/services/member";
import { getPayments, getRecords } from "@/lib/services/payment";
import { Member, Payment } from "@/lib/types";
import { useLocalSearchParams, useRouter, RelativePathString } from "expo-router";
import { ArrowLeft, Mail, Phone, MapPin, CreditCard, History, FileText, X, ChevronRight, Briefcase, AlertCircle } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
  const { failed } = useToast();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Tab view toggler: "payments" | "history"
  const [activeTab, setActiveTab] = useState<"payments" | "history">("payments");

  // Payment detail modal states
  const [selectedPayment, setSelectedPayment] = useState<{ payment: Payment, principal: number, vat: number, charges: number, subtotal: number, daysOverdue: number, penalty: number, totalAmount: number } | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!id) return;
    if (!isSilent) setLoading(true);

    try {
      // 1. Fetch member profile
      const memRes = await getMember(id, token as string);
      setMember(memRes?.data || null);

      // 2. Fetch payments
      try {
        const payRes = await getPayments(id, token as string);

        if (!payRes.ok) {
          throw new Error("Failed to fetch payments");
        }

        setPayments(payRes.payments);
      } catch (payErr: any) {
        failed(payErr.message || "Failed to load member payments");
        setPayments([]);
      }

      // 3. Fetch transactions
      try {
        const txRes = await getRecords(id, token as string);
        if (txRes && Array.isArray(txRes.transactions)) {
          setTransactions(txRes.transactions);
        } else if (Array.isArray(txRes)) {
          setTransactions(txRes);
        }
      } catch (txErr: any) {
        failed(txErr.message || "Failed to load member transactions");
        setTransactions([]);
      }

    } catch (err: any) {
      failed(err.message || "Failed to load member profile details");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [id, token, failed]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const formatLocation = (loc: any) => {
    if (!loc) return "-";
    if (typeof loc === "string") return loc;
    const parts = [loc.address, loc.city, loc.state, loc.zipcode].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "-";
  };

  const getStatusStyle = (status?: string) => {
    const s = String(status || "").toUpperCase();
    if (s === "SUCCESS" || s === "COMPLETED") {
      return { badge: styles.statusSuccess, text: styles.statusTextSuccess };
    }
    if (s === "PENDING") {
      return { badge: styles.statusPending, text: styles.statusTextPending };
    }
    return { badge: styles.statusFailed, text: styles.statusTextFailed };
  };

  useEffect(() => {
    if (selectedPaymentId) {
      const payment = payments.find((p) => p.reference === selectedPaymentId || p.id === selectedPaymentId);

      const principal = Number(payment?.debt ? payment.debt : payment?.amount);
      const vat = principal * 0.075;
      const charges = principal * 0.015;
      const subtotal = principal + vat + charges;

      // Get payment date and current date
      const paymentDate = new Date(payment?.due || payment?.date || new Date());
      const currentDate = new Date();

      // Calculate days overdue
      let daysOverdue = 0;
      if (currentDate > paymentDate) {
        const diffTime = currentDate.getTime() - paymentDate.getTime(); // ✅ use getTime()
        daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // convert ms → days
      }

      // Penalty: 0.005% per day overdue
      const penaltyRatePerDay = 0.00005; // 0.005% = 0.00005
      const penalty = subtotal * penaltyRatePerDay * daysOverdue;

      const totalAmount = subtotal + penalty;

      setSelectedPayment(payment ? { payment, principal, vat, charges, subtotal, daysOverdue, penalty, totalAmount } : null);
    }
  }, [selectedPaymentId, payments]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#0ea360" />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color="#0f172a" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Member Details</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingCenter}>
          <AlertCircle size={40} color="#ef4444" />
          <Text style={styles.loadingText}>Member details not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header with action buttons on the top right */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Profile</Text>

        {/* Top-right action buttons */}
        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={[styles.actionTabBtn, activeTab === "payments" ? styles.actionTabBtnActive : undefined]}
            onPress={() => setActiveTab("payments")}
          >
            <CreditCard size={16} color={activeTab === "payments" ? "#fff" : "#0ea360"} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionTabBtn, activeTab === "history" ? styles.actionTabBtnActive : undefined]}
            onPress={() => setActiveTab("history")}
          >
            <History size={16} color={activeTab === "history" ? "#fff" : "#0ea360"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0ea360"]} />}
      >
        <View style={styles.content}>
          {/* Professional profile details card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>
                  {(member.fullname || "M").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{member.fullname}</Text>
                {member.businessName && (
                  <Text style={styles.profileBusiness}>{member.businessName}</Text>
                )}
                <Text style={styles.profileUid}>UID: {member.uid || member.id}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Mail size={16} color="#64748b" style={styles.detailIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Email Address</Text>
                <Text style={styles.detailVal}>{member.email}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Phone size={16} color="#64748b" style={styles.detailIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailVal}>{member.phone || "N/A"}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Briefcase size={16} color="#64748b" style={styles.detailIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Account Category / Type</Text>
                <Text style={styles.detailVal}>
                  {member.category || "General"} | {member.type || "Individual"}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <MapPin size={16} color="#64748b" style={styles.detailIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Billing Address</Text>
                <Text style={styles.detailVal}>{formatLocation(member.location)}</Text>
              </View>
            </View>
          </View>

          {/* Tab Sub-header indicating what we are showing */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>
              {activeTab === "payments" ? "Payments List" : "Transaction History"}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {activeTab === "payments"
                ? `${payments.length} billing records`
                : `${transactions.length} transaction logs`}
            </Text>
          </View>

          {/* Payments list view */}
          {activeTab === "payments" ? (
            payments.length === 0 ? (
              <View style={styles.emptyCard}>
                <FileText size={32} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No payments found</Text>
                <Text style={styles.emptyText}>This member currently has no listed bills.</Text>
              </View>
            ) : (
              <View style={styles.listWrap}>
                {payments.map((p, index) => {
                  const statusStyle = getStatusStyle(p.status);

                  const principal = Number(p.debt ? p.debt : p.amount);
                  const vat = principal * 0.075;
                  const charges = principal * 0.015;
                  const subtotal = principal + vat + charges;

                  // Get payment date and current date
                  const paymentDate = new Date(p.date);
                  const currentDate = new Date();

                  // Calculate days overdue
                  let daysOverdue = 0;
                  if (currentDate > paymentDate) {
                    const diffTime = currentDate.getTime() - paymentDate.getTime(); // ✅ use getTime()
                    daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // convert ms → days
                  }

                  // Penalty: 0.005% per day overdue
                  const penaltyRatePerDay = 0.00005; // 0.005% = 0.00005
                  const penalty = subtotal * penaltyRatePerDay * daysOverdue;

                  const totalAmount = subtotal + penalty;

                  return (
                    <TouchableOpacity
                      key={p.id || p.reference || index}
                      style={styles.listItem}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedPaymentId(p.reference || p.id || null);
                        setModalVisible(true);
                      }}
                    >
                      <View style={styles.listItemHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.listItemTitle}>{p.pricing?.title || "Bill Payment"}</Text>
                          <Text style={styles.listItemSub}>Ref: {p.reference}</Text>
                        </View>
                        <View style={[styles.statusBadge, statusStyle.badge]}>
                          <Text style={[styles.statusText, statusStyle.text]}>{String(p.status).toUpperCase()}</Text>
                        </View>
                      </View>
                      <View style={styles.listItemBody}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.amountLabel}>Total Amount</Text>
                          <Text style={styles.amountVal}>{formatCurrency(totalAmount)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.amountLabel}>Outstanding Debt</Text>
                          <Text style={[styles.amountVal, { color: "#ef4444" }]}>
                            {formatCurrency(p.debt !== undefined ? p.debt : (p.amount - (p.paid || 0)))}
                          </Text>
                        </View>
                        <ChevronRight size={16} color="#cbd5e1" style={{ alignSelf: "center" }} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
          ) : (
            /* Transaction history view */
            transactions.length === 0 ? (
              <View style={styles.emptyCard}>
                <History size={32} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No transaction history</Text>
                <Text style={styles.emptyText}>No transaction records were found for this user.</Text>
              </View>
            ) : (
              <View style={styles.listWrap}>
                {transactions.map((tx, index) => (
                  <TouchableOpacity
                    key={tx.id || index}
                    style={styles.listItem}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/pages/transaction/${tx.id}` as RelativePathString)}
                  >
                    <View style={styles.listItemHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listItemTitle}>{tx.narration || tx.transactionCategory || "Transaction"}</Text>
                        <Text style={styles.listItemSub}>Ref: {tx.reference || tx.paymentVendorReference || "-"}</Text>
                      </View>
                      <View style={[styles.statusBadge, tx.status === "SUCCESS" ? styles.statusSuccess : styles.statusPending]}>
                        <Text style={[styles.statusText, tx.status === "SUCCESS" ? styles.statusTextSuccess : styles.statusTextPending]}>
                          {String(tx.status || "PENDING").toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.listItemBody}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.amountLabel}>Amount</Text>
                        <Text style={styles.amountVal}>{formatCurrency(Number(tx.amount || 0))}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.amountLabel}>Date</Text>
                        <Text style={styles.amountVal}>
                          {tx.createdAt || tx.timeCreated ? new Date(tx.createdAt || tx.timeCreated).toLocaleDateString() : "-"}
                        </Text>
                      </View>
                      <ChevronRight size={16} color="#cbd5e1" style={{ alignSelf: "center" }} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* Payment Information Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bill Payment Information</Text>
              <TouchableOpacity style={styles.closeIconBtn} onPress={() => setModalVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedPayment && (
                <View style={{ gap: 14 }}>
                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldLabel}>Pricing Title</Text>
                    <Text style={styles.modalFieldValueHighlight}>
                      {selectedPayment.payment.pricing?.title || "Payment Reference Details"}
                    </Text>
                  </View>

                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldLabel}>Reference ID</Text>
                    <Text style={styles.modalFieldValue}>{selectedPayment.payment.reference}</Text>
                  </View>

                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldLabel}>Total Amount Due</Text>
                    <Text style={styles.modalFieldValue}>{formatCurrency(selectedPayment.totalAmount)}</Text>
                  </View>

                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldLabel}>Amount Paid</Text>
                    <Text style={[styles.modalFieldValue, { color: "#0ea360" }]}>
                      {formatCurrency(selectedPayment.payment.paid || 0)}
                    </Text>
                  </View>

                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldLabel}>Remaining Debt</Text>
                    <Text style={[styles.modalFieldValue, { color: "#ef4444" }]}>
                      {formatCurrency(selectedPayment.payment.debt !== undefined ? selectedPayment.payment.debt : (selectedPayment.payment.amount - (selectedPayment.payment.paid || 0)))}
                    </Text>
                  </View>

                  {selectedPayment.penalty !== undefined && (
                    <View style={styles.modalFieldRow}>
                      <Text style={styles.modalFieldLabel}>Penalty</Text>
                      <Text style={[styles.modalFieldValue, { color: "#ef4444" }]}>
                        {formatCurrency(selectedPayment.payment.debt !== undefined ? selectedPayment.penalty : 0)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldLabel}>Status</Text>
                    <Text style={[styles.modalFieldValue, { fontWeight: "bold" }]}>
                      {selectedPayment.payment.status}
                    </Text>
                  </View>

                  {/* Associated Transaction sessions */}
                  <Text style={styles.modalSubheading}>Payment Transaction Sessions</Text>
                  {!selectedPayment.payment.sessions || selectedPayment.payment.sessions.length === 0 ? (
                    <Text style={styles.modalEmptyText}>No transaction sessions recorded yet.</Text>
                  ) : (
                    <View style={styles.sessionsBox}>
                      {selectedPayment.payment.sessions.map((sessionId: string, index: number) => (
                        <TouchableOpacity
                          key={sessionId || index}
                          style={styles.sessionItemRow}
                          activeOpacity={0.7}
                          onPress={() => {
                            setModalVisible(false);
                            router.push(`/pages/transaction/${sessionId}` as RelativePathString);
                          }}
                        >
                          <FileText size={14} color="#0ea360" />
                          <Text style={styles.sessionItemText} numberOfLines={1}>
                            Session ID: {sessionId}
                          </Text>
                          <ChevronRight size={14} color="#94a3b8" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {selectedPayment && (
              <TouchableOpacity style={[styles.modalOutlineBtn, { marginBottom: 16 }]} onPress={() => router.push(`/pages/payment?id=${selectedPayment.payment.reference || selectedPayment.payment.id}` as RelativePathString)}>
                <Text style={styles.modalOutlineBtnText}>Pay Now</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "ghostwhite" },
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
  topActionsRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  actionTabBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  actionTabBtnActive: {
    backgroundColor: "#0ea360",
    borderColor: "#0ea360",
  },
  scrollContent: { paddingBottom: 40 },
  content: { padding: 16, gap: 16 },
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#64748b" },

  // Profile card styles
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e6f9f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d4f5e6",
  },
  avatarText: { fontSize: 22, fontWeight: "bold", color: "#0ea360" },
  profileName: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  profileBusiness: { fontSize: 14, color: "#0ea360", fontWeight: "600", marginTop: 2 },
  profileUid: { fontSize: 12, color: "#64748b", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 14 },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f8fafc",
  },
  detailIcon: { marginRight: 12, marginTop: 4 },
  detailLabel: { fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: "600" },
  detailVal: { fontSize: 14, fontWeight: "600", color: "#0f172a", marginTop: 2 },

  sectionTitleRow: { marginTop: 8, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  sectionSubtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },

  // List views
  listWrap: { gap: 12 },
  listItem: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
  },
  listItemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 1, borderColor: "#f1f5f9", paddingBottom: 8, marginBottom: 8 },
  listItemTitle: { fontSize: 14, fontWeight: "bold", color: "#0f172a" },
  listItemSub: { fontSize: 11, color: "#64748b", marginTop: 2 },
  listItemBody: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  amountLabel: { fontSize: 10, color: "#94a3b8" },
  amountVal: { fontSize: 13, fontWeight: "600", color: "#0f172a", marginTop: 1 },

  statusBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1 },
  statusSuccess: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  statusPending: { backgroundColor: "#fef3c7", borderColor: "#fde68a" },
  statusFailed: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  statusText: { fontSize: 10, fontWeight: "bold" },
  statusTextSuccess: { color: "#166534" },
  statusTextPending: { color: "#92400e" },
  statusTextFailed: { color: "#b91c1c" },

  emptyCard: { backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", padding: 32, alignItems: "center", gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: "bold", color: "#0f172a" },
  emptyText: { fontSize: 13, color: "#64748b", textAlign: "center" },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#ffffff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderColor: "#f1f5f9", paddingBottom: 12, marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  closeIconBtn: { width: 32, height: 32, justifyContent: "center", alignItems: "center" },
  modalScroll: { maxHeight: "70%", marginBottom: 16 },
  modalFieldRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#f8fafc" },
  modalFieldLabel: { fontSize: 13, color: "#64748b" },
  modalFieldValue: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  modalFieldValueHighlight: { fontSize: 14, fontWeight: "bold", color: "#0ea360" },
  modalSubheading: { fontSize: 14, fontWeight: "bold", color: "#0f172a", marginTop: 14, marginBottom: 8 },
  modalEmptyText: { fontSize: 12, color: "#94a3b8", fontStyle: "italic" },
  sessionsBox: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, overflow: "hidden" },
  sessionItemRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, backgroundColor: "#ffffff", borderBottomWidth: 1, borderColor: "#f1f5f9" },
  sessionItemText: { flex: 1, fontSize: 12, color: "#334155" },
  modalCloseBtn: { height: 48, backgroundColor: "#0ea360", borderRadius: 10, justifyContent: "center", alignItems: "center" },
  modalCloseBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
  modalOutlineBtn: {
    height: 48,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#0ea360",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOutlineBtnText: { color: "#0ea360", fontSize: 15, fontWeight: "bold" },
});
