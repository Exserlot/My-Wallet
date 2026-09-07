import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildDashboardAttentionItems, type DashboardAttentionItem } from '@/domain/attention-items';
import { formatMoney } from '@/domain/wallets';
import { useMonthlyBudget } from '@/features/budgets/use-monthly-budget';
import { useFixedCosts } from '@/features/fixed-costs/use-fixed-costs';
import { useFinancialPrivacy } from '@/features/preferences/use-financial-privacy';
import { useTransactions } from '@/features/transactions/use-transactions';
import { useWallets } from '@/features/wallets/use-wallets';

const quickActions: { label: string; route?: Href }[] = [
  { label: 'เพิ่มรายรับ', route: { pathname: '/transactions/new', params: { kind: 'income' } } },
  { label: 'เพิ่มรายจ่าย', route: { pathname: '/transactions/new', params: { kind: 'expense' } } },
  { label: 'ดูรายการ', route: '/transactions' },
  { label: 'วางแผนงบ', route: '/planning' },
  { label: 'ดูรายงาน', route: '/reports' as Href },
  { label: 'จัดการกระเป๋า', route: '/wallets' },
];

export default function HomeScreen() {
  const { wallets } = useWallets();
  const { budget } = useMonthlyBudget();
  const { occurrences } = useFixedCosts();
  const { hideFinancialValues, setHideFinancialValues } = useFinancialPrivacy();
  const { transactions, totals } = useTransactions(5);
  const totalMinor = wallets.reduce((sum, wallet) => sum + wallet.balanceMinor, 0);
  const monthLabel = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' }).format(new Date());
  const overviewItems = [
    { label: 'รายรับเดือนนี้', value: formatMoney(totals.incomeMinor) },
    { label: 'รายจ่ายเดือนนี้', value: formatMoney(totals.expenseMinor) },
  ];
  const attentionItems = buildDashboardAttentionItems({ budget, occurrences });
  const privateMoney = (amountMinor: number) => hideFinancialValues ? '••••••' : formatMoney(amountMinor);

  function openAttentionItem(item: DashboardAttentionItem) {
    if (item.kind === 'fixed-cost') {
      router.push({ pathname: '/planning/fixed-costs/[id]', params: { id: item.occurrence.id } });
      return;
    }
    router.push('/planning/budget');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{monthLabel}</Text>
            <Text style={styles.title}>ภาพรวมการเงิน</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable accessibilityRole="switch" accessibilityState={{ checked: hideFinancialValues }} onPress={() => void setHideFinancialValues(!hideFinancialValues)} style={styles.privacyButton}>
              <Text style={styles.privacyText}>{hideFinancialValues ? 'แสดงตัวเลข' : 'ซ่อนตัวเลข'}</Text>
            </Pressable>
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>พร้อมใช้ Offline</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ยอดรวมทุกกระเป๋า</Text>
            <Text style={styles.summaryValue}>{privateMoney(totalMinor)}</Text>
          </View>
          {overviewItems.map((item) => (
            <View key={item.label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryValue}>{hideFinancialValues ? '••••••' : item.value}</Text>
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
            <Text style={styles.budgetValue}>{privateMoney(budget.availableAfterReservationsMinor)}</Text>
            <Text style={styles.budgetMeta}>{hideFinancialValues ? 'ซ่อนรายละเอียดการเงินอยู่' : `จ่ายจริง ${formatMoney(budget.spentMinor)} · กัน Fixed Cost ${formatMoney(budget.reservedFixedCostMinor)} · ยังไม่จัดสรร ${formatMoney(budget.unallocatedMinor)}`}</Text>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => router.push('/planning/budget')} style={styles.emptyBudget}>
            <Text style={styles.emptyBudgetText}>ยังไม่ได้ตั้งงบเดือนนี้ · กดเพื่อเริ่มวางแผน</Text>
          </Pressable>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>เรื่องที่ต้องจัดการวันนี้</Text>
          {attentionItems.length > 0 ? <Text style={styles.attentionCount}>{attentionItems.length} เรื่อง</Text> : null}
        </View>
        {attentionItems.length === 0 ? (
          <View style={styles.clearCard}>
            <Text style={styles.clearTitle}>ยังไม่มีเรื่องเร่งด่วน</Text>
            <Text style={styles.clearText}>ระบบจะบอกเมื่อ Fixed Cost ใกล้ถึงกำหนด หรืองบใช้ถึง 80%</Text>
          </View>
        ) : attentionItems.map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item.id}
            onPress={() => openAttentionItem(item)}
            style={({ pressed }) => [styles.attentionCard, item.level === 'urgent' && styles.attentionUrgent, pressed && styles.actionPressed]}
          >
            <View style={styles.attentionBody}>
              <Text style={[styles.attentionLabel, item.level === 'urgent' && styles.attentionLabelUrgent]}>
                {item.level === 'urgent' ? 'ต้องจัดการ' : 'ใกล้ถึงเกณฑ์'}
              </Text>
              {item.kind === 'fixed-cost' ? (
                <>
                  <Text style={styles.attentionTitle}>{item.occurrence.scheduleName}</Text>
                  <Text style={styles.attentionDetail}>
                    {item.daysUntilDue < 0
                      ? `เกินกำหนด ${Math.abs(item.daysUntilDue)} วัน`
                      : item.daysUntilDue === 0
                        ? 'ครบกำหนดวันนี้'
                        : `ครบกำหนดใน ${item.daysUntilDue} วัน`} · {privateMoney(item.occurrence.estimatedMinor)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.attentionTitle}>{item.kind === 'monthly-budget' ? 'งบรวมเดือนนี้' : `งบ${item.categoryName}`}</Text>
                  <Text style={styles.attentionDetail}>{hideFinancialValues ? 'ซ่อนรายละเอียดการใช้งบอยู่' : `ใช้แล้ว ${item.usagePercent}% · ${formatMoney(item.spentMinor)} จาก ${formatMoney(item.limitMinor)}`}</Text>
                </>
              )}
            </View>
            <Text style={styles.attentionOpen}>เปิด ›</Text>
          </Pressable>
        ))}

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
                {hideFinancialValues ? '••••••' : `${isIncome ? '+' : '−'}${formatMoney(transaction.amount.amountMinor)}`}
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
  headerActions: { alignItems: 'flex-end', gap: 7 },
  eyebrow: { color: '#66736A', fontSize: 14 },
  title: { color: '#17211B', fontSize: 30, fontWeight: '800' },
  offlineBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#DCEDDF' },
  offlineText: { color: '#176B48', fontSize: 12, fontWeight: '700' },
  privacyButton: { paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: '#B8C1B9', borderRadius: 999, backgroundColor: '#FFFEF9' },
  privacyText: { color: '#526158', fontSize: 12, fontWeight: '700' },
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
  attentionCount: { color: '#8A4C17', fontSize: 12, fontWeight: '800' },
  clearCard: { padding: 15, borderWidth: 1, borderColor: '#CFE0D3', borderRadius: 14, backgroundColor: '#F6FBF7' },
  clearTitle: { color: '#176B48', fontWeight: '800' },
  clearText: { marginTop: 4, color: '#66736A', fontSize: 12, lineHeight: 18 },
  attentionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderWidth: 1, borderColor: '#E1BE89', borderRadius: 15, backgroundColor: '#FFF8E9' },
  attentionUrgent: { borderColor: '#D88B84', backgroundColor: '#FFF1EF' },
  attentionBody: { flex: 1 },
  attentionLabel: { color: '#8A4C17', fontSize: 11, fontWeight: '800' },
  attentionLabelUrgent: { color: '#A93D38' },
  attentionTitle: { marginTop: 3, color: '#17211B', fontSize: 16, fontWeight: '800' },
  attentionDetail: { marginTop: 3, color: '#66736A', fontSize: 12, lineHeight: 18 },
  attentionOpen: { color: '#176B48', fontSize: 13, fontWeight: '800' },
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
