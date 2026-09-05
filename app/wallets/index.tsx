import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatMoney, type WalletType } from '@/domain/wallets';
import { useWallets } from '@/features/wallets/use-wallets';

const typeLabels: Record<WalletType, string> = {
  cash: 'เงินสด',
  'bank-account': 'บัญชีธนาคาร',
  'e-wallet': 'e-Wallet',
};

export default function WalletListScreen() {
  const { wallets, loading, error } = useWallets();
  const totalMinor = wallets.reduce((sum, wallet) => sum + wallet.balanceMinor, 0);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>ยอดรวมทุกกระเป๋า</Text>
          <Text style={styles.totalValue}>{formatMoney(totalMinor)}</Text>
        </View>

        {loading ? <ActivityIndicator color="#176B48" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && wallets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>ยังไม่มีกระเป๋า</Text>
            <Text style={styles.emptyText}>เริ่มจากเพิ่มเงินสดหรือบัญชีธนาคารหนึ่งรายการ</Text>
          </View>
        ) : null}

        {wallets.map((wallet) => (
          <View key={wallet.id} style={styles.walletCard}>
            <View>
              <Text style={styles.walletName}>{wallet.name}</Text>
              <Text style={styles.walletType}>{typeLabels[wallet.type]}</Text>
            </View>
            <Text style={styles.walletBalance}>{formatMoney(wallet.balanceMinor)}</Text>
          </View>
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/wallets/new')}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryText}>+ เพิ่มกระเป๋า</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, gap: 12 },
  totalCard: { padding: 20, borderRadius: 20, backgroundColor: '#173F2B' },
  totalLabel: { color: '#C9D8CE', fontSize: 14 },
  totalValue: { marginTop: 5, color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  walletCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 16, borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 16, backgroundColor: '#FFFEF9' },
  walletName: { color: '#17211B', fontSize: 17, fontWeight: '700' },
  walletType: { marginTop: 3, color: '#66736A', fontSize: 13 },
  walletBalance: { color: '#173F2B', fontSize: 17, fontWeight: '800' },
  emptyCard: { padding: 22, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#B8C1B9', borderRadius: 16 },
  emptyTitle: { color: '#17211B', fontSize: 17, fontWeight: '700' },
  emptyText: { marginTop: 4, color: '#66736A', textAlign: 'center' },
  primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#176B48' },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  error: { color: '#A93D38' },
  pressed: { opacity: 0.75 },
});

