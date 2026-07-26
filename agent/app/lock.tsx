import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { RelativePathString, useRouter } from "expo-router";
import { Lock, Delete, LogOut } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LockScreen() {
    const router = useRouter();
    const { currentUser, logout, loading: authLoading, verifyCode } = useAuth();
    const { refresh } = useWallet();
    const { failed, success } = useToast();
    const [loading, setLoading] = useState(false);
    const [pin, setPin] = useState<string>("")

    // Redirect to home if no user is logged in
    useEffect(() => {
        if (!authLoading && !currentUser) {
            router.replace("/");
        }
    }, [currentUser, authLoading]);

    const handlePressNumber = (num: number) => {
        if (pin.length < 6) {
            setPin((prev) => prev + num);
        }
    };

    const handleDelete = () => {
        setPin((prev) => prev.slice(0, -1));
    };
    
    const handleProceed = async () => {
        if (pin.length < 6) {
            failed("Security code must be at least 6 digits");
            return;
        }
        const res = await verifyCode(pin);
        if (res.ok) {
            success("Pin Verified successfully")
            router.replace("(pages)" as RelativePathString);
        } else {
            failed(res.message || "An error occurred validating pin")
            setPin("");
        }
    };

    const handleSwitchAccount = async () => {
        await logout();
        router.replace("/");
    };

    const pinDots = Array(6).fill(0);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.lockIconWrap}>
                        <Lock size={28} color="#0ea360" />
                    </View>
                    <Text style={styles.title}>Enter Security Code</Text>
                    <Text style={styles.subtitle}>
                        {currentUser?.fullname ? `Welcome back, ${currentUser.fullname.split(" ")[0]}` : "Welcome back"}
                    </Text>
                </View>

                {/* PIN Dots representation */}
                <View style={styles.dotsContainer}>
                    {pinDots.map((_, index) => {
                        const hasValue = index < pin.length;
                        return (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    hasValue ? styles.dotFilled : styles.dotEmpty,
                                ]}
                            />
                        );
                    })}
                </View>

                {/* Loading indicator */}
                <View style={styles.loadingContainer}>
                    {loading && <ActivityIndicator size="small" color="#0ea360" />}
                </View>

                {/* Keypad */}
                <View style={styles.keypad}>
                    {[
                        [1, 2, 3],
                        [4, 5, 6],
                        [7, 8, 9],
                    ].map((row, rowIndex) => (
                        <View key={rowIndex} style={styles.keypadRow}>
                            {row.map((num) => (
                                <TouchableOpacity
                                    key={num}
                                    style={styles.key}
                                    activeOpacity={0.7}
                                    onPress={() => handlePressNumber(num)}
                                    disabled={loading}
                                >
                                    <Text style={styles.keyText}>{num}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                    <View style={styles.keypadRow}>
                        <TouchableOpacity
                            style={[styles.key, styles.utilityKey]}
                            activeOpacity={0.7}
                            onPress={handleDelete}
                            disabled={loading || pin.length === 0}
                        >
                            <Delete size={22} color={pin.length > 0 ? "#ef4444" : "#cbd5e1"} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.key}
                            activeOpacity={0.7}
                            onPress={() => handlePressNumber(0)}
                            disabled={loading}
                        >
                            <Text style={styles.keyText}>0</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.key, styles.utilityKey, pin.length >= 4 ? styles.proceedActive : undefined]}
                            activeOpacity={0.7}
                            onPress={handleProceed}
                            disabled={loading || pin.length < 4}
                        >
                            <Text style={[styles.proceedText, pin.length >= 4 ? styles.proceedTextActive : undefined]}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer Switch Account */}
                <TouchableOpacity
                    style={styles.switchAccountBtn}
                    activeOpacity={0.8}
                    onPress={handleSwitchAccount}
                    disabled={loading}
                >
                    <LogOut size={16} color="#64748b" style={{ marginRight: 6 }} />
                    <Text style={styles.switchAccountText}>Switch Account</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    container: {
        flex: 1,
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    header: {
        alignItems: "center",
        marginTop: 20,
    },
    lockIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#e6f9f0",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#0f172a",
        textAlign: "center",
    },
    subtitle: {
        fontSize: 15,
        color: "#64748b",
        marginTop: 6,
        textAlign: "center",
    },
    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        marginVertical: 20,
    },
    dot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1.5,
    },
    dotEmpty: {
        borderColor: "#cbd5e1",
        backgroundColor: "transparent",
    },
    dotFilled: {
        borderColor: "#0ea360",
        backgroundColor: "#0ea360",
    },
    loadingContainer: {
        height: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    keypad: {
        width: "100%",
        maxWidth: 320,
        gap: 12,
        marginBottom: 20,
    },
    keypadRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    key: {
        flex: 1,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#f8fafc",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    utilityKey: {
        backgroundColor: "#f1f5f9",
    },
    keyText: {
        fontSize: 26,
        fontWeight: "600",
        color: "#0f172a",
    },
    proceedText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#94a3b8",
    },
    proceedActive: {
        backgroundColor: "#e6f9f0",
        borderWidth: 1,
        borderColor: "#d4f5e6",
    },
    proceedTextActive: {
        color: "#0ea360",
    },
    switchAccountBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    switchAccountText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
    },
});
