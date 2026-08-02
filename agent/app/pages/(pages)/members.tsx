import { User, Search, MapPin, Mail, Phone, ChevronRight } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../hooks/use-auth";
import { useRouter, RelativePathString } from "expo-router";

export default function MembersScreen() {
  const router = useRouter();
  const { members } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const fetchMembers = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const res = await members();
      setData(res || []);
    } catch (e) {
      setData([]);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [members]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMembers({ silent: true });
    setRefreshing(false);
  };

  const filtered = search.trim()
    ? data.filter(
      (m) =>
        m.fullname?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase()) ||
        m.uid?.toLowerCase().includes(search.toLowerCase())
    )
    : data;

  const formatLocation = (loc: any) => {
    if (!loc) return "N/A";
    if (typeof loc === "string") return loc;
    const parts = [loc.address, loc.city, loc.state].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerCard}>
        <Text style={styles.pageTitle}>Registered Members</Text>
        <Text style={styles.pageSubtitle}>
          Manage and review {data.length} registered member{data.length !== 1 ? "s" : ""} under your coverage.
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email or ID..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0ea360" />
          <Text style={styles.loadingText}>Loading members list...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.uid || item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#0ea360"]} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.memberItem}
              onPress={() => router.push(`/pages/member/${item.uid || item.id}` as RelativePathString)}
              activeOpacity={0.7}
            >
              <View style={styles.memberItemContent}>
                <View style={styles.memberAvatarWrap}>
                  <Text style={styles.avatarInitial}>
                    {(item.fullname || "M").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {item.fullname || "Unnamed Member"}
                  </Text>
                  {item.businessName && (
                    <Text style={styles.memberBusiness}>{item.businessName}</Text>
                  )}
                  <View style={styles.metaRow}>
                    <Mail size={12} color="#94a3b8" />
                    <Text style={styles.metaText} numberOfLines={1}>{item.email}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <MapPin size={12} color="#94a3b8" />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {formatLocation(item.location)}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <User size={48} color="#cbd5e1" />
              <Text style={styles.emptyStateText}>No members found</Text>
              <Text style={styles.emptyStateSubtext}>
                No registered members matched your criteria. Pull down to refresh.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "ghostwhite" },
  headerCard: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "ghostwhite",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#0f172a",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  memberItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
    padding: 14,
  },
  memberItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#d4f5e6",
  },
  avatarInitial: {
    color: "#0ea360",
    fontWeight: "bold",
    fontSize: 18,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  memberBusiness: {
    fontSize: 13,
    color: "#0ea360",
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: "#64748b",
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748b",
  },
  emptyState: {
    paddingVertical: 64,
    alignItems: "center",
    gap: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 18,
  },
});
