import { User, Search, MapPin, Mail, ChevronRight, UserPlus, Building2, ShieldCheck, X } from "lucide-react-native";
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
import { getMembers } from "@/lib/services/member";
import { useToast } from "@/hooks/use-toast";

export default function MembersScreen() {
  const router = useRouter();
  const { token, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const { failed } = useToast();

  const fetchMembers = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const res = await getMembers(1, 100, currentUser?.uid || "", token as string);
      setData(res.data || []);
    } catch (e: any) {
      failed(e.message || "Failed to load members list");
      setData([]);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [currentUser?.uid, failed, token]);

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
        m.uid?.toLowerCase().includes(search.toLowerCase()) ||
        m.businessName?.toLowerCase().includes(search.toLowerCase())
    )
    : data;

  const formatLocation = (loc: any) => {
    if (!loc) return "Location Not Specified";
    if (typeof loc === "string") return loc;
    const parts = [loc.address, loc.city, loc.state].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Location Not Specified";
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <View style={styles.badgeWrap}>
            <ShieldCheck size={12} color="#065f46" />
            <Text style={styles.badgeText}>TAXPAYER REGISTRY</Text>
          </View>
          <Text style={styles.pageTitle}>Entities & Taxpayers</Text>
          <Text style={styles.pageSubtitle}>
            {data.length} assigned taxpayer{data.length !== 1 ? "s" : ""} under your jurisdiction
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/pages/member/add" as RelativePathString)}
          activeOpacity={0.85}
        >
          <UserPlus size={15} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Entity</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, business, or AMAC UID..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={10}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#065f46" />
          <Text style={styles.loadingText}>Loading assigned entities...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.uid || item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#065f46"
              colors={["#065f46"]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.memberCard}
              onPress={() => router.push(`/pages/member/${item.uid || item.id}` as RelativePathString)}
              activeOpacity={0.7}
            >
              <View style={styles.memberCardTop}>
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarInitial}>
                    {(item.fullname || "M").charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {item.fullname || "Unnamed Member"}
                  </Text>
                  {item.businessName ? (
                    <Text style={styles.memberBusiness} numberOfLines={1}>
                      {item.businessName}
                    </Text>
                  ) : null}
                  <Text style={styles.memberUid}>ID: {item.uid || "-"}</Text>
                </View>

                <View style={styles.chevronWrap}>
                  <ChevronRight size={18} color="#94a3b8" />
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.metaContainer}>
                {item.email ? (
                  <View style={styles.metaRow}>
                    <Mail size={13} color="#64748b" />
                    <Text style={styles.metaText} numberOfLines={1}>{item.email}</Text>
                  </View>
                ) : null}

                <View style={styles.metaRow}>
                  <MapPin size={13} color="#64748b" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {formatLocation(item.location)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <User size={32} color="#065f46" />
              </View>
              <Text style={styles.emptyStateTitle}>No Entities Found</Text>
              <Text style={styles.emptyStateSubtext}>
                {search.trim()
                  ? "No registered entities matched your search query. Try another keyword."
                  : "You do not have any registered taxpayers or premises yet."}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                activeOpacity={0.85}
                onPress={() => router.push("/pages/member/add" as RelativePathString)}
              >
                <UserPlus size={15} color="#FFFFFF" />
                <Text style={styles.emptyActionBtnText}>Register New Entity</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#065f46",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#065f46",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
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
    fontSize: 14,
    color: "#0f172a",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  memberCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  memberCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e6f9f0",
    borderWidth: 1,
    borderColor: "#d4f5e6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarInitial: {
    color: "#065f46",
    fontWeight: "800",
    fontSize: 18,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  memberBusiness: {
    fontSize: 12,
    color: "#065f46",
    fontWeight: "700",
    marginBottom: 2,
  },
  memberUid: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#94a3b8",
  },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 10,
  },
  metaContainer: {
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#065f46",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
});
