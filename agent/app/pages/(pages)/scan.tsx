import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RelativePathString, useRouter } from "expo-router";

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
      } catch (e) {
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0ea360" />
        <Text style={{ color: "#64748b", marginTop: 12 }}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#0f172a", fontSize: 16, fontWeight: "600" }}>No access to camera</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <Text style={styles.headerSubtitle}>Align the payment QR code within the frame to scan</Text>
      </View>

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
            size={24}
            color="#0ea360"
          />
          <Text style={styles.flashText}>
            {flash ? "Flash On" : "Flash Off"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "ghostwhite" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "ghostwhite" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
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
  permissionBtn: {
    marginTop: 16,
    backgroundColor: "#0ea360",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  qrBoxWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40, backgroundColor: "ghostwhite" },
  qrBox: {
    width: 280,
    height: 280,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#0ea360",
    backgroundColor: "#000000",
  },
  flashBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 32,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  flashText: { color: "#0ea360", marginLeft: 10, fontSize: 16, fontWeight: "600" },
});
