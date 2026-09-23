import { useAuth } from "@/hooks/use-auth";
import { getRelativeTime } from "@/utils/date";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock,
  Info,
  ShieldAlert,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Notification = {
  id?: string;
  title: string;
  description: string;
  date: string;
  type:
    | "UPDATE"
    | "SUCCESS"
    | "FAILED"
    | "PENDING"
    | "REQUEST"
    | "REMINDER"
    | "WELCOME";
};

export default function Notifications() {
  const router = useRouter();
  const { notifications: fetchNotifications } = useAuth();
  const [notes, setNotes] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchNotifications();
      setNotes(data || []);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return {
          icon: <CheckCircle2 size={18} color="#059669" />,
          bg: "#ecfdf5",
          border: "#a7f3d0",
        };
      case "FAILED":
        return {
          icon: <ShieldAlert size={18} color="#dc2626" />,
          bg: "#fef2f2",
          border: "#fecaca",
        };
      case "PENDING":
        return {
          icon: <Clock size={18} color="#d97706" />,
          bg: "#fffbeb",
          border: "#fde68a",
        };
      case "REMINDER":
        return {
          icon: <AlertTriangle size={18} color="#2563eb" />,
          bg: "#eff6ff",
          border: "#bfdbfe",
        };
      default:
        return {
          icon: <Info size={18} color="#0ea360" />,
          bg: "#ecfdf5",
          border: "#a7f3d0",
        };
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
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
            <Text style={styles.headerTitle}>Council Broadcasts</Text>
            <Text style={styles.headerSub}>Tax notices, assessment updates & alerts</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#0ea360" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notes.length === 0 ? (
          <View style={styles.emptyBox}>
            <Bell size={44} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySub}>
              You are all caught up. Council announcements and assessment alerts will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {notes.map((n, idx) => {
              const meta = getNotificationIcon(n.type);
              return (
                <View key={n.id || idx} style={styles.noteCard}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: meta.bg, borderColor: meta.border },
                    ]}
                  >
                    {meta.icon}
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.noteTitle} numberOfLines={1}>
                        {n.title}
                      </Text>
                      <Text style={styles.noteTime}>{getRelativeTime(n.date)}</Text>
                    </View>
                    <Text style={styles.noteBody}>{n.description}</Text>
                  </View>
                </View>
              );
            })}
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
  container: {
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
  emptyBox: {
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
  emptySub: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  listWrap: {
    paddingHorizontal: 20,
    gap: 12,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    flex: 1,
    paddingRight: 8,
  },
  noteTime: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "500",
  },
  noteBody: {
    fontSize: 13,
    color: "#475569",
    marginTop: 4,
    lineHeight: 18,
  },
});
