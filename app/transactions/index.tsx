import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatMoney } from '@/domain/wallets';
import { useTransactions } from '@/features/transactions/use-transactions';

export default function TransactionListScreen() {
  const [uncategorizedOnly, setUncategorizedOnly] = useState(false);
  const { transactions, totals, loading, error } = useTransactions(20, uncategorizedOnly);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <Text style={styles.summaryLabel}>รายรับเดือนนี้</Text>
            <Text style={styles.summaryValue}>{formatMoney(totals.incomeMinor)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Text style={styles.summaryLabel}>รายจ่ายเดือนนี้</Text>
            <Text style={styles.summaryValue}>{formatMoney(totals.expenseMinor)}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/transactions/new', params: { kind: 'income' } })} style={[styles.actionButton, styles.incomeButton]}>
            <Text style={styles.incomeButtonText}>+ รายรับ</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/transactions/new', params: { kind: 'expense' } })} style={[styles.actionButton, styles.expenseButton]}>
            <Text style={styles.expenseButtonText}>− รายจ่าย</Text>
          </Pressable>
        </View>

        <View style={styles.listToolbar}>
          <View style={styles.filterRow}>
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: !uncategorizedOnly }} onPress={() => setUncategorizedOnly(false)} style={[styles.filterButton, !uncategorizedOnly && styles.filterActive]}>
              <Text style={[styles.filterText, !uncategorizedOnly && styles.filterTextActive]}>ทั้งหมด</Text>
            </Pressable>
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: uncategorizedOnly }} onPress={() => setUncategorizedOnly(true)} style={[styles.filterButton, uncategorizedOnly && styles.filterActive]}>
              <Text style={[styles.filterText, uncategorizedOnly && styles.filterTextActive]}>ยังไม่ระบุหมวด</Text>
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/categories')}>
            <Text style={styles.categoryLink}>จัดการหมวด</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator color="#176B48" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>ยังไม่มี Income หรือ Expense</Text>
            <Text style={styles.emptyText}>Opening Balance จะไม่แสดงและไม่ถูกนับเป็นรายรับ</Text>
          </View>
        ) : null}

        {transactions.map((transaction) => {
          const isIncome = transaction.kind === 'income';
          return (
            <Pressable
              accessibilityRole="button"
              key={transaction.id}
              onPress={() => transaction.kind === 'expense' && router.push({ pathname: '/transactions/[id]', params: { id: transaction.id } })}
              style={({ pressed }) => [styles.transactionCard, pressed && transaction.kind === 'expense' && styles.pressed]}
            >
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{transaction.note || (isIncome ? 'รายรับ' : 'รายจ่าย')}</Text>
                <Text style={styles.transactionMeta}>
                  {transaction.walletName} · {new Date(transaction.occurredAt).toLocaleDateString('th-TH')}
                </Text>
                {!isIncome ? <Text style={[styles.categoryBadge, transaction.categoryId === null && styles.uncategorized]}>{transaction.categoryName ?? 'ยังไม่ระบุหมวด'}</Text> : null}
              </View>
              <Text style={[styles.amount, isIncome ? styles.incomeAmount : styles.expenseAmount]}>
                {isIncome ? '+' : '−'}{formatMoney(transaction.amount.amountMinor)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, gap: 12 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, minWidth: 0, padding: 15, borderRadius: 16 },
  incomeCard: { backgroundColor: '#DCEDDF' },
  expenseCard: { backgroundColor: '#FAE3E0' },
  summaryLabel: { color: '#526158', fontSize: 12 },
  summaryValue: { marginTop: 4, color: '#17211B', fontSize: 18, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  incomeButton: { backgroundColor: '#176B48' },
  expenseButton: { backgroundColor: '#B34B43' },
  incomeButtonText: { color: '#FFFFFF', fontWeight: '800' },
  expenseButtonText: { color: '#FFFFFF', fontWeight: '800' },
  listToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  filterButton: { paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 999, backgroundColor: '#FFFEF9' },
  filterActive: { borderColor: '#176B48', backgroundColor: '#DCEDDF' },
  filterText: { color: '#66736A', fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#176B48' },
  categoryLink: { color: '#176B48', fontSize: 12, fontWeight: '700' },
  transactionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 15, borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 15, backgroundColor: '#FFFEF9' },
  transactionDetails: { flex: 1 },
  transactionTitle: { color: '#17211B', fontSize: 16, fontWeight: '700' },
  transactionMeta: { marginTop: 3, color: '#66736A', fontSize: 12 },
  categoryBadge: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, color: '#176B48', backgroundColor: '#DCEDDF', fontSize: 11, fontWeight: '700' },
  uncategorized: { color: '#8A4C17', backgroundColor: '#FFF0DC' },
  amount: { fontSize: 16, fontWeight: '800' },
  incomeAmount: { color: '#176B48' },
  expenseAmount: { color: '#A93D38' },
  emptyCard: { padding: 22, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#B8C1B9', borderRadius: 16 },
  emptyTitle: { color: '#17211B', fontWeight: '700' },
  emptyText: { marginTop: 4, color: '#66736A', textAlign: 'center' },
  error: { color: '#A93D38' },
  pressed: { opacity: 0.7 },
});
