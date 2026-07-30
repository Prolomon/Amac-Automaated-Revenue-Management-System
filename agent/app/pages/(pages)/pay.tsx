import { formatCurrency } from "@/config";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { getMember } from "@/lib/services/member";
import { getPayments } from "@/lib/services/payment";
import { Member, Payment } from "@/lib/types";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
  Building,
  CreditCard,
  User,
  Search,
  AlertCircle,
  CheckCircle2,
} from "lucide-react-native";

export default function PayScreen() {
  const { members, currentUser } = useAuth();
  const { wallet } = useWallet();
  const { success, failed } = useToast();

  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [memberDetail, setMemberDetail] = useState<Member | null>(null);
  const [paymentsList, setPaymentsList] = useState<Payment[]>([]);

  // Modal payment states
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSearch = async () => {
    const trimmedId = memberId.trim();
    if (!trimmedId) {
      failed("Please enter a Member ID");
      return;
    }

    setLoading(true);
    setMemberDetail(null);
    setPaymentsList([]);

    try {
      let foundMember: Member | null = null;

      // 1. Try finding member from the server getMember API
      try {
        const response = await getMember(trimmedId);
        if (response && (response.fullname || response.id || response.uid)) {
          foundMember = response;
        }
      } catch (err) {
        // Fallback to local list search if direct fetch fails
      }

      // 2. If not found, search through agent's members list
      if (!foundMember) {
        const list = await members();
        const matched = list.find(
          (m: Member) =>
            m.id === trimmedId ||
            m.uid === trimmedId ||
            m.fullname?.toLowerCase() === trimmedId.toLowerCase() ||
            m.email?.toLowerCase() === trimmedId.toLowerCase()
        );
        if (matched) {
          foundMember = matched;
        }
      }

      if (!foundMember) {
        failed("Member not found");
        setLoading(false);
        return;
      }

      setMemberDetail(foundMember);

      // 3. Load member payments
      try {
        const paymentsData = await getPayments(foundMember.uid || foundMember.id || "");
        if (Array.isArray(paymentsData)) {
          setPaymentsList(paymentsData);
        } else if (paymentsData && Array.isArray(paymentsData.payments)) {
          setPaymentsList(paymentsData.payments);
        } else if (paymentsData && Array.isArray(paymentsData.data)) {
          setPaymentsList(paymentsData.data);
        }
      } catch (paymentErr) {
        setPaymentsList([]);
      }

    } catch (e: any) {
      failed(e?.message || "Error searching for member");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!memberDetail) return;
    setRefreshing(true);
    try {
      const paymentsData = await getPayments(memberDetail.uid || memberDetail.id || "");
      if (Array.isArray(paymentsData)) {
        setPaymentsList(paymentsData);
      } else if (paymentsData && Array.isArray(paymentsData.payments)) {
        setPaymentsList(paymentsData.payments);
      } else if (paymentsData && Array.isArray(paymentsData.data)) {
        setPaymentsList(paymentsData.data);
      }
    } catch (e) {
      // Ignore refresh error
    } finally {
      setRefreshing(false);
    }
  };

  const openPayModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setModalVisible(true);
  };

  const closePayModal = () => {
    setSelectedPayment(null);
    setModalVisible(false);
  };

  const handlePaymentMade = () => {
    success("Payment verification submitted successfully. System is verifying!");
    closePayModal();
    handleRefresh();
  };

  const handlePaymentWithCard = () => {
    // Left completely blank as requested
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
        <Text style={styles.headerSubtitle}>Look up member account to process payments</Text>
      </View>

      {/* Input section at the top */}
      <View style={styles.searchSection}>
        <Text style={styles.label}>Member ID, UID, or Email</Text>
        <View style={styles.searchInputRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g. USR-910283"
            placeholderTextColor="#94a3b8"
            value={memberId}
            onChangeText={setMemberId}
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
            <Text style={styles.loadingText}>Loading details...</Text>
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
                <Text style={styles.detailValue}>{memberDetail.phone || "N/A"}</Text>
              </View>

              {memberDetail.businessName && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Business Name</Text>
                  <Text style={styles.detailValue}>{memberDetail.businessName}</Text>
                </View>
              )}

              {memberDetail.category && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{memberDetail.category}</Text>
                </View>
              )}
            </View>

            {/* Current Payments */}
            <Text style={styles.sectionHeading}>Current Payments</Text>

            {paymentsList.length === 0 ? (
              <View style={styles.emptyCard}>
                <AlertCircle size={32} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No Payments Listed</Text>
                <Text style={styles.emptyText}>This member currently has no bills or transaction history.</Text>
              </View>
            ) : (
              <View style={styles.paymentsList}>
                {paymentsList.map((payment, index) => {
                  const isPaid = payment.paid === payment.amount;
                  return (
                    <View key={payment.id || payment.reference || index} style={styles.paymentItem}>
                      <View style={styles.paymentHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.paymentRef}>Ref: {payment.reference}</Text>
                          <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
                        </View>
                        <View style={[styles.statusBadge, { borderColor: getStatusColor(payment.status) }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                            {String(payment.status).toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.paymentBody}>
                        <View style={styles.amountCol}>
                          <Text style={styles.amountLabel}>Total Amount</Text>
                          <Text style={styles.amountValue}>{formatCurrency(payment.amount)}</Text>
                        </View>
                        <View style={styles.amountCol}>
                          <Text style={styles.amountLabel}>Paid Amount</Text>
                          <Text style={[styles.amountValue, { color: isPaid ? "#0ea360" : "#ef4444" }]}>
                            {formatCurrency(payment.paid || 0)}
                          </Text>
                        </View>
                      </View>

                      {!isPaid && (
                        <TouchableOpacity
                          style={styles.payNowBtn}
                          onPress={() => openPayModal(payment)}
                          activeOpacity={0.8}
                        >
                          <CreditCard size={16} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={styles.payNowBtnText}>Pay Bill Now</Text>
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
            <AlertCircle size={40} color="#94a3b8" />
            <Text style={styles.emptyStateText}>No Member Loaded</Text>
            <Text style={styles.emptyStateSubtext}>Enter a valid Member ID above to search and show details.</Text>
          </View>
        )}
      </ScrollView>

      {/* Pay Modal with Agent Account Details */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closePayModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bill Payment Details</Text>
            {selectedPayment && (
              <View style={styles.modalPaymentInfo}>
                <Text style={styles.modalPaymentRef}>Reference: {selectedPayment.reference}</Text>
                <Text style={styles.modalPaymentAmt}>Amount Due: {formatCurrency(selectedPayment.amount - (selectedPayment.paid || 0))}</Text>
              </View>
            )}

            {/* Agent Account Card */}
            <View style={styles.agentCard}>
              <View style={styles.agentCardHeader}>
                <Building size={18} color="#0ea360" />
                <Text style={styles.agentCardTitle}>Agent Account details</Text>
              </View>
              <Text style={styles.agentCardDesc}>Make a direct bank transfer to the account number below:</Text>

              <View style={styles.agentRow}>
                <Text style={styles.agentRowLabel}>Bank Name</Text>
                <Text style={styles.agentRowValue}>{wallet?.bank?.name || "AURMS Partner Bank"}</Text>
              </View>

              <View style={styles.agentRow}>
                <Text style={styles.agentRowLabel}>Account Number</Text>
                <Text style={styles.agentRowValueHighlight}>{wallet?.accountNo || "N/A"}</Text>
              </View>

              <View style={styles.agentRowLast}>
                <Text style={styles.agentRowLabel}>Account Name</Text>
                <Text style={styles.agentRowValue}>{wallet?.accountName || currentUser?.fullname || "AURMS Agent"}</Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.paymentMadeBtn}
                activeOpacity={0.8}
                onPress={handlePaymentMade}
              >
                <CheckCircle2 size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.paymentMadeBtnText}>Payment Completed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.payWithCardBtn}
                activeOpacity={0.8}
                onPress={handlePaymentWithCard}
              >
                <CreditCard size={18} color="#0ea360" style={{ marginRight: 6 }} />
                <Text style={styles.payWithCardBtnText}>Pay with Card</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeModalBtn}
                activeOpacity={0.8}
                onPress={closePayModal}
              >
                <Text style={styles.closeModalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  paymentRef: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
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
    fontSize: 15,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 12,
  },
  modalPaymentInfo: {
    backgroundColor: "ghostwhite",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  modalPaymentRef: {
    fontSize: 13,
    color: "#64748b",
  },
  modalPaymentAmt: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ef4444",
    marginTop: 4,
  },
  agentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 18,
  },
  agentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  agentCardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0f172a",
  },
  agentCardDesc: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 12,
  },
  agentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  agentRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  agentRowLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  agentRowValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  agentRowValueHighlight: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0ea360",
    letterSpacing: 0.5,
  },
  modalActions: {
    gap: 10,
  },
  paymentMadeBtn: {
    height: 48,
    backgroundColor: "#0ea360",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  paymentMadeBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  payWithCardBtn: {
    height: 48,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#0ea360",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  payWithCardBtnText: {
    color: "#0ea360",
    fontSize: 15,
    fontWeight: "600",
  },
  closeModalBtn: {
    height: 48,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  closeModalBtnText: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "600",
  },
});
