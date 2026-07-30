import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight } from "lucide-react-native";

const ONBOARDING_STEPS = [
  {
    title: "AMAC Unified Revenue",
    subtitle: "Welcome to AURMS",
    description: "Streamline and coordinate all municipal revenue collections and activities in one unified secure portal.",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80",
  },
  {
    title: "Secure Digital Wallets",
    subtitle: "Instant Settlements",
    description: "Receive payments instantly, verify payers directly, and monitor your collections history with zero hassle.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=80",
  },
  {
    title: "Payment with Card",
    subtitle: "Seamless Card Terminals",
    description: "Accept and verify high-speed card payments from Visa, Mastercard, and Verve seamlessly on-the-go.",
    image: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=500&auto=format&fit=crop&q=80",
  },
  {
    title: "Agent Field Tools",
    subtitle: "Coordinate Effortlessly",
    description: "Utilize built-in QR code scanning and manual billing tools to maximize field revenue collection efficiency.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&auto=format&fit=crop&q=80",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const currentStepData = ONBOARDING_STEPS[step];

  const handleNext = () => {
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      router.push("/login");
    }
  };

  const handleSkip = () => {
    router.push("/login");
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Subtle top-right gradient background */}
      <LinearGradient
        colors={["rgba(14,163,96,0.18)", "rgba(14,163,96,0.0)"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bgGradient}
        pointerEvents="none"
      />

      {/* Top action row */}
      <View style={styles.topRow}>
        {step < ONBOARDING_STEPS.length - 1 ? (
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ height: 24 }} />
        )}
      </View>

      <View style={styles.container}>

        {/* Header with logo */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* High-quality Onboarding Graphic Centerpiece */}
        <View style={styles.graphicContainer}>
          <Image
            source={{ uri: currentStepData.image }}
            style={styles.graphicImage}
            resizeMode="cover"
          />
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>{currentStepData.title}</Text>
          <Text style={styles.welcomeSubtitle}>
            {currentStepData.subtitle}
          </Text>
          <Text style={styles.welcomeDescription}>
            {currentStepData.description}
          </Text>
        </View>

        {/* Step Indicators */}
        <View style={styles.indicatorContainer}>
          {ONBOARDING_STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === step ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            activeOpacity={0.85}
            onPress={handleNext}
          >
            <Text style={styles.primaryButtonText}>
              {step === ONBOARDING_STEPS.length - 1 ? "Sign in as an Agent" : "Continue"}
            </Text>
            {step < ONBOARDING_STEPS.length - 1 && (
              <ArrowRight size={18} color="#fff" style={styles.buttonIcon} />
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Tr3-G Innovation Limited
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  bgGradient: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 26,
    paddingTop: 10,
    height: 40,
    zIndex: 10,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
  },
  skipText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 30,
  },
  header: {
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#0ea360",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  graphicContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 14,
    flex: 1,
    paddingHorizontal: 16,
  },
  graphicImage: {
    width: "100%",
    height: "100%",
    maxHeight: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  welcomeSection: {
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    color: "#0f172a",
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "left",
  },
  welcomeSubtitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0ea360",
    textAlign: "left",
    marginBottom: 16,
    lineHeight: 32,
  },
  welcomeDescription: {
    fontSize: 15,
    color: "#475569",
    textAlign: "left",
    lineHeight: 22,
  },
  indicatorContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: "#0ea360",
  },
  dotInactive: {
    width: 8,
    backgroundColor: "#cbd5e1",
  },
  buttonContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0ea360",
  },
  primaryButton: {
    backgroundColor: "#0ea360",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  buttonIcon: {
    marginLeft: 8,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 10,
  },
  footerText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 12,
    opacity: 0.8,
  },
});
