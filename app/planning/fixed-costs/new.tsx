import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fixedCostRepository } from '@/database/fixed-cost-store';
import { clampedDueDate, fixedCostFrequencies, frequencyLabel, type FixedCostFrequency } from '@/domain/fixed-costs';
import { parseMoneyInput } from '@/domain/wallets';
import { useExpenseCategories } from '@/features/expense-categories/use-expense-categories';
import { useWallets } from '@/features/wallets/use-wallets';

type PastDueStrategy = 'include-overdue' | 'next-cycle';

function firstDueAt(frequency: FixedCostFrequency, intervalMonths: number, dueDay: number, strategy: PastDueStrategy): string {
  const now = new Date();
  let due = clampedDueDate(now.getFullYear(), now.getMonth(), dueDay);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (due < today && strategy === 'next-cycle') {
    const monthsToAdd = frequency === 'yearly' ? 12 : frequency === 'every-n-months' ? intervalMonths : 1;
    due = clampedDueDate(now.getFullYear(), now.getMonth() + monthsToAdd, dueDay);
  }
  return due.toISOString();
}

export default function NewFixedCostScreen() {
  const { categories, loading: categoriesLoading } = useExpenseCategories();
  const { wallets, loading: walletsLoading } = useWallets();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<FixedCostFrequency>('monthly');
  const [intervalMonths, setIntervalMonths] = useState('2');
  const [dueDay, setDueDay] = useState('1');
  const [pastDueStrategy, setPastDueStrategy] = useState<PastDueStrategy>('next-cycle');
  const [payee, setPayee] = useState('');
  const [note, setNote] = useState('');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategoryId = useMemo(() => categoryId && categories.some((item) => item.id === categoryId) ? categoryId : categories[0]?.id ?? null, [categories, categoryId]);
  const selectedWalletId = useMemo(() => walletId && wallets.some((item) => item.id === walletId) ? walletId : wallets[0]?.id ?? null, [walletId, wallets]);
  const parsedDueDay = Number(dueDay);
  const dueHasPassed = Number.isInteger(parsedDueDay) && parsedDueDay >= 1 && parsedDueDay < new Date().getDate();

  async function save() {
    const estimatedMinor = parseMoneyInput(amount);
    const parsedInterval = Number(intervalMonths);
    if (!name.trim() || name.trim().length > 80) return setError('กรุณากรอกชื่อ 1–80 ตัวอักษร');
    if (estimatedMinor === null || estimatedMinor <= 0) return setError('กรุณากรอกยอดประมาณการที่มากกว่า 0');
    if (!selectedCategoryId) return setError('กรุณาสร้างและเลือกหมวดรายจ่าย');
    if (!selectedWalletId) return setError('กรุณาสร้างและเลือกกระเป๋าที่จะจ่าย');
    if (!Number.isInteger(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) return setError('วันครบกำหนดต้องอยู่ระหว่าง 1–31');
    if (frequency === 'every-n-months' && (!Number.isInteger(parsedInterval) || parsedInterval < 2 || parsedInterval > 120)) return setError('ความถี่ต้องอยู่ระหว่าง 2–120 เดือน');
    try {
      setSaving(true);
      setError(null);
      await fixedCostRepository.createSchedule({
        name,
        categoryId: selectedCategoryId,
        estimatedMinor,
        walletId: selectedWalletId,
        frequency,
        intervalMonths: frequency === 'every-n-months' ? parsedInterval : 1,
        dueDay: parsedDueDay,
        firstDueAt: firstDueAt(frequency, parsedInterval, parsedDueDay, pastDueStrategy),
        payee: payee || null,
        note: note || null,
        remindersEnabled,
      });
      router.replace('/planning/fixed-costs');
    } catch {
      setError('บันทึก Fixed Cost ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.field}><Text style={styles.label}>ชื่อรายการ</Text><TextInput accessibilityLabel="ชื่อ Fixed Cost" maxLength={80} onChangeText={setName} placeholder="เช่น ค่าอินเทอร์เน็ต" placeholderTextColor="#8A948C" style={styles.input} value={name} /></View>
          <View style={styles.field}><Text style={styles.label}>ยอดประมาณการ</Text><TextInput accessibilityLabel="ยอดประมาณการ" inputMode="decimal" onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#8A948C" style={styles.amountInput} value={amount} /></View>

          <View style={styles.field}>
            <View style={styles.sectionHeader}><Text style={styles.label}>หมวดรายจ่าย</Text><Pressable accessibilityRole="button" onPress={() => router.push('/categories')}><Text style={styles.link}>จัดการหมวด</Text></Pressable></View>
            {categoriesLoading ? <Text style={styles.hint}>กำลังโหลด…</Text> : null}
            <View style={styles.options}>{categories.map((category) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: selectedCategoryId === category.id }} key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.chip, selectedCategoryId === category.id && styles.chipActive]}><Text style={[styles.chipText, selectedCategoryId === category.id && styles.chipTextActive]}>{category.name}</Text></Pressable>)}</View>
          </View>

          <View style={styles.field}>
            <View style={styles.sectionHeader}><Text style={styles.label}>กระเป๋าที่จะจ่าย</Text><Pressable accessibilityRole="button" onPress={() => router.push('/wallets/new')}><Text style={styles.link}>เพิ่มกระเป๋า</Text></Pressable></View>
            {walletsLoading ? <Text style={styles.hint}>กำลังโหลด…</Text> : null}
            <View style={styles.options}>{wallets.map((wallet) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: selectedWalletId === wallet.id }} key={wallet.id} onPress={() => setWalletId(wallet.id)} style={[styles.chip, selectedWalletId === wallet.id && styles.chipActive]}><Text style={[styles.chipText, selectedWalletId === wallet.id && styles.chipTextActive]}>{wallet.name}</Text></Pressable>)}</View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>ความถี่</Text>
            <View style={styles.options}>{fixedCostFrequencies.map((item) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: frequency === item }} key={item} onPress={() => setFrequency(item)} style={[styles.chip, frequency === item && styles.chipActive]}><Text style={[styles.chipText, frequency === item && styles.chipTextActive]}>{frequencyLabel(item, Number(intervalMonths) || 2)}</Text></Pressable>)}</View>
          </View>
          {frequency === 'every-n-months' ? <View style={styles.field}><Text style={styles.label}>ทุกกี่เดือน</Text><TextInput accessibilityLabel="จำนวนเดือนต่อรอบ" inputMode="numeric" onChangeText={setIntervalMonths} style={styles.input} value={intervalMonths} /></View> : null}
          <View style={styles.field}><Text style={styles.label}>วันครบกำหนด (1–31)</Text><TextInput accessibilityLabel="วันครบกำหนด" inputMode="numeric" maxLength={2} onChangeText={setDueDay} style={styles.input} value={dueDay} /><Text style={styles.hint}>ถ้าเดือนไหนไม่มีวันที่นี้ จะใช้วันสุดท้ายของเดือน</Text></View>

          {dueHasPassed ? (
            <View style={styles.pastDueCard}>
              <Text style={styles.label}>วันที่นี้ผ่านไปแล้วในเดือนนี้</Text>
              <View style={styles.options}>
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: pastDueStrategy === 'next-cycle' }} onPress={() => setPastDueStrategy('next-cycle')} style={[styles.chip, pastDueStrategy === 'next-cycle' && styles.chipActive]}><Text style={[styles.chipText, pastDueStrategy === 'next-cycle' && styles.chipTextActive]}>เริ่มรอบถัดไป</Text></Pressable>
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: pastDueStrategy === 'include-overdue' }} onPress={() => setPastDueStrategy('include-overdue')} style={[styles.chip, pastDueStrategy === 'include-overdue' && styles.chipActive]}><Text style={[styles.chipText, pastDueStrategy === 'include-overdue' && styles.chipTextActive]}>เพิ่มย้อนหลัง</Text></Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.field}><Text style={styles.label}>ผู้รับเงิน (ไม่บังคับ)</Text><TextInput accessibilityLabel="ผู้รับเงิน" maxLength={80} onChangeText={setPayee} style={styles.input} value={payee} /></View>
          <View style={styles.field}><Text style={styles.label}>หมายเหตุ (ไม่บังคับ)</Text><TextInput accessibilityLabel="หมายเหตุ" maxLength={160} onChangeText={setNote} style={styles.input} value={note} /></View>
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: remindersEnabled }} onPress={() => setRemindersEnabled((value) => !value)} style={styles.switchRow}><Text style={styles.label}>เตือน 3 วันก่อน วันครบกำหนด และเมื่อเกินกำหนด</Text><Text style={styles.switchText}>{remindersEnabled ? 'เปิด' : 'ปิด'}</Text></Pressable>

          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.saveButton, (pressed || saving) && styles.pressed]}><Text style={styles.saveText}>{saving ? 'กำลังบันทึก…' : 'บันทึก Fixed Cost'}</Text></Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, gap: 18 },
  field: { gap: 8 },
  label: { color: '#17211B', fontSize: 15, fontWeight: '700' },
  input: { minHeight: 48, paddingHorizontal: 13, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 12, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 16 },
  amountInput: { minHeight: 64, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 14, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 27, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { color: '#176B48', fontSize: 13, fontWeight: '700' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 999, backgroundColor: '#FFFEF9' },
  chipActive: { borderColor: '#176B48', backgroundColor: '#DCEDDF' },
  chipText: { color: '#66736A', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#176B48' },
  pastDueCard: { padding: 14, gap: 10, borderRadius: 13, backgroundColor: '#FFF0DC' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 14, borderRadius: 13, backgroundColor: '#ECEFE8' },
  switchText: { color: '#176B48', fontWeight: '800' },
  hint: { color: '#66736A', fontSize: 12, lineHeight: 18 },
  error: { color: '#A93D38', lineHeight: 20 },
  saveButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#176B48' },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.65 },
});
