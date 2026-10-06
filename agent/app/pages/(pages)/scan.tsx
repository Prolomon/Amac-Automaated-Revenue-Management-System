import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RelativePathString, useRouter } from "expo-router";
import {
  ScanBarcode,
  Zap,
  ZapOff,
  ShieldCheck,
  CreditCard,
  Camera,
  AlertTriangle,
} from "lucide-react-native";

export default function ScanPage() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flash, setFlash] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    let extractedId = data;

    // Check if the scanned QR is a checkout link, e.g. .../payment/<identifier>/checkout
    if (data.includes("/checkout")) {
      const parts = data.split("/");
      const checkoutIdx = parts.indexOf("checkout");
      if (checkoutIdx > 0) {
        extractedId = parts[checkoutIdx - 1];
      }
    } else {
      try {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === "object" && parsed.id) {
          extractedId = parsed.id;
        }
      } catch {
        // use raw data
      }
    }

    if (extractedId) {
      router.push(`/pages/payment?id=${extractedId}` as RelativePathString);
      setTimeout(() => {
        setScanned(false);
      }, 1500);
    } else {
      setScanned(false);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#065f46" />
        <Text style={styles.permissionSub}>Initializing camera terminal...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <View style={styles.permissionCard}>
          <View style={styles.permissionIconWrap}>
            <Camera size={36} color="#065f46" />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionSub}>
            AMAC field agents require camera permission to scan taxpayer QR codes and verify physical demand notices.
          </Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            activeOpacity={0.85}
            onPress={requestPermission}
          >
            <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.badgeWrap}>
          <ShieldCheck size={12} color="#065f46" />
          <Text style={styles.badgeText}>FIELD VERIFICATION</Text>
        </View>
        <Text style={styles.headerTitle}>Scan Assessment QR</Text>
        <Text style={styles.headerSubtitle}>
          Align the taxpayer QR invoice or physical notice within the frame
        </Text>
      </View>

      {/* Viewfinder Section */}
      <View style={styles.scannerContainer}>
        <View style={styles.viewfinderWrap}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            enableTorch={flash}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />

          {/* Scanner Overlay Frame */}
          <View style={styles.overlayFrame}>
            <View style={[styles.cornerBracket, styles.topLeft]} />
            <View style={[styles.cornerBracket, styles.topRight]} />
            <View style={[styles.cornerBracket, styles.bottomLeft]} />
            <View style={[styles.cornerBracket, styles.bottomRight]} />
            <View style={styles.scanningLine} />
          </View>
        </View>

        {/* Scanner Controls Row */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlBtn, flash && styles.controlBtnActive]}
            activeOpacity={0.8}
            onPress={() => setFlash((f) => !f)}
          >
            {flash ? (
              <Zap size={20} color="#065f46" />
            ) : (
              <ZapOff size={20} color="#64748b" />
            )}
            <Text style={[styles.controlBtnText, flash && styles.controlBtnTextActive]}>
              {flash ? "Flashlight On" : "Flashlight Off"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/pages/(pages)/pay" as RelativePathString)}
          >
            <CreditCard size={20} color="#64748b" />
            <Text style={styles.controlBtnText}>Manual Lookup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
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
  scannerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#f8fafc",
  },
  viewfinderWrap: {
    width: 290,
    height: 290,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000000",
    shadowColor: "#065f46",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  overlayFrame: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  cornerBracket: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: "#065f46",
  },
  topLeft: {
    top: 14,
    left: 14,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 14,
    right: 14,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 14,
    left: 14,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  scanningLine: {
    width: "80%",
    height: 2,
    backgroundColor: "#065f46",
    opacity: 0.8,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
    paddingHorizontal: 20,
  },
  controlBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  controlBtnActive: {
    backgroundColor: "#e6f9f0",
    borderColor: "#a7f3d0",
  },
  controlBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  controlBtnTextActive: {
    color: "#065f46",
  },
  permissionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 24,
    alignItems: "center",
    maxWidth: 360,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  permissionIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  permissionSub: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  permissionBtn: {
    backgroundColor: "#065f46",
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: "#065f46",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
});
