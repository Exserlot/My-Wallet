import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { budgetRepository } from '@/database/budget-store';
import { allocatedTotalMinor } from '@/domain/budgets';
import { currentMonthRange } from '@/domain/transactions';
import { formatMoney, parseMoneyInput } from '@/domain/wallets';
import { useExpenseCategories } from '@/features/expense-categories/use-expense-categories';

function moneyInput(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2);
}

export default function BudgetEditorScreen() {
  const { categories, loading: categoriesLoading } = useExpenseCategories(true);
  const [total, setTotal] = useState('');
  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);
  const [copiedPrevious, setCopiedPrevious] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const range = useMemo(() => currentMonthRange(), []);

  useEffect(() => {
    if (categoriesLoading || initialized.current) return;
    initialized.current = true;
    void Promise.all([
      budgetRepository.getBudget(range.start, range.end),
      budgetRepository.getLatestPlanBefore(range.start),
    ]).then(([existing, previous]) => {
      const plan = existing ?? previous;
      if (plan) {
        setTotal(moneyInput(plan.totalMinor));
        setAllocationInputs(Object.fromEntries(plan.allocations.map((allocation) => [
          allocation.categoryId,
          moneyInput('allocatedMinor' in allocation ? allocation.allocatedMinor : allocation.amountMinor),
        ])));
        setCopiedPrevious(!existing && Boolean(previous));
      }
    }).catch(() => setError('ไม่สามารถโหลดแผนงบได้')).finally(() => setLoading(false));
  }, [categoriesLoading, range.end, range.start]);

  const parsedTotal = parseMoneyInput(total) ?? 0;
  const allocations = categories.map((category) => ({
    categoryId: category.id,
    amountMinor: parseMoneyInput(allocationInputs[category.id] || '0') ?? -1,
  }));
  const allocatedMinor = allocations.some((allocation) => allocation.amountMinor < 0) ? 0 : allocatedTotalMinor(allocations);
  const unallocatedMinor = parsedTotal - allocatedMinor;

  async function save() {
    if (parsedTotal <= 0) {
      setError('กรุณากรอกงบรวมที่มากกว่า 0');
      return;
    }
    if (allocations.some((allocation) => allocation.amountMinor < 0)) {
      setError('จำนวนเงินแต่ละหมวดต้องเป็นตัวเลขและมีทศนิยมไม่เกิน 2 ตำแหน่ง');
      return;
    }
    if (allocatedMinor > parsedTotal) {
      setError('ยอดที่แบ่งตามหมวดเกินงบรวม กรุณาปรับจำนวนเงิน');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await budgetRepository.saveBudget({
        startAt: range.start,
        endAt: range.end,
        totalMinor: parsedTotal,
        allocations,
      });
      router.replace('/planning');
    } catch {
      setError('บันทึกงบไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {copiedPrevious ? <Text style={styles.copyNotice}>คัดลอกโครงสร้างจากรอบก่อนแล้ว ยอดใช้จริงเริ่มจากศูนย์</Text> : null}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>งบรวมเดือนนี้</Text>
            <TextInput accessibilityLabel="งบรวมเดือนนี้" inputMode="decimal" onChangeText={setTotal} placeholder="10,000.00" placeholderTextColor="#8A948C" style={styles.totalInput} value={total} />
            <Text style={styles.hint}>กำหนดเอง ไม่คำนวณจากรายรับ</Text>
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.hint}>ยังไม่จัดสรร</Text>
            <Text style={[styles.balanceValue, unallocatedMinor < 0 && styles.danger]}>{formatMoney(unallocatedMinor)}</Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>แบ่งตามหมวดรายจ่าย</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/categories')}><Text style={styles.link}>จัดการหมวด</Text></Pressable>
          </View>
          {!categoriesLoading && categories.length === 0 ? <Text style={styles.empty}>ยังไม่มีหมวดรายจ่าย กด “จัดการหมวด” เพื่อสร้างก่อน</Text> : null}
          {categories.map((category) => (
            <View key={category.id} style={[styles.categoryRow, category.archivedAt && styles.archived]}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                {category.archivedAt ? <Text style={styles.hint}>เก็บถาวรแล้ว · รักษายอดเดิมไว้</Text> : null}
              </View>
              <TextInput
                accessibilityLabel={`งบหมวด ${category.name}`}
                editable={!category.archivedAt}
                inputMode="decimal"
                onChangeText={(value) => setAllocationInputs((current) => ({ ...current, [category.id]: value }))}
                placeholder="0.00"
                placeholderTextColor="#8A948C"
                style={styles.allocationInput}
                value={allocationInputs[category.id] ?? ''}
              />
            </View>
          ))}

          {loading ? <Text style={styles.hint}>กำลังโหลดแผน…</Text> : null}
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <Pressable accessibilityRole="button" disabled={saving || loading} onPress={() => void save()} style={({ pressed }) => [styles.saveButton, (pressed || saving || loading) && styles.pressed]}>
            <Text style={styles.saveText}>{saving ? 'กำลังบันทึก…' : 'บันทึกงบเดือนนี้'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, gap: 17 },
  fieldGroup: { gap: 7 },
  label: { color: '#17211B', fontSize: 15, fontWeight: '700' },
  totalInput: { minHeight: 66, paddingHorizontal: 15, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 15, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 28, fontWeight: '800' },
  balanceCard: { padding: 15, borderRadius: 14, backgroundColor: '#DCEDDF' },
  balanceValue: { marginTop: 3, color: '#176B48', fontSize: 21, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: '#17211B', fontSize: 17, fontWeight: '800' },
  link: { color: '#176B48', fontWeight: '700' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 14, backgroundColor: '#FFFEF9' },
  categoryInfo: { flex: 1 },
  categoryName: { color: '#17211B', fontWeight: '700' },
  allocationInput: { width: 130, minHeight: 43, paddingHorizontal: 11, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 11, color: '#17211B', backgroundColor: '#FFFFFF', textAlign: 'right', fontWeight: '700' },
  archived: { opacity: 0.6 },
  empty: { padding: 15, color: '#66736A', textAlign: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#B8C1B9', borderRadius: 14 },
  copyNotice: { padding: 13, borderRadius: 12, color: '#704C2D', backgroundColor: '#FFF0DC', lineHeight: 20 },
  hint: { color: '#66736A', fontSize: 12 },
  danger: { color: '#A93D38' },
  error: { color: '#A93D38', lineHeight: 20 },
  saveButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#176B48' },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.65 },
});
