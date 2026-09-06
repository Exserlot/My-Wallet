import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { budgetUsagePercent } from '@/domain/budgets';
import { formatMoney } from '@/domain/wallets';
import { useMonthlyBudget } from '@/features/budgets/use-monthly-budget';

export default function PlanningScreen() {
  const { budget, loading, error } = useMonthlyBudget();
  const monthLabel = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' }).format(new Date());

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View>
          <Text style={styles.eyebrow}>รอบ 1–สิ้นเดือน {monthLabel}</Text>
          <Text style={styles.title}>วางแผนการเงิน</Text>
        </View>

        {loading ? <Text style={styles.muted}>กำลังโหลด…</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !budget ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>ยังไม่ได้ตั้งงบเดือนนี้</Text>
            <Text style={styles.muted}>กำหนดวงเงินรวม แล้วแบ่งตามหมวดที่คุณต้องการควบคุม</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/planning/budget')} style={styles.primaryButton}>
              <Text style={styles.primaryText}>ตั้งงบเดือนนี้</Text>
            </Pressable>
          </View>
        ) : null}

        {budget ? (
          <>
            <View style={[styles.heroCard, budget.remainingMinor < 0 && styles.overCard]}>
              <Text style={styles.heroLabel}>{budget.remainingMinor < 0 ? 'ใช้เกินงบแล้ว' : 'งบคงเหลือ'}</Text>
              <Text style={styles.heroValue}>{formatMoney(budget.remainingMinor)}</Text>
              <Text style={styles.heroMeta}>ใช้ไป {formatMoney(budget.spentMinor)} จาก {formatMoney(budget.totalMinor)} · {budgetUsagePercent(budget.spentMinor, budget.totalMinor)}%</Text>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.muted}>ยังไม่จัดสรร</Text>
                <Text style={styles.metricValue}>{formatMoney(budget.unallocatedMinor)}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.muted}>แบ่งแล้ว</Text>
                <Text style={styles.metricValue}>{formatMoney(budget.totalMinor - budget.unallocatedMinor)}</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>งบตามหมวด</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/planning/budget')}>
                <Text style={styles.link}>แก้ไขแผน</Text>
              </Pressable>
            </View>
            {budget.allocations.length === 0 ? <Text style={styles.emptyLine}>ยังไม่ได้แบ่งงบให้หมวดใด</Text> : null}
            {budget.allocations.map((allocation) => {
              const remaining = allocation.allocatedMinor - allocation.spentMinor;
              const percent = budgetUsagePercent(allocation.spentMinor, allocation.allocatedMinor);
              return (
                <View key={allocation.categoryId} style={styles.allocationCard}>
                  <View style={styles.row}>
                    <Text style={styles.allocationName}>{allocation.categoryName}</Text>
                    <Text style={[styles.remaining, remaining < 0 && styles.danger]}>{formatMoney(remaining)}</Text>
                  </View>
                  <Text style={styles.muted}>ใช้ {formatMoney(allocation.spentMinor)} จาก {formatMoney(allocation.allocatedMinor)} · {percent}%</Text>
                  <View style={styles.progress}><View style={[styles.progressFill, percent >= 100 && styles.progressDanger, { width: `${Math.min(percent, 100)}%` }]} /></View>
                </View>
              );
            })}
          </>
        ) : null}

        <View style={styles.comingCard}>
          <Text style={styles.comingTitle}>Fixed Cost และของที่ต้องซื้อ</Text>
          <Text style={styles.muted}>จะเชื่อมเข้ากับหน้าวางแผนในขั้นถัดไป</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, gap: 14 },
  eyebrow: { color: '#66736A', fontSize: 13 },
  title: { color: '#17211B', fontSize: 28, fontWeight: '800' },
  emptyCard: { padding: 22, alignItems: 'center', gap: 9, borderWidth: 1, borderStyle: 'dashed', borderColor: '#B8C1B9', borderRadius: 18 },
  emptyTitle: { color: '#17211B', fontSize: 17, fontWeight: '800' },
  primaryButton: { minHeight: 46, marginTop: 5, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#176B48' },
  primaryText: { color: '#FFFFFF', fontWeight: '800' },
  heroCard: { padding: 19, borderRadius: 19, backgroundColor: '#173F2B' },
  overCard: { backgroundColor: '#7F302D' },
  heroLabel: { color: '#C9D8CE', fontSize: 13 },
  heroValue: { marginTop: 3, color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  heroMeta: { marginTop: 8, color: '#DCE7DF', fontSize: 12 },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, minWidth: 0, padding: 15, borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 15, backgroundColor: '#FFFEF9' },
  metricValue: { marginTop: 4, color: '#17211B', fontSize: 17, fontWeight: '800' },
  sectionHeader: { marginTop: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#17211B', fontSize: 19, fontWeight: '800' },
  link: { color: '#176B48', fontWeight: '700' },
  allocationCard: { padding: 15, gap: 7, borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 15, backgroundColor: '#FFFEF9' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  allocationName: { flex: 1, color: '#17211B', fontWeight: '700' },
  remaining: { color: '#176B48', fontWeight: '800' },
  danger: { color: '#A93D38' },
  progress: { height: 7, overflow: 'hidden', borderRadius: 999, backgroundColor: '#E5E9E3' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#2E8B62' },
  progressDanger: { backgroundColor: '#B34B43' },
  emptyLine: { padding: 15, color: '#66736A', textAlign: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#B8C1B9', borderRadius: 14 },
  comingCard: { marginTop: 6, padding: 16, borderRadius: 14, backgroundColor: '#ECEFE8' },
  comingTitle: { color: '#526158', fontWeight: '700' },
  muted: { color: '#66736A', fontSize: 12, lineHeight: 18 },
  error: { color: '#A93D38' },
});
