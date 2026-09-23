import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { getPayment, makePayment } from "@/lib/services/payment";
import { createRequest, getRequestsByPayment } from "@/lib/services/request";
import { Payment, Request } from "@/lib/types";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VAT_RATE = 0.075;
const CHARGE_RATE = 0.015;
const PENALTY_RATE_PER_DAY = 0.00005;

/**
 * Single source of truth for the fee breakdown.
 * Incorporates discount adjustments, overdue penalties, VAT, and processing fees.
 */
function computeBreakdown(payment: Payment | null) {
    if (!payment) {
        return { principal: 0, vat: 0, charges: 0, subtotal: 0, daysOverdue: 0, penalty: 0, discount: 0, total: 0 };
    }

    const principal = Number(
        Number(payment.debt) > 0 ? payment.debt : payment.amount || 0
    );
    const vat = principal * VAT_RATE;
    const charges = principal * CHARGE_RATE;
    const subtotal = principal + vat + charges;

    const paymentDate = new Date(payment.due || payment.date || "");
    const currentDate = new Date();

    let daysOverdue = 0;
    if (!Number.isNaN(paymentDate.getTime()) && currentDate > paymentDate) {
        daysOverdue = Math.floor(
            (currentDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
        );
    }

    const penalty = subtotal * PENALTY_RATE_PER_DAY * daysOverdue;
    const discount = Number(payment.discount || 0);
    const total = Math.max(0, subtotal + penalty - discount);

    return { principal, vat, charges, subtotal, daysOverdue, penalty, discount, total };
}

export default function MakePayment() {
    const router = useRouter();
    const { currentUser, token } = useAuth();
    const { failed, success } = useToast();
    const search = useLocalSearchParams();

    const [refreshing, setRefreshing] = useState(false);
    const [payment, setPayment] = useState<Payment | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<string>("");
    const [secureTokenInput, setSecureTokenInput] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState<Request[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [discountReason, setDiscountReason] = useState("");
    const [requestSubmitting, setRequestSubmitting] = useState(false);
    const { pin } = useWallet();

    const formatAmount = (value: number, withSymbol = true) => {
        const formatted = value.toLocaleString("en-NG", {
            style: "currency",
            currency: "NGN",
        });
        return withSymbol ? formatted : formatted.replace("₦", "").trim();
    };

    const formatDate = (value?: string | Date | null) => {
        if (!value) return "N/A";
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? "N/A"
            : date.toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
    };

    const fetchRequests = useCallback(async (paymentTargetId?: string) => {
        const idToQuery = paymentTargetId || payment?.id || (search.reference as string);
        if (!idToQuery) return;
        setLoadingRequests(true);
        try {
            const data = await getRequestsByPayment(idToQuery, token as string);
            if (data.ok && (data.data || data.requests)) {
                setRequests(data.data || data.requests || []);
            } else {
                setRequests([]);
            }
        } catch (err) {
            console.warn("Error fetching discount requests:", err);
            setRequests([]);
        } finally {
            setLoadingRequests(false);
        }
    }, [payment?.id, search.reference, token]);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            if (!currentUser?.uid) {
                setPayment(null);
                return;
            }

            const data = await getPayment(search.reference as string, token as string);

            if (data.ok && data.payment) {
                setPayment(data.payment);
                fetchRequests(data.payment.id || data.payment.reference);
            } else {
                setPayment(null);
                failed(data.message || "Failed to fetch payments");
            }
        } catch (error: any) {
            setPayment(null);
            failed(error.message || "An error occurred while fetching payments");
        } finally {
            setLoading(false);
        }
    }, [currentUser?.uid, token, failed, search.reference, fetchRequests]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchPayments(), fetchRequests()]);
        setRefreshing(false);
    };

    const handleDiscountRequest = async () => {
        if (!discountReason.trim()) {
            failed("Please enter a reason for the discount request");
            return;
        }

        if (!payment) {
            failed("No payment selected");
            return;
        }

        setRequestSubmitting(true);
        try {
            const res = await createRequest(
                {
                    memberId: currentUser?.uid || "",
                    paymentId: payment.id || payment.reference,
                    reason: discountReason.trim(),
                },
                token as string
            );

            if (res.ok) {
                success(res.message || "Discount request submitted successfully");
                setDiscountReason("");
                fetchRequests(payment.id || payment.reference);
            } else {
                failed(res.message || "Failed to submit discount request");
            }
        } catch (err: any) {
            failed(err?.message || "An error occurred while requesting discount");
        } finally {
            setRequestSubmitting(false);
        }
    };

    const closePaymentModal = () => {
        setSecureTokenInput("");

        router.back();
    };

    const handlePayNow = async () => {
        if (loading) return; // guard against double-tap

        if (!currentUser?.uid) {
            failed("No user available");
            return;
        }

        if (!secureTokenInput || secureTokenInput.trim().length === 0) {
            failed("Please enter your secure token");
            return;
        }

        if (secureTokenInput !== pin) {
            failed("Invalid secure token");
            return;
        }

        if (!payment) {
            failed("No payment selected");
            return;
        }

        setLoading(true);

        try {
            const paymentRes = await makePayment(
                currentUser.uid,
                Number(paymentAmount),
                payment.reference as string,
                currentUser.center as string,
                currentUser.company as string,
                token as string
            );

            if (!paymentRes || !paymentRes.ok) {
                failed(paymentRes?.message || "Payment failed");
                return;
            }

            success("Payment successful");
            setSecureTokenInput("");
            setPaymentAmount("");
            fetchPayments();
        } catch (error: any) {
            failed(error?.message || "An error occurred during verification");
        } finally {
            setLoading(false);
        }
    };

    const breakdown = useMemo(() => computeBreakdown(payment), [payment]);
    const { principal, vat, charges, subtotal, daysOverdue, penalty, total: totalAmount, discount } = breakdown;

    useEffect(() => {
        if (payment) {
            setPaymentAmount(formatAmount(totalAmount, false));
        }
    }, [payment, totalAmount]);

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <View style={styles.modalShell}>
                    <View style={styles.modalHeaderRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.modalEyebrow}>Payment checkout</Text>
                            <Text style={styles.modalHeaderTitle}>Review and pay securely</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButtonWrap}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                            onPress={closePaymentModal}
                        >
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.modalContent}
                        showsVerticalScrollIndicator={true}
                        keyboardShouldPersistTaps="handled"
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    >
                        <View style={styles.modalHeroCard}>
                            <Text style={styles.modalTitleLarge} numberOfLines={1}>
                                {payment?.pricing?.title ||
                                    payment?.payment ||
                                    "Payment Details"}
                            </Text>

                            <View style={styles.badgeRow}>
                                {payment?.pricing?.category ? (
                                    <View style={styles.categoryBadge}>
                                        <Text style={styles.categoryText}>
                                            {payment?.pricing?.category}
                                        </Text>
                                    </View>
                                ) : null}

                                <View
                                    style={[
                                        styles.statusBadge,
                                        payment?.status?.toLowerCase() === "success"
                                            ? styles.statusSuccess
                                            : styles.statusPending,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusText,
                                            payment?.status?.toLowerCase() === "success"
                                                ? styles.statusTextSuccess
                                                : styles.statusTextPending,
                                        ]}
                                    >
                                        {payment?.status || "Pending"}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.modalSubtitle}>
                                Confirm the details below, review the calculation breakdown, and complete the payment.
                            </Text>
                        </View>

                        <View style={styles.summaryGrid}>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Reference</Text>
                                <Text style={styles.summaryValue} numberOfLines={1}>
                                    {payment?.reference || "N/A"}
                                </Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Due date</Text>
                                <Text style={styles.summaryValue} numberOfLines={1}>
                                    {formatDate(payment?.due)}
                                </Text>
                            </View>
                            <View style={[styles.summaryCard, styles.summaryCardWide]}>
                                <Text style={styles.summaryLabel}>Paid balance</Text>
                                <Text style={[styles.summaryValue, { color: "#166534" }]}>
                                    {payment
                                        ? formatAmount((Number(payment.amount) || 0) - (Number(payment.paid) || 0))
                                        : "-"}
                                </Text>
                            </View>
                            <View style={[styles.summaryCard, styles.summaryCardWide]}>
                                <Text style={styles.summaryLabel}>Outstanding balance</Text>
                                <Text style={[styles.summaryValue, { color: "#dc2626" }]}>
                                    {payment ? formatAmount(Number(payment.debt) || 0) : "-"}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.breakdownCard}>
                            <Text style={styles.breakdownHeaderTitle}>Payment Calculation Breakdown</Text>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Principal Amount</Text>
                                <Text style={styles.detailValue}>{formatAmount(principal)}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Discount</Text>
                                <Text style={styles.detailValue}>{formatAmount(discount || 0)}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>VAT (7.5%)</Text>
                                <Text style={styles.detailValue}>{formatAmount(vat)}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Charges (1.5%)</Text>
                                <Text style={styles.detailValue}>{formatAmount(charges)}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Subtotal</Text>
                                <Text style={styles.detailValueBold}>{formatAmount(subtotal)}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Days Overdue</Text>
                                <Text style={[styles.detailValue, daysOverdue > 0 ? { color: "#dc2626" } : {}]}>
                                    {daysOverdue} {daysOverdue === 1 ? "day" : "days"}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Penalty (0.005%/day)</Text>
                                <Text style={[styles.detailValue, penalty > 0 ? { color: "#dc2626" } : {}]}>
                                    {formatAmount(penalty)}
                                </Text>
                            </View>

                            {breakdown.discount > 0 ? (
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: "#166534", fontWeight: "700" }]}>
                                        Approved Discount
                                    </Text>
                                    <Text style={[styles.detailValueBold, { color: "#166534" }]}>
                                        -{formatAmount(breakdown.discount)}
                                    </Text>
                                </View>
                            ) : null}

                            <View style={[styles.detailRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total Payable Amount</Text>
                                <Text style={styles.totalValue}>{formatAmount(totalAmount)}</Text>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Amount to pay</Text>
                            <TextInput
                                style={styles.amountInputLarge}
                                placeholder="0"
                                placeholderTextColor="#94a3b8"
                                keyboardType="numeric"
                                value={paymentAmount}
                                onChangeText={(text) => setPaymentAmount(text.replace(/[^0-9]/g, ""))}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Secure token</Text>
                            <TextInput
                                style={styles.amountInput}
                                placeholder="Enter secure token"
                                placeholderTextColor="#94a3b8"
                                secureTextEntry
                                value={secureTokenInput}
                                onChangeText={(text) => setSecureTokenInput(text)}
                            />
                        </View>

                        <View style={styles.feeNote}>
                            <Text style={styles.feeNoteText}>
                                A 1.5% charge ({formatAmount(charges)}) is already included in the total above.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.modalPayButton, loading && styles.modalPayButtonDisabled]}
                            activeOpacity={0.95}
                            disabled={loading}
                            onPress={handlePayNow}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.modalPayText}>Pay now</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            disabled={loading}
                            onPress={closePaymentModal}
                        >
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>

                        {/* Discount Requests Section */}
                        <View style={styles.discountSection}>
                            <View style={styles.discountHeaderRow}>
                                <Text style={styles.discountHeaderTitle}>Discount Requests</Text>
                                {requests.length > 0 && (
                                    <View style={styles.requestCountBadge}>
                                        <Text style={styles.requestCountText}>
                                            {requests.length} {requests.length === 1 ? "request" : "requests"}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {loadingRequests ? (
                                <View style={styles.requestLoadingContainer}>
                                    <ActivityIndicator size="small" color="#0ea360" />
                                    <Text style={styles.requestLoadingText}>Loading requests...</Text>
                                </View>
                            ) : requests.length > 0 ? (
                                <View style={styles.requestList}>
                                    {requests.map((req, idx) => {
                                        const isApproved = req.status === "APPROVED";
                                        const isRejected = req.status === "REJECTED";
                                        return (
                                            <View key={req.id || idx} style={styles.requestCard}>
                                                <View style={styles.requestCardTop}>
                                                    <View style={{ flex: 1, paddingRight: 8 }}>
                                                        <Text style={styles.requestIdText}>ID: {req.id}</Text>
                                                        <Text style={styles.requestDateText}>{formatDate(req.createdAt)}</Text>
                                                    </View>
                                                    <View
                                                        style={[
                                                            styles.requestStatusBadge,
                                                            isApproved
                                                                ? styles.requestStatusApproved
                                                                : isRejected
                                                                ? styles.requestStatusRejected
                                                                : styles.requestStatusPending,
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.requestStatusText,
                                                                isApproved
                                                                    ? styles.requestStatusTextApproved
                                                                    : isRejected
                                                                    ? styles.requestStatusTextRejected
                                                                    : styles.requestStatusTextPending,
                                                            ]}
                                                        >
                                                            {req.status}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={styles.requestReasonBox}>
                                                    <Text style={styles.requestReasonLabel}>Reason:</Text>
                                                    <Text style={styles.requestReasonText}>{req.reason || "No reason specified."}</Text>
                                                </View>
                                                {req.approverComment ? (
                                                    <View style={[styles.requestReasonBox, { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }]}>
                                                        <Text style={[styles.requestReasonLabel, { color: "#166534" }]}>Council Approval Note:</Text>
                                                        <Text style={[styles.requestReasonText, { color: "#166534" }]}>{req.approverComment}</Text>
                                                    </View>
                                                ) : null}
                                                {req.adminComment ? (
                                                    <View style={[styles.requestReasonBox, { backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }]}>
                                                        <Text style={[styles.requestReasonLabel, { color: "#334155" }]}>Admin Note:</Text>
                                                        <Text style={[styles.requestReasonText, { color: "#334155" }]}>{req.adminComment}</Text>
                                                    </View>
                                                ) : null}
                                            </View>
                                        );
                                    })}
                                </View>
                            ) : (
                                <View style={styles.noRequestsBox}>
                                    <Text style={styles.noRequestsText}>No discount requests for this bill yet.</Text>
                                </View>
                            )}

                            {/* Discount Request Submission */}
                            {payment?.status !== "SUCCESS" &&
                                payment?.status !== "COMPLETED" &&
                                (!payment?.discount || Number(payment.discount) === 0) && (
                                    <View style={styles.requestFormCard}>
                                        <Text style={styles.requestFormTitle}>Request a Bill Waiver or Discount</Text>
                                        <Text style={styles.requestFormSubtitle}>
                                            Submit a formal request to revenue administrators for consideration.
                                        </Text>
                                        <TextInput
                                            style={styles.discountInput}
                                            placeholder="Enter reason for request (e.g. property renovation, financial hardship, business closure)"
                                            placeholderTextColor="#94a3b8"
                                            multiline
                                            numberOfLines={3}
                                            value={discountReason}
                                            onChangeText={setDiscountReason}
                                            editable={!requestSubmitting}
                                        />
                                        <TouchableOpacity
                                            style={[styles.requestSubmitButton, requestSubmitting && styles.requestSubmitButtonDisabled]}
                                            onPress={handleDiscountRequest}
                                            disabled={requestSubmitting}
                                            activeOpacity={0.85}
                                        >
                                            {requestSubmitting ? (
                                                <View style={styles.buttonRow}>
                                                    <ActivityIndicator size="small" color="#fff" />
                                                    <Text style={styles.requestSubmitButtonText}>Submitting Request...</Text>
                                                </View>
                                            ) : (
                                                <Text style={styles.requestSubmitButtonText}>Submit Discount Request</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f6f8f9" },
    container: { paddingBottom: 40 },
    header: { paddingVertical: 22, paddingHorizontal: 14 },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 20,
    },
    back: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: { fontSize: 18, color: "#000" },
    loadingCard: {
        marginHorizontal: 14,
        borderRadius: 10,
        padding: 16,
        backgroundColor: "#eaf9f0",
        borderWidth: 1,
        borderColor: "#d9f0e3",
    },
    emptyCard: {
        marginHorizontal: 14,
        borderRadius: 10,
        padding: 16,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#eef2f3",
    },
    emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
    emptyText: { marginTop: 6, fontSize: 13, color: "#64748b" },
    paymentCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        flexDirection: "column",
        gap: 14,
    },
    cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
    planLabel: { fontSize: 16, fontWeight: "800", color: "#0f172a", lineHeight: 20 },
    paymentMeta: { marginTop: 4, fontSize: 13, color: "#64748b", lineHeight: 18 },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 999,
        alignSelf: "flex-start",
        borderWidth: 1,
    },
    statusSuccess: {
        backgroundColor: "#ecfdf5",
        borderColor: "#a7f3d0",
    },
    statusPending: {
        backgroundColor: "#eff6ff",
        borderColor: "#bfdbfe",
    },
    statusText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
    statusTextSuccess: { color: "#166534" },
    statusTextPending: { color: "#1d4ed8" },
    amountGrid: {
        flexDirection: "row",
        gap: 10,
    },
    amountBadge: {
        flex: 1,
        backgroundColor: "#dcfce7",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 12,
        minWidth: 70,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#0ea360",
    },
    amountLabel: { fontSize: 12, color: "#0f172a", fontWeight: "600" },
    amountValue: { fontSize: 16, color: "#0ea360", fontWeight: "700", marginTop: 2 },
    debtBadge: {
        flex: 1,
        backgroundColor: "#fee2e2",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 12,
        minWidth: 70,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#dc2626",
    },
    debtLabel: { fontSize: 12, color: "#0f172a", fontWeight: "600" },
    debtValue: { fontSize: 16, color: "#dc2626", fontWeight: "700", marginTop: 2 },
    payNowButton: {
        width: "100%",
        backgroundColor: "#0ea360",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    payNowText: { color: "#fff", fontWeight: "800", fontSize: 14 },
    modalShell: { flex: 1, backgroundColor: "#f8fafc" },
    modalHeaderRow: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        backgroundColor: "#fff",
    },
    modalEyebrow: { color: "#0ea360", fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
    modalHeaderTitle: { marginTop: 4, color: "#0f172a", fontSize: 18, fontWeight: "800" },
    closeButtonWrap: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0" },
    closeButton: { fontSize: 16, color: "#0f172a", fontWeight: "700" },
    modalTitleLarge: { fontSize: 20, fontWeight: "800", marginBottom: 6, color: "#0f172a" },
    modalSubtitle: { marginTop: 4, color: "#64748b", fontSize: 13, lineHeight: 19 },
    modalContent: { padding: 16, paddingTop: 14, paddingBottom: 50, alignItems: "stretch" },
    modalHeroCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 12 },
    badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    categoryBadge: { backgroundColor: "#f1f5f9", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
    categoryText: { color: "#0f172a", fontWeight: "700" },
    summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
    summaryCard: { flexBasis: "48%", flexGrow: 1, backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#e2e8f0" },
    summaryCardWide: { flexBasis: "100%" },
    summaryLabel: { color: "#64748b", fontSize: 12, fontWeight: "600", marginBottom: 6 },
    summaryValue: { color: "#0f172a", fontSize: 14, fontWeight: "700" },
    breakdownCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        marginBottom: 12,
    },
    breakdownHeaderTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#0f172a",
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
        paddingBottom: 8,
    },
    detailValueBold: {
        color: "#0f172a",
        fontSize: 14,
        fontWeight: "700",
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
        borderBottomWidth: 0,
    },
    totalLabel: {
        color: "#0f172a",
        fontSize: 15,
        fontWeight: "800",
    },
    totalValue: {
        color: "#0ea360",
        fontSize: 17,
        fontWeight: "800",
    },
    inputGroup: { marginBottom: 12 },
    inputLabel: { marginBottom: 6, color: "#334155", fontSize: 13, fontWeight: "600" },
    detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
    detailLabel: { color: "#64748b", fontSize: 13 },
    detailValue: { color: "#0f172a", fontSize: 14, fontWeight: "600" },
    amountInput: {
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#1e293b",
    },
    amountInputLarge: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 16, fontSize: 18, color: "#0f172a", width: "100%" },
    modalPayButton: { backgroundColor: "#0ea360", paddingVertical: 14, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 16 },
    modalPayButtonDisabled: { opacity: 0.6 },
    modalPayText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    modalCancelButton: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", paddingVertical: 12, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 10 },
    modalCancelText: { color: "#374151", fontSize: 15, fontWeight: "600" },
    errorBanner: { backgroundColor: "#fee2e2", paddingHorizontal: 12, paddingVertical: 14, marginVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#fecaca" },
    errorText: { color: "#b91c1c", fontSize: 14, lineHeight: 20 },
    feeNote: { marginTop: 2, padding: 12, borderRadius: 10, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0" },
    feeNoteText: { color: "#475569", fontSize: 13, lineHeight: 19 },
    discountSection: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        marginVertical: 12,
    },
    discountHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
        paddingBottom: 10,
        marginBottom: 12,
    },
    discountHeaderTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#0f172a",
    },
    requestCountBadge: {
        backgroundColor: "#e2f8ec",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    requestCountText: {
        color: "#0ea360",
        fontSize: 11,
        fontWeight: "700",
    },
    requestLoadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        gap: 8,
    },
    requestLoadingText: {
        color: "#64748b",
        fontSize: 13,
    },
    requestList: {
        gap: 10,
        marginBottom: 14,
    },
    requestCard: {
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    requestCardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    requestIdText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#1e293b",
    },
    requestDateText: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 2,
    },
    requestStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        borderWidth: 1,
    },
    requestStatusPending: {
        backgroundColor: "#fef3c7",
        borderColor: "#fde68a",
    },
    requestStatusApproved: {
        backgroundColor: "#ecfdf5",
        borderColor: "#a7f3d0",
    },
    requestStatusRejected: {
        backgroundColor: "#fee2e2",
        borderColor: "#fecaca",
    },
    requestStatusText: {
        fontSize: 10,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0.3,
    },
    requestStatusTextPending: { color: "#b45309" },
    requestStatusTextApproved: { color: "#166534" },
    requestStatusTextRejected: { color: "#b91c1c" },
    requestReasonBox: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: "#f1f5f9",
        marginTop: 4,
    },
    requestReasonLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#64748b",
        marginBottom: 2,
    },
    requestReasonText: {
        fontSize: 12,
        color: "#334155",
        lineHeight: 17,
    },
    noRequestsBox: {
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    noRequestsText: {
        fontSize: 13,
        color: "#94a3b8",
        fontStyle: "italic",
    },
    requestFormCard: {
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: "#cbd5e1",
        marginTop: 8,
    },
    requestFormTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 2,
    },
    requestFormSubtitle: {
        fontSize: 11,
        color: "#64748b",
        marginBottom: 10,
        lineHeight: 16,
    },
    discountInput: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#cbd5e1",
        borderRadius: 8,
        padding: 10,
        fontSize: 13,
        color: "#1e293b",
        textAlignVertical: "top",
        minHeight: 64,
        marginBottom: 10,
    },
    requestSubmitButton: {
        backgroundColor: "#0ea360",
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    requestSubmitButtonDisabled: {
        opacity: 0.6,
    },
    requestSubmitButtonText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "700",
    },
    buttonRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
});