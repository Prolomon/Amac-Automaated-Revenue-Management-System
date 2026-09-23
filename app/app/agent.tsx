import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getAgent } from "@/lib/services/agent";
import { Agent } from "@/lib/types";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserCheck,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AgentScreen() {
  const { currentUser, token } = useAuth();
  const { failed } = useToast();
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser?.agent) {
      fetchAgent(currentUser.agent);
    }
  }, [currentUser?.agent]);

  const fetchAgent = async (id: string) => {
    try {
      setLoading(true);
      const data = await getAgent(id, token as string);
      const a = data?.data || data?.agent || data;
      setAgent(currentUser?.agentData || a || null);
    } catch (e: any) {
      failed(e?.message || "Failed to load agent");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!currentUser?.agent) return;
    await fetchAgent(currentUser.agent);
  };

  const handleCall = () => {
    if (agent?.phone) {
      Linking.openURL(`tel:${agent.phone}`);
    }
  };

  const handleEmail = () => {
    if (agent?.email) {
      Linking.openURL(`mailto:${agent.email}`);
    }
  };

  const agentName = agent?.fullname || agent?.name || "Zonal Revenue Officer";
  const initials = agentName
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor="#0ea360"
            colors={["#0ea360"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft color="#0f172a" size={20} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Assigned Revenue Officer</Text>
            <Text style={styles.headerSub}>Official AMAC Area Representative</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#0ea360" />
            <Text style={styles.loadingText}>Fetching officer details...</Text>
          </View>
        ) : agent ? (
          <View style={styles.card}>
            {/* Top Profile Card */}
            <View style={styles.profileRow}>
              {agent.avatar ? (
                <Image source={{ uri: agent.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}

              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={styles.verifiedRow}>
                  <Text style={styles.agentName}>{agentName}</Text>
                  <CheckCircle2 size={16} color="#0ea360" />
                </View>
                <Text style={styles.agentSub}>{agent.company || "AMAC Revenue Directorate"}</Text>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusPillText}>
                    {agent.status ? "Authorized AMAC Agent" : "Inactive Agent"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Action Contact Buttons */}
            <View style={styles.contactActionsRow}>
              {agent.phone ? (
                <TouchableOpacity
                  style={styles.contactBtnPrimary}
                  activeOpacity={0.85}
                  onPress={handleCall}
                >
                  <Phone size={15} color="#ffffff" />
                  <Text style={styles.contactBtnPrimaryText}>Call Officer</Text>
                </TouchableOpacity>
              ) : null}

              {agent.email ? (
                <TouchableOpacity
                  style={styles.contactBtnSecondary}
                  activeOpacity={0.85}
                  onPress={handleEmail}
                >
                  <Mail size={15} color="#064e3b" />
                  <Text style={styles.contactBtnSecondaryText}>Send Email</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Detail Rows */}
            <View style={styles.detailsGroup}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Mail size={16} color="#0ea360" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Official Email</Text>
                  <Text style={styles.detailValue}>{agent.email || "N/A"}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Phone size={16} color="#0ea360" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Direct Telephone</Text>
                  <Text style={styles.detailValue}>{agent.phone || "N/A"}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <MapPin size={16} color="#0ea360" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Revenue Center / Office</Text>
                  <Text style={styles.detailValue}>{agent.center || "Main Directorate"}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <ShieldCheck size={16} color="#0ea360" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Cadastral Zone</Text>
                  <Text style={styles.detailValue}>{agent.zone || "AMAC Central"}</Text>
                </View>
              </View>

              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <View style={styles.detailIconWrap}>
                  <Calendar size={16} color="#0ea360" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Accreditation Date</Text>
                  <Text style={styles.detailValue}>
                    {agent.createdAt
                      ? new Date(agent.createdAt as any).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Verified"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <UserCheck size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Agent Assigned</Text>
            <Text style={styles.emptyDesc}>
              A revenue officer will be assigned to your account based on your premises zone.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  headerSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748b",
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#a7f3d0",
  },
  avatarInitials: {
    color: "#065f46",
    fontWeight: "800",
    fontSize: 20,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  agentName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  agentSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 6,
    gap: 5,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0ea360",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065f46",
  },
  contactActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  contactBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0ea360",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  contactBtnPrimaryText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  contactBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ecfdf5",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  contactBtnSecondaryText: {
    color: "#064e3b",
    fontSize: 13,
    fontWeight: "700",
  },
  detailsGroup: {
    marginTop: 18,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
    gap: 12,
  },
  detailIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 2,
  },
  emptyCard: {
    marginHorizontal: 20,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});
