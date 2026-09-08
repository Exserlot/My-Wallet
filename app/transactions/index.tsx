import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatMoney } from '@/domain/wallets';
import type { CashFlowKind } from '@/domain/transactions';
import { useTransactions } from '@/features/transactions/use-transactions';

export default function TransactionListScreen() {
  const params = useLocalSearchParams<{ start?: string; end?: string; categoryIds?: string; categoryName?: string }>();
  const reportFilter = useMemo(() => {
    if (!params.start || !params.end) return undefined;
    return {
      start: params.start,
      end: params.end,
      categoryIds: params.categoryIds
        ? params.categoryIds.split(',').map((id) => id === '__uncategorized__' ? null : id)
        : undefined,
    };
  }, [params.categoryIds, params.end, params.start]);
  const [uncategorizedOnly, setUncategorizedOnly] = useState(false);
  const [kindFilter, setKindFilter] = useState<CashFlowKind | undefined>();
  const [query, setQuery] = useState('');
  const listOptions = useMemo(() => ({ kind: kindFilter, query }), [kindFilter, query]);
  const { transactions, totals, loading, error } = useTransactions(100, uncategorizedOnly, reportFilter, listOptions);
  const hasListFilter = Boolean(uncategorizedOnly || kindFilter || query.trim());
  const periodLabel = reportFilter
    ? `${new Date(reportFilter.start).toLocaleDateString('th-TH')} – ${new Date(new Date(reportFilter.end).getTime() - 1).toLocaleDateString('th-TH')}`
    : null;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <Text style={styles.summaryLabel}>{reportFilter ? 'รายรับช่วงที่เลือก' : hasListFilter ? 'รายรับที่แสดง' : 'รายรับเดือนนี้'}</Text>
            <Text style={styles.summaryValue}>{formatMoney(totals.incomeMinor)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Text style={styles.summaryLabel}>{reportFilter ? 'รายจ่ายช่วงที่เลือก' : hasListFilter ? 'รายจ่ายที่แสดง' : 'รายจ่ายเดือนนี้'}</Text>
            <Text style={styles.summaryValue}>{formatMoney(totals.expenseMinor)}</Text>
          </View>
        </View>

        {reportFilter ? (
          <View style={styles.reportFilterCard}>
            <View style={styles.reportFilterBody}>
              <Text style={styles.reportFilterTitle}>กำลังดูจากรายงาน{params.categoryName ? ` · ${params.categoryName}` : ''}</Text>
              <Text style={styles.reportFilterText}>{periodLabel}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.replace('/transactions')}>
              <Text style={styles.clearFilter}>ล้างตัวกรอง</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/transactions/new', params: { kind: 'income' } })} style={[styles.actionButton, styles.incomeButton]}>
            <Text style={styles.incomeButtonText}>+ รายรับ</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/transactions/new', params: { kind: 'expense' } })} style={[styles.actionButton, styles.expenseButton]}>
            <Text style={styles.expenseButtonText}>− รายจ่าย</Text>
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/transactions/slips')} style={styles.slipButton}>
          <Text style={styles.slipButtonText}>▣ นำเข้าสลิปหลายรูป</Text>
        </Pressable>

        {!reportFilter ? <>
          <TextInput accessibilityLabel="ค้นหารายการ" onChangeText={setQuery} placeholder="ค้นหารายละเอียด กระเป๋า หรือหมวด" placeholderTextColor="#8A948C" style={styles.searchInput} value={query} />
          <View style={styles.listToolbar}>
          <View style={styles.filterRow}>
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: !uncategorizedOnly && !kindFilter }} onPress={() => { setUncategorizedOnly(false); setKindFilter(undefined); }} style={[styles.filterButton, !uncategorizedOnly && !kindFilter && styles.filterActive]}>
              <Text style={[styles.filterText, !uncategorizedOnly && !kindFilter && styles.filterTextActive]}>ทั้งหมด</Text>
            </Pressable>
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: kindFilter === 'income' }} onPress={() => { setUncategorizedOnly(false); setKindFilter('income'); }} style={[styles.filterButton, kindFilter === 'income' && styles.filterActive]}>
              <Text style={[styles.filterText, kindFilter === 'income' && styles.filterTextActive]}>รายรับ</Text>
            </Pressable>
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: kindFilter === 'expense' && !uncategorizedOnly }} onPress={() => { setUncategorizedOnly(false); setKindFilter('expense'); }} style={[styles.filterButton, kindFilter === 'expense' && !uncategorizedOnly && styles.filterActive]}>
              <Text style={[styles.filterText, kindFilter === 'expense' && !uncategorizedOnly && styles.filterTextActive]}>รายจ่าย</Text>
            </Pressable>
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: uncategorizedOnly }} onPress={() => { setUncategorizedOnly(true); setKindFilter(undefined); }} style={[styles.filterButton, uncategorizedOnly && styles.filterActive]}>
              <Text style={[styles.filterText, uncategorizedOnly && styles.filterTextActive]}>ยังไม่ระบุหมวด</Text>
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/categories')}>
            <Text style={styles.categoryLink}>จัดการหมวด</Text>
          </Pressable>
          </View>
        </> : null}

        {loading ? <ActivityIndicator color="#176B48" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{hasListFilter ? 'ไม่พบรายการที่ตรงกับตัวกรอง' : 'ยังไม่มี Income หรือ Expense'}</Text>
            <Text style={styles.emptyText}>{hasListFilter ? 'ลองเปลี่ยนคำค้นหรือเลือก “ทั้งหมด”' : 'Opening Balance จะไม่แสดงและไม่ถูกนับเป็นรายรับ'}</Text>
          </View>
        ) : null}

        {transactions.map((transaction) => {
          const isIncome = transaction.kind === 'income';
          return (
            <Pressable
              accessibilityRole="button"
              key={transaction.id}
              onPress={() => router.push({ pathname: '/transactions/[id]', params: { id: transaction.id } })}
              style={({ pressed }) => [styles.transactionCard, pressed && styles.pressed]}
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
  slipButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#176B48', borderRadius: 13, backgroundColor: '#F4FBF6' },
  slipButtonText: { color: '#176B48', fontWeight: '800' },
  reportFilterCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 13, backgroundColor: '#FFF0DC' },
  reportFilterBody: { flex: 1 },
  reportFilterTitle: { color: '#6E3C13', fontWeight: '800' },
  reportFilterText: { marginTop: 3, color: '#704C2D', fontSize: 12 },
  clearFilter: { color: '#176B48', fontSize: 12, fontWeight: '800' },
  searchInput: { minHeight: 46, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 13, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 15 },
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
