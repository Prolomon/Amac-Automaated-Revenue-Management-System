import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../hooks/use-auth";
import { RelativePathString, useRouter } from "expo-router";

export default function ScanPage() {
  const router = useRouter();
  const { verifyPayment } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scannedType, setScannedType] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [flash, setFlash] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<null | { fullname: string; userId: string }>(null);
  const [successModal, setSuccessModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<"scan" | "manual">("scan");
  const [manualId, setManualId] = useState("");

  const cameraRef = useRef<CameraView | null>(null);

  const onRefresh = () => {
    setRefreshing(true);
    handleRemove();
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    try {
      // Parse the JSON from QR code
      const parsed = JSON.parse(data);
      const id = parsed.id;
      const type = parsed.type;

      if (type === "verify") {
        setScannedType("verify");
        if (id) {
          setScannedData(id);
          setModalVisible(true);
        } else {
          setScannedData(data);
          setModalVisible(true);
        }
      } else if (type === "pay") {
        setScannedType("pay");
        setScannedData(id || data);

        // ==========================================
        // [USER EDIT HERE FOR PAY TYPE]
        // The type is 'pay' so we leave it empty as requested.
        // You can add your custom payment execution flow here.
        // ==========================================

        setModalVisible(true);
      } else {
        // Fallback for missing type
        setScannedType(null);
        setScannedData(id || data);
        setModalVisible(true);
      }
    } catch (error) {
      // If parsing fails, use raw data
      setScannedType(null);
      setScannedData(data);
      setModalVisible(true);
    }
  };

  const handleManualSubmit = () => {
    if (!manualId.trim()) return;
    setScannedType(null); // Let the user choose action or default
    setScannedData(manualId.trim());
    setModalVisible(true);
  };

  const handleRemove = () => {
    setScanned(false);
    setScannedData(null);
    setScannedType(null);
    setModalVisible(false);
    setVerifyResult(null);
    setVerifying(false);
  };

  const handlePayNow = () => {
    setModalVisible(false);
    const payId = scannedData || manualId;
    if (payId) {
      router.push(`/pages/payment?id=${payId}` as RelativePathString);
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setVerifyResult(null);
    setVerifying(false);
  };

  const handleVerify = async () => {
    if (!scannedData) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      // Replace with your actual API endpoint
      const result = await verifyPayment({ reference: scannedData, session: "agent_terminal" });

      if (!result.ok) throw new Error("Verification failed");
      // result should be { reference, memberName, userId }
      setVerifyResult({
        fullname: (result.businessName || "").toUpperCase(),
        userId: (result.userId || "").toUpperCase(),
      });
      setSuccessModal(true);
      setModalVisible(false);
    } catch (e) {
      setVerifyResult(null);
      // Optionally show error feedback
    } finally {
      setVerifying(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "scan" ? styles.tabButtonActive : undefined]}
          onPress={() => setActiveTab("scan")}
        >
          <Text style={[styles.tabText, activeTab === "scan" ? styles.tabTextActive : undefined]}>Scan QR Code</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "manual" ? styles.tabButtonActive : undefined]}
          onPress={() => setActiveTab("manual")}
        >
          <Text style={[styles.tabText, activeTab === "manual" ? styles.tabTextActive : undefined]}>Manual Entry</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === "scan" ? (
          <View style={styles.qrBoxWrap}>
            <View style={styles.qrBox}>
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                enableTorch={flash}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
              />
            </View>

            <TouchableOpacity
              style={styles.flashBtn}
              onPress={() => setFlash((f) => !f)}
            >
              <Ionicons
                name={flash ? "flash" : "flash-off"}
                size={28}
                color="#fff"
              />
              <Text style={styles.flashText}>
                {flash ? "Flash On" : "Flash Off"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.manualWrap}>
            <Text style={styles.manualLabel}>Enter Payment ID / Reference</Text>
            <TextInput
              style={styles.manualInput}
              placeholder="e.g. PMT-10293847"
              placeholderTextColor="#64748b"
              value={manualId}
              onChangeText={setManualId}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.manualSubmitBtn, !manualId.trim() ? styles.manualSubmitBtnDisabled : undefined]}
              onPress={handleManualSubmit}
              disabled={!manualId.trim()}
            >
              <Text style={styles.manualSubmitBtnText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Payment Reference</Text>
            <Text style={styles.modalData}>{scannedData}</Text>
            {scannedType === "pay" && (
              <Text style={styles.scannedTypeHint}>Scan Type: Pay Now</Text>
            )}
            {scannedType === "verify" && (
              <Text style={styles.scannedTypeHint2}>Scan Type: Verify</Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.aoBtn} onPress={handleRemove}>
                <Text style={styles.aoBtnText}>{activeTab === "scan" ? "Re Scan" : "Clear"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* If verify, show verify. If pay, show Pay Now. If null/both, show both. */}
            {(scannedType === null || scannedType === "verify") && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#0ea360', marginTop: 18 }]}
                onPress={handleVerify}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.aoBtnText}>Verify Payment</Text>
                )}
              </TouchableOpacity>
            )}

            {(scannedType === null || scannedType === "pay") && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#3b82f6', marginTop: (scannedType === "pay" ? 18 : 10) }]}
                onPress={handlePayNow}
              >
                <Text style={styles.aoBtnText}>Pay Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
      {/* Success Modal */}
      <Modal
        visible={successModal}
        transparent
        animationType="slide"
        onRequestClose={() => setSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: '#0ea360' }]}>Verification Successful</Text>
            {verifyResult && (
              <>
                <Text style={styles.modalLabel}>MEMBER NAME</Text>
                <Text style={styles.modalValue}>{verifyResult.fullname}</Text>
                <Text style={styles.modalLabel}>USER ID</Text>
                <Text style={styles.modalValue}>{verifyResult.userId}</Text>
              </>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => { setSuccessModal(false); handleRemove(); }}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101010" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { flexGrow: 1 },

  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1a1a1a",
    gap: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#2a2a2a",
  },
  tabButtonActive: {
    backgroundColor: "#0ea360",
  },
  tabText: {
    color: "#a0aec0",
    fontSize: 14,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#ffffff",
  },

  manualWrap: {
    padding: 24,
    marginTop: 40,
  },
  manualLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  manualInput: {
    backgroundColor: "#2a2a2a",
    color: "#ffffff",
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#3a3a3a",
    marginBottom: 20,
  },
  manualSubmitBtn: {
    backgroundColor: "#0ea360",
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  manualSubmitBtnDisabled: {
    backgroundColor: "#2a5a3a",
    opacity: 0.6,
  },
  manualSubmitBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  qrBoxWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  qrBox: {
    width: 260,
    height: 260,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#222",
  },

  modalLabel: { fontSize: 13, color: '#888', marginTop: 10 },
  modalValue: { fontSize: 16, color: '#222', fontWeight: 'bold', letterSpacing: 1 },
  closeBtn: {
    marginTop: 18,
    backgroundColor: '#0ea360',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  flashBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    backgroundColor: "#333",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  flashText: { color: "#fff", marginLeft: 10, fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 320,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#1a1a1a" },
  modalData: { fontSize: 16, color: "#4a5568", marginBottom: 12, fontWeight: "600" },
  scannedTypeHint: { fontSize: 13, color: "#3b82f6", fontWeight: "bold", marginBottom: 20 },
  scannedTypeHint2: { fontSize: 13, color: "#0ea360", fontWeight: "bold", marginBottom: 20 },
  modalActions: { flexDirection: "row", gap: 18, width: "100%", justifyContent: "center" },

  actionButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  aoBtn: {
    backgroundColor: "#e53935",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  aoBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  cancelBtn: {
    backgroundColor: "#a0aec0",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  cancelBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
