import { formatCurrency } from "@/config";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { payNow, confirmPayment } from "@/lib/services/payment";
import {
  RelativePathString,
  useRouter,
  useLocalSearchParams,
} from "expo-router";
import {
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Building,
  FileText,
  CheckCircle2,
} from "lucide-react-native";
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
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NombaPayment from '@/modules/nomba-payment';

export default function CheckoutPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token, currentUser } = useAuth();
  const { success, failed } = useToast();

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);

  // Success/Failure feedback modals
  const [successVisible, setSuccessVisible] = useState(false);
  const [failureVisible, setFailureVisible] = useState(false);
  const [failureMessage, setFailureMessage] = useState("");
  const [confirmDetails, setConfirmDetails] = useState<any>(null);

  //Payment with card
  const [cardModal, setCardModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  const fetchDetails = useCallback(async () => {
    await Promise.resolve(); // yield once — breaks the synchronous chain

    const rawId = Array.isArray(id) ? id[0] : id;
    const trimmedId = (rawId ?? "").trim();
    if (!trimmedId) {
      failed("Please enter a Member ID, Phone Number, or Payment ID");
      return;
    }
    try {
      setLoading(true);
      const res = await payNow(trimmedId as string);
      if (res.ok && res.data) {
        setCheckoutData(res.data);
      } else {
        failed(res.message || "Could not retrieve checkout details");
      }
    } catch (err: any) {
      failed(err?.message || "Error retrieving checkout details");
    } finally {
      setLoading(false);
    }
  }, [id, failed]);

  useEffect(() => {
    const id = setTimeout(fetchDetails, 0);
    return () => clearTimeout(id);
  }, [fetchDetails]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDetails();
    setRefreshing(false);
  };

  const member = checkoutData?.member;
  const payments = checkoutData?.payments;

  // Find the exact matched payment or default to the first one
  const matchedWrap =
    payments?.find(
      (p: any) =>
        p?.payment?.id === id ||
        p?.payment?.reference === id ||
        p?.id === id ||
        p?.reference === id
    ) || payments?.[0];

  const payment = matchedWrap?.payment || matchedWrap;
  const wallet = matchedWrap?.wallet;

  // Calculate pricing summary details — safe defaults when payment isn't loaded yet
  const principal = payment
    ? Number(payment.debt ? payment.debt : payment.amount || 0)
    : 0;
  const vat = principal * 0.075;
  const charges = principal * 0.015;
  const subtotal = principal + vat + charges;

  useEffect(() => {
    (async () => {
      await Promise.resolve(); // yield once — breaks the synchronous chain
      if (checkoutData && payment) {
        setPaymentAmount(subtotal.toString());
      }
    })();
  }, [checkoutData, payment, subtotal]);

  // Days Overdue & Penalty Calculation
  const paymentDate = new Date(payment?.date || payment?.due || new Date());
  const currentDate = new Date();
  let daysOverdue = 0;
  if (payment && currentDate > paymentDate) {
    const diffTime = currentDate.getTime() - paymentDate.getTime();
    daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
  const penalty = subtotal * 0.00005 * daysOverdue;
  const totalAmount = subtotal + penalty;
  const debt = payment?.debt;

  const handleConfirmPayment = async () => {
    setConfirming(true);
    try {
      const res = await confirmPayment(
        member.uid || member.id,
        payment.id,
        debt ? debt : totalAmount,
        member.center,
        member.company,
        token
      );

      if (res.ok) {
        setConfirmDetails(res.data);
        setSuccessVisible(true);
        success("Payment confirmed successfully!");
      } else {
        setFailureMessage(res.message || "Failed to confirm payment");
        setFailureVisible(true);
      }
    } catch (error: any) {
      setFailureMessage(
        error?.message || "An unexpected error occurred during confirmation"
      );
      setFailureVisible(true);
    } finally {
      setConfirming(false);
    }
  };

  const handlePayWithCard = async () => {
    try {
      const result = await NombaPayment.triggerPayment(paymentAmount.toString().padEnd(paymentAmount.toString().length + 2, '0'), currentUser?.uid + payment.reference + "-" + new Date().getTime()); // amount in kobo
      console.log('Success:', result);
    } catch (e) {
      console.error('Payment failed:', e);
    } finally {
      setCardModal(false);
    }
  }

  if (loading && !checkoutData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#0ea360" />
          <Text style={styles.loadingText}>Loading checkout details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!checkoutData || !member) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <ArrowLeft color="#0f172a" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.errorCenter}>
          <AlertCircle size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>No Checkout Information</Text>
          <Text style={styles.errorDesc}>
            The payment reference or identifier is invalid or has expired.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!payment) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <ArrowLeft color="#0f172a" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.errorCenter}>
          <AlertCircle size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>No Active Payment Found</Text>
          <Text style={styles.errorDesc}>
            This member does not have an active payment for this checkout.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Payment</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Member Profile Banner */}
          <View style={styles.memberCard}>
            <View style={styles.memberRow}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>
                  {(member.fullname || "M").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{member.fullname}</Text>
                {member.businessName && (
                  <Text style={styles.memberSub}>{member.businessName}</Text>
                )}
                <Text style={styles.memberSub}>
                  {member.email} | {member.phone || "N/A"}
                </Text>
              </View>
            </View>
          </View>

          {/* Pricing Breakdown Card */}
          <View style={styles.breakdownCard}>
            <View style={styles.sectionHeader}>
              <FileText size={18} color="#0ea360" />
              <Text style={styles.sectionTitle}>Payment breakdown</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Billing Item</Text>
              <Text style={styles.breakdownValueHighlight}>
                {payment.pricing?.title || "Payment Item"}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Reference ID</Text>
              <Text style={styles.breakdownValue}>{payment.reference}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Principal Amount</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(principal)}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>VAT (7.5%)</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(vat)}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Charges (1.5%)</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(charges)}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(subtotal)}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Overdue Day(s)</Text>
              <Text
                style={[
                  styles.breakdownValue,
                  daysOverdue > 0 ? { color: "#ef4444" } : undefined,
                ]}
              >
                {daysOverdue}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Overdue Penalty</Text>
              <Text
                style={[
                  styles.breakdownValue,
                  penalty > 0 ? { color: "#ef4444" } : undefined,
                ]}
              >
                {formatCurrency(penalty)}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Due</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>

          {/* Wallet details */}
          {wallet && (
            <View style={styles.walletCard}>
              <View style={styles.sectionHeader}>
                <Building size={18} color="#2563eb" />
                <Text style={styles.sectionTitle}>
                  Agent Wallet Information
                </Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Bank Name</Text>
                <Text style={styles.breakdownValue}>
                  {wallet.bank?.name || "N/A"}
                </Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Account Number</Text>
                <Text style={styles.breakdownValueHighlight}>
                  {wallet.accountNo || "N/A"}
                </Text>
              </View>

              <View style={styles.breakdownRowLast}>
                <Text style={styles.breakdownLabel}>Account Name</Text>
                <Text style={styles.breakdownValue}>
                  {wallet.accountName || "N/A"}
                </Text>
              </View>
            </View>
          )}

          {/* Action button */}
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirmPayment}
            disabled={confirming}
          >
            {confirming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <ShieldCheck
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.confirmBtnText}>Confirm Payment</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Card payment button */}
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => {
              setCardModal(true);
            }}
          >
            <CreditCard size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.confirmBtnText}>Pay With Card</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconWrap}>
              <CheckCircle2 size={48} color="#0ea360" />
            </View>
            <Text style={styles.modalTitle}>Payment Confirmed!</Text>
            <Text style={styles.modalDesc}>
              The payment was confirmed and registered successfully in the
              system.
            </Text>

            {confirmDetails && confirmDetails.payment && (
              <View style={styles.confirmDetailsBox}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Reference:</Text>
                  <Text style={styles.detailVal}>
                    {confirmDetails.payment.reference}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Amount Paid:</Text>
                  <Text style={styles.detailVal}>
                    {formatCurrency(Number(confirmDetails.payment.amount))}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={styles.detailVal}>
                    {confirmDetails.payment.status}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                setSuccessVisible(false);
                router.replace("/pages/(pages)" as RelativePathString);
              }}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Failure Modal */}
      <Modal visible={failureVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { borderColor: "#fecaca" }]}>
            <View style={styles.failureIconWrap}>
              <AlertCircle size={48} color="#ef4444" />
            </View>
            <Text style={[styles.modalTitle, { color: "#ef4444" }]}>
              Payment Failed
            </Text>
            <Text style={styles.modalDesc}>
              {failureMessage ||
                "An error occurred while confirming the payment."}
            </Text>

            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: "#ef4444" }]}
              onPress={() => setFailureVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment with card Modal */}
      <Modal visible={cardModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconWrap}>
              <CreditCard size={48} color="#0ea360" />
            </View>

            <Text style={styles.modalTitle}>Payment With Card</Text>
            <Text style={styles.modalDesc}>
              Insert, tap, or swipe your card to complete the payment.
            </Text>

            <TextInput
              value={paymentAmount}
              onChangeText={(text) =>
                setPaymentAmount(text)
              }
              keyboardType="number-pad"
              autoFocus
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={handlePayWithCard}
            >
              <Text style={styles.modalCloseText}>Pay Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "ghostwhite" },
  scrollContent: { paddingBottom: 40 },
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 15, color: "#64748b" },
  errorCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "ghostwhite",
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 16,
    fontWeight: 900,
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
  content: { padding: 16, gap: 16 },
  memberCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 16,
  },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e6f9f0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "bold", color: "#0ea360" },
  memberName: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  memberSub: { fontSize: 13, color: "#64748b", marginTop: 2 },
  breakdownCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    paddingBottom: 10,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: "#0f172a" },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f8fafc",
  },
  breakdownRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  breakdownLabel: { fontSize: 13, color: "#64748b" },
  breakdownValue: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  breakdownValueHighlight: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0ea360",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 6,
  },
  totalLabel: { fontSize: 15, fontWeight: "bold", color: "#0f172a" },
  totalValue: { fontSize: 18, fontWeight: "800", color: "#0ea360" },
  walletCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 16,
  },
  confirmBtn: {
    height: 52,
    backgroundColor: "#0ea360",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e6f9f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  failureIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0ea360",
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  confirmDetailsBox: {
    backgroundColor: "ghostwhite",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    width: "100%",
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  detailItem: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { fontSize: 12, color: "#64748b" },
  detailVal: { fontSize: 12, fontWeight: "600", color: "#0f172a" },
  modalCloseBtn: {
    height: 48,
    backgroundColor: "#0ea360",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalCloseText: { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  pendingText: {
    fontSize: 13,
    color: "#0ea360",
    fontWeight: "600",
  },
  pinBoxRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  pinBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    backgroundColor: "#e6f9f0",
    justifyContent: "center",
    alignItems: "center",
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0f172a",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 1,
    width: 1,
  },
});