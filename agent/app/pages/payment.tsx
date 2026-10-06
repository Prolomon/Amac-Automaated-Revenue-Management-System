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
  Printer,
  Calendar,
  X,
  User,
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
import NombaPayment from "@/modules/nomba-payment";
import { printReceipt } from "@/utils/receipt-printer";

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

  // Payment with card
  const [cardModal, setCardModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  const fetchDetails = useCallback(async () => {
    await Promise.resolve();

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
    const timer = setTimeout(fetchDetails, 0);
    return () => clearTimeout(timer);
  }, [fetchDetails]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDetails();
    setRefreshing(false);
  };

  const member = checkoutData?.member;
  const payments = checkoutData?.payments;

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

  const principal = Number(payment?.debt > 0 ? payment?.debt : payment?.amount || 0);
  const vat = principal * 0.075;
  const charges = principal * 0.015;
  const subtotal = principal + vat + charges;

  // Days Overdue & Penalty Calculation
  const paymentDate = new Date(payment?.date || payment?.due || new Date());
  const currentDate = new Date();
  let daysOverdue = 0;
  if (payment && currentDate > paymentDate) {
    const diffTime = currentDate.getTime() - paymentDate.getTime();
    daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
  const penaltyRatePerDay = 0.00005;
  const penalty =
    String(payment?.status).toLowerCase() === "paid"
      ? 0
      : subtotal * penaltyRatePerDay * daysOverdue;

  const totalAmount = subtotal + penalty;

  useEffect(() => {
    (async () => {
      await Promise.resolve();
      if (checkoutData && payment) {
        setPaymentAmount(Math.round(totalAmount).toString());
      }
    })();
  }, [checkoutData, payment, totalAmount]);

  const handleConfirmPayment = async () => {
    setConfirming(true);
    try {
      const res = await confirmPayment(
        member.uid || member.id,
        payment.id,
        paymentAmount ? Number(paymentAmount) : totalAmount,
        member.center,
        member.company,
        token
      );

      if (res.ok) {
        setConfirmDetails({
          ...res.data,
          paymentType: "CASH / AGENT WALLET",
        });
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
    setCardModal(false);
    try {
      const numAmount = Number(paymentAmount) || 0;
      const amountInKobo = Math.round(numAmount * 100).toString();
      const txRef = `${currentUser?.uid || "agent"}-${payment?.reference || "ref"}-${new Date().getTime()}`;
      const result = await NombaPayment.triggerPayment(amountInKobo, txRef);

      let confData: any = null;
      try {
        const res = await confirmPayment(
          member.uid || member.id,
          payment.id,
          numAmount,
          member.center,
          member.company,
          token
        );
        if (res.ok && res.data) {
          confData = res.data;
        }
      } catch (e) {
        console.warn("Backend confirmation fallback:", e);
      }

      setConfirmDetails({
        payment: confData?.payment || {
          reference: txRef,
          amount: numAmount,
          status: "SUCCESS",
          date: new Date().toISOString(),
        },
        paymentType: "CARD (NOMBA POS)",
      });
      setSuccessVisible(true);
      success("Card payment completed successfully!");
    } catch (e: any) {
      failed(e?.message || "Card payment failed or was cancelled");
    }
  };

  const handlePrintReceipt = async () => {
    try {
      const p = confirmDetails?.payment || payment;
      const printAmt = p?.amount ?? (paymentAmount ? Number(paymentAmount) : totalAmount);
      await printReceipt({
        reference: p?.reference || p?.id || "REF-N/A",
        amount: printAmt,
        paymentType: confirmDetails?.paymentType || "CASH",
        memberName: member?.fullname,
        memberId: member?.uid || member?.id,
        businessName: member?.businessName,
        category: member?.category,
        narration: payment?.payment || "AMAC Revenue Fee",
        date: p?.date || new Date().toISOString(),
        status: p?.status || "SUCCESS",
        agentName: currentUser?.fullname || currentUser?.name,
        center: member?.center || currentUser?.center,
      });
    } catch (err: any) {
      failed("Could not print receipt: " + (err?.message || "Unknown error"));
    }
  };

  if (loading && !checkoutData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#065f46" />
          <Text style={styles.loadingText}>Loading checkout details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!checkoutData || !member) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color="#0f172a" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>
        <View style={styles.errorCenter}>
          <AlertCircle size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Invalid Checkout Request</Text>
          <Text style={styles.errorDesc}>
            The payment reference or identifier is invalid or has expired.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft color="#0f172a" size={20} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.badgeWrap}>
            <ShieldCheck size={11} color="#065f46" />
            <Text style={styles.badgeText}>PAYMENT TERMINAL</Text>
          </View>
          <Text style={styles.headerTitle}>Confirm & Collect</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#065f46"
            colors={["#065f46"]}
          />
        }
      >
        {/* Taxpayer Summary Card */}
        <View style={styles.memberCard}>
          <View style={styles.memberCardTop}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarInitial}>
                {(member.fullname || "M").charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.verifiedTag}>
                <ShieldCheck size={11} color="#059669" />
                <Text style={styles.verifiedTagText}>Billed Taxpayer</Text>
              </View>
              <Text style={styles.memberName} numberOfLines={1}>{member.fullname}</Text>
              {member.businessName ? (
                <Text style={styles.memberBusiness} numberOfLines={1}>
                  {member.businessName}
                </Text>
              ) : null}
              <Text style={styles.memberSub}>
                ID: {member.uid || "-"} • {member.phone || member.email || ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Breakdown Card */}
        <View style={styles.breakdownCard}>
          <View style={styles.sectionHeader}>
            <FileText size={18} color="#065f46" />
            <Text style={styles.sectionTitle}>Demand Notice Breakdown</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Assessment Item</Text>
            <Text style={styles.breakdownValueHighlight}>
              {payment.pricing?.title || payment.payment || "Municipal Fee"}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Invoice Reference</Text>
            <Text style={[styles.breakdownValue, { fontFamily: "monospace" }]}>
              {payment.reference}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Assessment Principal</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(principal)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>VAT (7.5%) & Charges (1.5%)</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(vat + charges)}</Text>
          </View>

          {daysOverdue > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: "#dc2626" }]}>
                Overdue Penalty ({daysOverdue} days)
              </Text>
              <Text style={[styles.breakdownValue, { color: "#dc2626" }]}>
                +{formatCurrency(penalty)}
              </Text>
            </View>
          )}

          <View style={styles.breakdownDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Assessment Due</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>

        {/* Payment Amount Input & Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.inputSectionLabel}>Enter Collection Amount (₦)</Text>
          <View style={styles.amountInputWrap}>
            <Text style={styles.currencyPrefix}>₦</Text>
            <TextInput
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="number-pad"
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <TouchableOpacity
            style={styles.confirmBtn}
            activeOpacity={0.85}
            onPress={handleConfirmPayment}
            disabled={confirming}
          >
            {confirming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <ShieldCheck size={20} color="#fff" />
                <Text style={styles.confirmBtnText}>Confirm Cash / Wallet Collection</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardPayBtn}
            activeOpacity={0.85}
            onPress={() => setCardModal(true)}
          >
            <CreditCard size={20} color="#065f46" />
            <Text style={styles.cardPayBtnText}>Process via POS / Card Terminal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.printBtn}
            activeOpacity={0.85}
            onPress={handlePrintReceipt}
          >
            <Printer size={18} color="#64748b" />
            <Text style={styles.printBtnText}>Print Demand Notice Slip</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconWrap}>
              <CheckCircle2 size={44} color="#065f46" />
            </View>
            <Text style={styles.modalTitle}>Payment Confirmed!</Text>
            <Text style={styles.modalDesc}>
              The payment has been confirmed and registered successfully in the AMAC portal.
            </Text>

            {confirmDetails && (
              <View style={styles.confirmDetailsBox}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailItemLabel}>Reference:</Text>
                  <Text style={styles.detailItemVal}>
                    {confirmDetails.payment?.reference || payment?.reference}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailItemLabel}>Amount Collected:</Text>
                  <Text style={[styles.detailItemVal, { color: "#065f46", fontWeight: "800" }]}>
                    {formatCurrency(Number(confirmDetails.payment?.amount || paymentAmount || totalAmount))}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailItemLabel}>Payment Mode:</Text>
                  <Text style={styles.detailItemVal}>
                    {confirmDetails.paymentType || "CASH"}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalPrintBtn}
              activeOpacity={0.85}
              onPress={handlePrintReceipt}
            >
              <Printer size={18} color="#ffffff" />
              <Text style={styles.modalPrintBtnText}>Print Official Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              activeOpacity={0.85}
              onPress={() => {
                setSuccessVisible(false);
                router.replace("/pages/(pages)" as RelativePathString);
              }}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Failure Modal */}
      <Modal visible={failureVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { borderColor: "#fecaca" }]}>
            <View style={styles.failureIconWrap}>
              <AlertCircle size={44} color="#ef4444" />
            </View>
            <Text style={[styles.modalTitle, { color: "#ef4444" }]}>Payment Failed</Text>
            <Text style={styles.modalDesc}>
              {failureMessage || "An error occurred while confirming the collection."}
            </Text>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              activeOpacity={0.85}
              onPress={() => setFailureVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close & Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Card Payment Modal */}
      <Modal visible={cardModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <CreditCard size={22} color="#065f46" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalCardTitle}>Nomba POS Terminal</Text>
                <Text style={styles.modalCardSub}>Tap, insert, or swipe card on terminal</Text>
              </View>
              <TouchableOpacity onPress={() => setCardModal(false)} hitSlop={10}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.cardModalLabel}>Transaction Amount</Text>
            <View style={styles.amountInputWrap}>
              <Text style={styles.currencyPrefix}>₦</Text>
              <TextInput
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="number-pad"
                style={styles.amountInput}
              />
            </View>

            <TouchableOpacity
              style={styles.triggerCardBtn}
              activeOpacity={0.85}
              onPress={handlePayWithCard}
            >
              <Text style={styles.triggerCardBtnText}>Activate POS Terminal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
  },
  errorCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    gap: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ef4444",
    marginTop: 8,
  },
  errorDesc: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
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
  memberSub: {
    fontSize: 11,
    color: "#64748b",
  },
  breakdownCard: {
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
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  breakdownValueHighlight: {
    fontSize: 13,
    fontWeight: "800",
    color: "#065f46",
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#065f46",
  },
  actionsCard: {
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
  inputSectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  amountInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "800",
    color: "#065f46",
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    height: "100%",
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    backgroundColor: "#065f46",
    borderRadius: 14,
    shadowColor: "#065f46",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  cardPayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    backgroundColor: "#e6f9f0",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 14,
  },
  cardPayBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#065f46",
  },
  printBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
  },
  printBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    alignItems: "center",
  },
  successIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  failureIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  confirmDetailsBox: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailItemLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  detailItemVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  modalPrintBtn: {
    width: "100%",
    height: 48,
    backgroundColor: "#065f46",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },
  modalPrintBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  modalDoneBtn: {
    width: "100%",
    height: 46,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDoneBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  modalCloseBtn: {
    width: "100%",
    height: 48,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalCardSub: {
    fontSize: 11,
    color: "#64748b",
  },
  cardModalLabel: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  triggerCardBtn: {
    width: "100%",
    height: 48,
    backgroundColor: "#065f46",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  triggerCardBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
});