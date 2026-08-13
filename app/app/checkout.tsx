import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { getPayment, makePayment } from "@/lib/services/payment";
import { Payment } from "@/lib/types";
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
 * Previously this math was duplicated (once in the "Pay now" card button,
 * once inline in the modal render) and read slightly different fields
 * each time, which let the two silently drift apart.
 */
function computeBreakdown(payment: Payment | null) {
    if (!payment) {
        return { principal: 0, vat: 0, charges: 0, subtotal: 0, daysOverdue: 0, penalty: 0, total: 0 };
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
    const total = subtotal + penalty;

    return { principal, vat, charges, subtotal, daysOverdue, penalty, total };
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
    }, [currentUser?.uid, token, failed]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPayments();
        setRefreshing(false);
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
    const { principal, vat, charges, subtotal, daysOverdue, penalty, total: totalAmount } = breakdown;

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
});