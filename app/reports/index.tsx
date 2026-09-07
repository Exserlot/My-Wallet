import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildCashFlowSeries, buildExpenseCategoryReport, customReportRange, type ReportPeriod, type ReportRange } from '@/domain/reports';
import { formatMoney } from '@/domain/wallets';
import { useMonthlyBudget } from '@/features/budgets/use-monthly-budget';
import { useReportData } from '@/features/reports/use-report-data';

const periodOptions: readonly Readonly<{ id: ReportPeriod; label: string }>[] = [
  { id: 'current-month', label: 'เดือนนี้' },
  { id: 'previous-month', label: 'เดือนก่อน' },
  { id: 'three-months', label: '3 เดือน' },
];

function dateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function Bar({ amountMinor, maximumMinor, tone }: Readonly<{ amountMinor: number; maximumMinor: number; tone: 'income' | 'expense' | 'budget' }>) {
  const width = maximumMinor > 0 ? Math.max(2, Math.round(amountMinor / maximumMinor * 100)) : 0;
  return <View style={styles.barTrack}><View style={[styles.barFill, styles[`${tone}Bar`], { width: `${width}%` }]} /></View>;
}

export default function ReportsScreen() {
  const [period, setPeriod] = useState<ReportPeriod>('current-month');
  const [customMode, setCustomMode] = useState(false);
  const [customStart, setCustomStart] = useState(() => dateInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [customEnd, setCustomEnd] = useState(() => dateInput(new Date()));
  const [customRange, setCustomRange] = useState<ReportRange | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const { transactions, range, loading, error } = useReportData(period, customMode ? customRange : null);
  const { budget } = useMonthlyBudget();
  const allCategories = useMemo(() => buildExpenseCategoryReport(transactions, Number.MAX_SAFE_INTEGER), [transactions]);
  const categories = useMemo(() => showAllCategories ? allCategories : buildExpenseCategoryReport(transactions), [allCategories, showAllCategories, transactions]);
  const cashFlow = useMemo(() => buildCashFlowSeries(transactions, range), [range, transactions]);
  const incomeMinor = transactions.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount.amountMinor, 0);
  const expenseMinor = transactions.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amount.amountMinor, 0);
  const categoryMaximum = Math.max(0, ...categories.map((item) => item.amountMinor));
  const cashFlowMaximum = Math.max(0, ...cashFlow.flatMap((item) => [item.incomeMinor, item.expenseMinor]));

  function openTransactions(start: string, end: string, categoryIds?: readonly (string | null)[], categoryName?: string) {
    router.push({
      pathname: '/transactions',
      params: {
        start,
        end,
        categoryIds: categoryIds?.map((id) => id ?? '__uncategorized__').join(','),
        categoryName,
      },
    });
  }

  function applyCustomRange() {
    const nextRange = customReportRange(customStart, customEnd);
    if (!nextRange) {
      setCustomError('ตรวจสอบวันที่เริ่มและสิ้นสุด รูปแบบต้องเป็น YYYY-MM-DD');
      return;
    }
    setCustomError(null);
    setCustomRange(nextRange);
    setShowAllCategories(false);
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.periodPicker}>
          {periodOptions.map((option) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: period === option.id }}
              key={option.id}
              onPress={() => { setPeriod(option.id); setCustomMode(false); setShowAllCategories(false); }}
              style={[styles.periodButton, !customMode && period === option.id && styles.periodButtonActive]}
            >
              <Text style={[styles.periodText, !customMode && period === option.id && styles.periodTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable accessibilityRole="button" onPress={() => setCustomMode(true)} style={[styles.customToggle, customMode && styles.customToggleActive]}>
          <Text style={[styles.periodText, customMode && styles.periodTextActive]}>กำหนดช่วงเอง</Text>
        </Pressable>
        {customMode ? (
          <View style={styles.customCard}>
            <View style={styles.dateRow}>
              <View style={styles.dateField}><Text style={styles.dateLabel}>วันที่เริ่ม</Text><TextInput accessibilityLabel="วันที่เริ่มรายงาน" autoCapitalize="none" onChangeText={setCustomStart} placeholder="YYYY-MM-DD" style={styles.dateInput} value={customStart} /></View>
              <View style={styles.dateField}><Text style={styles.dateLabel}>วันที่สิ้นสุด</Text><TextInput accessibilityLabel="วันที่สิ้นสุดรายงาน" autoCapitalize="none" onChangeText={setCustomEnd} placeholder="YYYY-MM-DD" style={styles.dateInput} value={customEnd} /></View>
            </View>
            {customError ? <Text accessibilityRole="alert" style={styles.error}>{customError}</Text> : null}
            <Pressable accessibilityRole="button" onPress={applyCustomRange} style={styles.applyButton}><Text style={styles.applyText}>แสดงรายงานช่วงนี้</Text></Pressable>
          </View>
        ) : null}

        {loading ? <Text style={styles.muted}>กำลังคำนวณรายงาน…</Text> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}><Text style={styles.summaryLabel}>รายรับ</Text><Text style={styles.incomeText}>{formatMoney(incomeMinor)}</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}><Text style={styles.summaryLabel}>รายจ่าย</Text><Text style={styles.expenseText}>{formatMoney(expenseMinor)}</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}><Text style={styles.summaryLabel}>สุทธิ</Text><Text style={styles.summaryValue}>{formatMoney(incomeMinor - expenseMinor)}</Text></View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>รายจ่ายตามหมวด</Text>
          <Text style={styles.sectionHint}>เรียงจากหมวดที่ใช้มากที่สุด</Text>
        </View>
        {!loading && categories.length === 0 ? <Text style={styles.empty}>ยังไม่มีรายจ่ายในช่วงนี้</Text> : null}
        {categories.map((category, index) => (
          <Pressable accessibilityRole="button" key={category.id} onPress={() => openTransactions(range.start, range.end, category.categoryIds, category.name)} style={({ pressed }) => [styles.reportRow, pressed && styles.pressed]}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowTitle}>{index + 1}. {category.name}</Text>
              <Text style={styles.rowAmount}>{formatMoney(category.amountMinor)} · {category.percent}%</Text>
            </View>
            <Bar amountMinor={category.amountMinor} maximumMinor={categoryMaximum} tone="expense" />
            <Text style={styles.openHint}>กดเพื่อดูรายการ ›</Text>
          </Pressable>
        ))}
        {allCategories.length > 5 ? (
          <Pressable accessibilityRole="button" onPress={() => setShowAllCategories((value) => !value)} style={styles.showAllButton}>
            <Text style={styles.showAllText}>{showAllCategories ? 'แสดง 5 หมวดแรก' : `ดูทุกหมวด (${allCategories.length})`}</Text>
          </Pressable>
        ) : null}

        <View>
          <Text style={styles.sectionTitle}>รายรับเทียบรายจ่ายตามเวลา</Text>
          <Text style={styles.sectionHint}>สีเขียวคือรายรับ สีแดงคือรายจ่าย พร้อมตัวเลขกำกับ</Text>
        </View>
        {cashFlow.filter((item) => item.incomeMinor > 0 || item.expenseMinor > 0).map((bucket) => (
          <Pressable accessibilityRole="button" key={bucket.key} onPress={() => openTransactions(bucket.startAt, bucket.endAt)} style={({ pressed }) => [styles.timelineRow, pressed && styles.pressed]}>
            <Text style={styles.timelineLabel}>{new Intl.DateTimeFormat('th-TH', range.grouping === 'month' ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' }).format(new Date(bucket.startAt))}</Text>
            <View style={styles.timelineBars}>
              <View><Text style={styles.miniLabel}>รับ {formatMoney(bucket.incomeMinor)}</Text><Bar amountMinor={bucket.incomeMinor} maximumMinor={cashFlowMaximum} tone="income" /></View>
              <View><Text style={styles.miniLabel}>จ่าย {formatMoney(bucket.expenseMinor)}</Text><Bar amountMinor={bucket.expenseMinor} maximumMinor={cashFlowMaximum} tone="expense" /></View>
            </View>
          </Pressable>
        ))}
        {!loading && cashFlow.every((item) => item.incomeMinor === 0 && item.expenseMinor === 0) ? <Text style={styles.empty}>ยังไม่มีเงินเข้าออกในช่วงนี้</Text> : null}

        <View>
          <Text style={styles.sectionTitle}>งบเทียบยอดใช้จริง</Text>
          <Text style={styles.sectionHint}>{!customMode && period === 'current-month' ? 'แสดงแผนงบเดือนปัจจุบัน' : 'เลือก “เดือนนี้” เพื่อดูแผนงบปัจจุบัน'}</Text>
        </View>
        {!customMode && period === 'current-month' && budget ? budget.allocations.map((allocation) => (
          <View key={allocation.categoryId} style={styles.reportRow}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowTitle}>{allocation.categoryName}</Text>
              <Text style={styles.rowAmount}>{formatMoney(allocation.spentMinor)} / {formatMoney(allocation.allocatedMinor)}</Text>
            </View>
            <Bar amountMinor={Math.min(allocation.spentMinor, allocation.allocatedMinor)} maximumMinor={allocation.allocatedMinor} tone="budget" />
            <Text style={styles.remainingText}>เหลือ {formatMoney(allocation.allocatedMinor - allocation.spentMinor)}</Text>
          </View>
        )) : null}
        {!customMode && period === 'current-month' && !budget ? <Text style={styles.empty}>ยังไม่ได้ตั้งงบเดือนนี้</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, gap: 14 },
  periodPicker: { flexDirection: 'row', gap: 7, padding: 4, borderRadius: 14, backgroundColor: '#E7EAE3' },
  periodButton: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  periodButtonActive: { backgroundColor: '#173F2B' },
  periodText: { color: '#526158', fontSize: 13, fontWeight: '700' },
  periodTextActive: { color: '#FFFFFF' },
  customToggle: { minHeight: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 12, backgroundColor: '#FFFEF9' },
  customToggleActive: { borderColor: '#173F2B', backgroundColor: '#173F2B' },
  customCard: { gap: 10, padding: 14, borderRadius: 14, backgroundColor: '#FFF8E9' },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateField: { flex: 1, gap: 5 },
  dateLabel: { color: '#704C2D', fontSize: 12, fontWeight: '700' },
  dateInput: { minHeight: 44, paddingHorizontal: 11, borderWidth: 1, borderColor: '#D9B984', borderRadius: 11, color: '#17211B', backgroundColor: '#FFFFFF' },
  applyButton: { minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#176B48' },
  applyText: { color: '#FFFFFF', fontWeight: '800' },
  summaryCard: { flexDirection: 'row', alignItems: 'stretch', padding: 16, borderRadius: 17, backgroundColor: '#FFFEF9' },
  summaryItem: { flex: 1, gap: 4 },
  summaryDivider: { width: 1, marginHorizontal: 10, backgroundColor: '#DFE4DA' },
  summaryLabel: { color: '#66736A', fontSize: 11 },
  summaryValue: { color: '#17211B', fontSize: 15, fontWeight: '800' },
  incomeText: { color: '#176B48', fontSize: 15, fontWeight: '800' },
  expenseText: { color: '#A93D38', fontSize: 15, fontWeight: '800' },
  sectionTitle: { marginTop: 5, color: '#17211B', fontSize: 19, fontWeight: '800' },
  sectionHint: { marginTop: 3, color: '#66736A', fontSize: 12 },
  reportRow: { gap: 8, padding: 14, borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 14, backgroundColor: '#FFFEF9' },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  rowTitle: { flex: 1, color: '#17211B', fontWeight: '700' },
  rowAmount: { color: '#526158', fontSize: 12, fontWeight: '700' },
  barTrack: { height: 8, overflow: 'hidden', borderRadius: 999, backgroundColor: '#E7EAE3' },
  barFill: { height: '100%', borderRadius: 999 },
  incomeBar: { backgroundColor: '#2C8A62' },
  expenseBar: { backgroundColor: '#C65E55' },
  budgetBar: { backgroundColor: '#B86B25' },
  timelineRow: { flexDirection: 'row', gap: 12, padding: 13, borderRadius: 14, backgroundColor: '#FFFEF9' },
  timelineLabel: { width: 66, color: '#17211B', fontSize: 12, fontWeight: '800' },
  timelineBars: { flex: 1, gap: 8 },
  miniLabel: { marginBottom: 3, color: '#66736A', fontSize: 11 },
  remainingText: { color: '#66736A', fontSize: 11 },
  openHint: { color: '#176B48', fontSize: 11, fontWeight: '700', textAlign: 'right' },
  showAllButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#176B48', borderRadius: 12 },
  showAllText: { color: '#176B48', fontWeight: '800' },
  pressed: { opacity: 0.7 },
  empty: { padding: 16, color: '#66736A', textAlign: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#B8C1B9', borderRadius: 14 },
  muted: { color: '#66736A', fontSize: 12 },
  error: { color: '#A93D38' },
});
