import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatMoney } from '@/domain/wallets';
import { useMonthlyBudget } from '@/features/budgets/use-monthly-budget';
import { useTransactions } from '@/features/transactions/use-transactions';
import { useWallets } from '@/features/wallets/use-wallets';

const quickActions: { label: string; route?: Href }[] = [
  { label: 'เพิ่มรายรับ', route: { pathname: '/transactions/new', params: { kind: 'income' } } },
  { label: 'เพิ่มรายจ่าย', route: { pathname: '/transactions/new', params: { kind: 'expense' } } },
  { label: 'ดูรายการ', route: '/transactions' },
  { label: 'วางแผนงบ', route: '/planning' },
  { label: 'จัดการกระเป๋า', route: '/wallets' },
];

export default function HomeScreen() {
  const { wallets } = useWallets();
  const { budget } = useMonthlyBudget();
  const { transactions, totals } = useTransactions(5);
  const totalMinor = wallets.reduce((sum, wallet) => sum + wallet.balanceMinor, 0);
  const monthLabel = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' }).format(new Date());
  const overviewItems = [
    { label: 'รายรับเดือนนี้', value: formatMoney(totals.incomeMinor) },
    { label: 'รายจ่ายเดือนนี้', value: formatMoney(totals.expenseMinor) },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{monthLabel}</Text>
            <Text style={styles.title}>ภาพรวมการเงิน</Text>
          </View>
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>พร้อมใช้ Offline</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ยอดรวมทุกกระเป๋า</Text>
            <Text style={styles.summaryValue}>{formatMoney(totalMinor)}</Text>
          </View>
          {overviewItems.map((item) => (
            <View key={item.label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>งบเดือนนี้</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/planning')}>
            <Text style={styles.sectionLink}>{budget ? 'ดูแผน' : 'ตั้งงบ'}</Text>
          </Pressable>
        </View>
        {budget ? (
          <View style={[styles.budgetCard, budget.availableAfterReservationsMinor < 0 && styles.budgetOver]}>
            <Text style={styles.budgetLabel}>{budget.availableAfterReservationsMinor < 0 ? 'เกินงบหลังกัน Fixed Cost' : 'พร้อมใช้หลังกัน Fixed Cost'}</Text>
            <Text style={styles.budgetValue}>{formatMoney(budget.availableAfterReservationsMinor)}</Text>
            <Text style={styles.budgetMeta}>จ่ายจริง {formatMoney(budget.spentMinor)} · กัน Fixed Cost {formatMoney(budget.reservedFixedCostMinor)} · ยังไม่จัดสรร {formatMoney(budget.unallocatedMinor)}</Text>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => router.push('/planning/budget')} style={styles.emptyBudget}>
            <Text style={styles.emptyBudgetText}>ยังไม่ได้ตั้งงบเดือนนี้ · กดเพื่อเริ่มวางแผน</Text>
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>ทำรายการ</Text>
        <View style={styles.actionGrid}>
          {quickActions.map((action) => (
            <Pressable
              accessibilityRole="button"
              key={action.label}
              onPress={() => action.route && router.push(action.route)}
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
            >
              <Text style={styles.actionText}>{action.label}</Text>
              <Text style={styles.actionHint}>{action.route ? 'เปิด' : 'เร็ว ๆ นี้'}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>รายการล่าสุด</Text>
          <Pressable onPress={() => router.push('/transactions')}>
            <Text style={styles.sectionLink}>ดูทั้งหมด</Text>
          </Pressable>
        </View>
        {transactions.length === 0 ? <Text style={styles.emptyText}>ยังไม่มี Income หรือ Expense</Text> : null}
        {transactions.map((transaction) => {
          const isIncome = transaction.kind === 'income';
          return (
            <View key={transaction.id} style={styles.transactionRow}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>{transaction.note || (isIncome ? 'รายรับ' : 'รายจ่าย')}</Text>
                <Text style={styles.transactionWallet}>{transaction.walletName}</Text>
              </View>
              <Text style={[styles.transactionAmount, isIncome ? styles.incomeAmount : styles.expenseAmount]}>
                {isIncome ? '+' : '−'}{formatMoney(transaction.amount.amountMinor)}
              </Text>
            </View>
          );
        })}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>ข้อมูลอยู่ในเครื่อง</Text>
          <Text style={styles.noteText}>
            Wallet, Opening Balance, Income และ Expense ทำงานแบบ Offline โดยไม่ส่งข้อมูลการเงินขึ้น cloud
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  eyebrow: { color: '#66736A', fontSize: 14 },
  title: { color: '#17211B', fontSize: 30, fontWeight: '800' },
  offlineBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#DCEDDF' },
  offlineText: { color: '#176B48', fontSize: 12, fontWeight: '700' },
  summaryCard: { padding: 18, gap: 14, borderRadius: 20, backgroundColor: '#173F2B' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  summaryLabel: { color: '#C9D8CE', fontSize: 15 },
  summaryValue: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: '#17211B', fontSize: 19, fontWeight: '800' },
  sectionLink: { color: '#176B48', fontWeight: '700' },
  budgetCard: { padding: 16, borderRadius: 16, backgroundColor: '#DCEDDF' },
  budgetOver: { backgroundColor: '#FAE3E0' },
  budgetLabel: { color: '#526158', fontSize: 12 },
  budgetValue: { marginTop: 3, color: '#173F2B', fontSize: 23, fontWeight: '800' },
  budgetMeta: { marginTop: 5, color: '#526158', fontSize: 12 },
  emptyBudget: { padding: 15, borderWidth: 1, borderStyle: 'dashed', borderColor: '#176B48', borderRadius: 14 },
  emptyBudgetText: { color: '#176B48', textAlign: 'center', fontWeight: '700' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionButton: { width: '48%', minWidth: 150, flexGrow: 1, padding: 16, borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 16, backgroundColor: '#FFFEF9' },
  actionPressed: { opacity: 0.7 },
  actionText: { color: '#17211B', fontSize: 16, fontWeight: '700' },
  actionHint: { marginTop: 5, color: '#7A857D', fontSize: 12 },
  transactionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 14, borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 14, backgroundColor: '#FFFEF9' },
  transactionInfo: { flex: 1 },
  transactionTitle: { color: '#17211B', fontWeight: '700' },
  transactionWallet: { marginTop: 3, color: '#66736A', fontSize: 12 },
  transactionAmount: { fontWeight: '800' },
  incomeAmount: { color: '#176B48' },
  expenseAmount: { color: '#A93D38' },
  emptyText: { padding: 16, color: '#66736A', textAlign: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#B8C1B9', borderRadius: 14 },
  noteCard: { padding: 16, borderLeftWidth: 4, borderLeftColor: '#B86B25', borderRadius: 12, backgroundColor: '#FFF0DC' },
  noteTitle: { color: '#6E3C13', fontWeight: '800' },
  noteText: { marginTop: 5, color: '#704C2D', lineHeight: 21 },
});
