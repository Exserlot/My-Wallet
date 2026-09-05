import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatMoney } from '@/domain/wallets';
import { useTransactions } from '@/features/transactions/use-transactions';

export default function TransactionListScreen() {
  const { transactions, totals, loading, error } = useTransactions();

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
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{transaction.note || (isIncome ? 'รายรับ' : 'รายจ่าย')}</Text>
                <Text style={styles.transactionMeta}>
                  {transaction.walletName} · {new Date(transaction.occurredAt).toLocaleDateString('th-TH')}
                </Text>
                {!isIncome && transaction.categoryId === null ? <Text style={styles.uncategorized}>ยังไม่ระบุหมวด</Text> : null}
              </View>
              <Text style={[styles.amount, isIncome ? styles.incomeAmount : styles.expenseAmount]}>
                {isIncome ? '+' : '−'}{formatMoney(transaction.amount.amountMinor)}
              </Text>
            </View>
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
  transactionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 15, borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 15, backgroundColor: '#FFFEF9' },
  transactionDetails: { flex: 1 },
  transactionTitle: { color: '#17211B', fontSize: 16, fontWeight: '700' },
  transactionMeta: { marginTop: 3, color: '#66736A', fontSize: 12 },
  uncategorized: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, color: '#8A4C17', backgroundColor: '#FFF0DC', fontSize: 11, fontWeight: '700' },
  amount: { fontSize: 16, fontWeight: '800' },
  incomeAmount: { color: '#176B48' },
  expenseAmount: { color: '#A93D38' },
  emptyCard: { padding: 22, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#B8C1B9', borderRadius: 16 },
  emptyTitle: { color: '#17211B', fontWeight: '700' },
  emptyText: { marginTop: 4, color: '#66736A', textAlign: 'center' },
  error: { color: '#A93D38' },
});
