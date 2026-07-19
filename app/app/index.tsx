import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Wallet, ShieldCheck, Users, ArrowRight } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_STEPS = [
  {
    title: "Amac Unified Revenue",
    subtitle: "Welcome to AURMS",
    description: "Easily track, calculate, and manage all your municipal revenue tasks in one unified, secure hub.",
    icon: "Wallet",
  },
  {
    title: "Automated Payments",
    subtitle: "Fast & Secured Billing",
    description: "Generate digital receipts instantly, make direct payments securely, and monitor transaction statuses.",
    icon: "ShieldCheck",
  },
  {
    title: "Agent & Wallet Support",
    subtitle: "Manage on the Go",
    description: "Access agent assistance, fund your wallet, and execute secure transfers with zero hassle.",
    icon: "Users",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();
  const [step, setStep] = useState(0);

  // Redirect to lock screen or pages if user data exists in AsyncStorage
  useEffect(() => {
    const checkRedirect = async () => {
      if (!loading && currentUser) {
        try {
          const pin = await AsyncStorage.getItem("amac_member_pin");
          if (pin) {
            router.replace("/lock");
          } else {
            router.replace("/(pages)");
          }
        } catch {
          router.replace("/lock");
        }
      }
    };
    checkRedirect();
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea360" />
      </View>
    );
  }

  if (currentUser) {
    return null;
  }

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

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Wallet":
        return <Wallet size={56} color="#0ea360" />;
      case "ShieldCheck":
        return <ShieldCheck size={56} color="#0ea360" />;
      case "Users":
        return <Users size={56} color="#0ea360" />;
      default:
        return <Wallet size={56} color="#0ea360" />;
    }
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

        {/* Dynamic Graphic Centerpiece */}
        <View style={styles.graphicContainer}>
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              {renderIcon(currentStepData.icon)}
            </View>
          </View>
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
              {step === ONBOARDING_STEPS.length - 1 ? "Get Started" : "Continue"}
            </Text>
            {step < ONBOARDING_STEPS.length - 1 && (
              <ArrowRight size={18} color="#fff" style={styles.buttonIcon} />
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} TR3-G Innovation Limited
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#0ea360",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  logo: {
    width: 74,
    height: 74,
    borderRadius: 8,
  },
  graphicContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    flex: 1,
  },
  outerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(14, 163, 96, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e6f9f0",
    borderWidth: 1,
    borderColor: "#d4f5e6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0ea360",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeSection: {
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 26,
    color: "#0f172a",
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "left",
  },
  welcomeSubtitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0ea360",
    textAlign: "left",
    marginBottom: 16,
    lineHeight: 34,
  },
  welcomeDescription: {
    fontSize: 16,
    color: "#475569",
    textAlign: "left",
    lineHeight: 24,
  },
  indicatorContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 30,
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
    marginBottom: 30,
    paddingHorizontal: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
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

