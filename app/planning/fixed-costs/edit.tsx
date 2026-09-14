import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text, TextInput } from '@/components/typography';
import { fixedCostRepository } from '@/database/fixed-cost-store';
import { clampedDueDate, firstDueAtForFixedCostEdit, fixedCostFrequencies, frequencyLabel, validateFixedCostSchedule, type FixedCostFrequency, type FixedCostPastDueStrategy } from '@/domain/fixed-costs';
import { parseMoneyInput } from '@/domain/wallets';
import { useExpenseCategories } from '@/features/expense-categories/use-expense-categories';
import { useWallets } from '@/features/wallets/use-wallets';

export default function EditFixedCostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { categories } = useExpenseCategories();
  const { wallets } = useWallets();
  const [name, setName] = useState(''); const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null); const [walletId, setWalletId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<FixedCostFrequency>('monthly'); const [interval, setInterval] = useState('2'); const [dueDay, setDueDay] = useState('1');
  const [pastDueStrategy, setPastDueStrategy] = useState<FixedCostPastDueStrategy>('next-cycle'); const [payee, setPayee] = useState(''); const [note, setNote] = useState(''); const [reminders, setReminders] = useState(true);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void fixedCostRepository.listSchedules({ includeArchived: true }).then((schedules) => {
      const item = schedules.find((schedule) => schedule.id === id && schedule.archivedAt === null);
      if (!item) return setError('ไม่พบ Fixed Cost ที่แก้ไขได้');
      setName(item.name); setAmount((item.estimatedMinor / 100).toFixed(2)); setCategoryId(item.categoryId); setWalletId(item.walletId); setFrequency(item.frequency); setInterval(String(item.intervalMonths)); setDueDay(String(item.dueDay)); setPayee(item.payee ?? ''); setNote(item.note ?? ''); setReminders(item.remindersEnabled);
    }).catch(() => setError('ไม่สามารถโหลด Fixed Cost ได้')).finally(() => setLoading(false));
  }, [id]);

  async function save() {
    if (!id || !categoryId || !walletId) return setError('กรุณาเลือกหมวดและกระเป๋า');
    const estimatedMinor = parseMoneyInput(amount); const parsedInterval = Number(interval); const parsedDueDay = Number(dueDay);
    if (estimatedMinor === null) return setError('จำนวนเงินไม่ถูกต้อง');
    const validationError = validateFixedCostSchedule({ name, estimatedMinor, intervalMonths: parsedInterval, dueDay: parsedDueDay });
    if (validationError) return setError('กรุณาตรวจชื่อ จำนวนเงิน ความถี่ และวันครบกำหนด');
    const nextFirstDueAt = firstDueAtForFixedCostEdit(frequency, parsedInterval, parsedDueDay, pastDueStrategy);
    try { setSaving(true); setError(null); await fixedCostRepository.updateSchedule({ id, name, categoryId, estimatedMinor, walletId, frequency, intervalMonths: frequency === 'every-n-months' ? parsedInterval : 1, dueDay: parsedDueDay, firstDueAt: nextFirstDueAt, payee, note, remindersEnabled: reminders }); router.replace('/planning/fixed-costs'); }
    catch { setError('บันทึกการแก้ไขไม่สำเร็จ'); } finally { setSaving(false); }
  }

  const parsedDueDay = Number(dueDay);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueHasPassed = Number.isInteger(parsedDueDay) && parsedDueDay >= 1 && parsedDueDay <= 31
    && clampedDueDate(now.getFullYear(), now.getMonth(), parsedDueDay) < today;

  return <SafeAreaView edges={['bottom']} style={styles.safeArea}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    <Text style={styles.notice}>การแก้นี้มีผลกับกำหนดจ่ายที่ยังไม่จ่ายเท่านั้น ประวัติที่จ่ายหรือข้ามแล้วจะไม่เปลี่ยน</Text>
    <View style={styles.field}><Text style={styles.label}>ชื่อรายการ</Text><TextInput maxLength={80} onChangeText={setName} style={styles.input} value={name} /></View>
    <View style={styles.field}><Text style={styles.label}>ยอดประมาณการ</Text><TextInput inputMode="decimal" onChangeText={setAmount} style={styles.amountInput} value={amount} /></View>
    <View style={styles.field}><Text style={styles.label}>หมวดรายจ่าย</Text><View style={styles.options}>{categories.map((item) => <Pressable key={item.id} onPress={() => setCategoryId(item.id)} style={[styles.chip, categoryId === item.id && styles.active]}><Text>{item.name}</Text></Pressable>)}</View></View>
    <View style={styles.field}><Text style={styles.label}>กระเป๋าที่จะจ่าย</Text><View style={styles.options}>{wallets.map((item) => <Pressable key={item.id} onPress={() => setWalletId(item.id)} style={[styles.chip, walletId === item.id && styles.active]}><Text>{item.name}</Text></Pressable>)}</View></View>
    <View style={styles.field}><Text style={styles.label}>ความถี่</Text><View style={styles.options}>{fixedCostFrequencies.map((item) => <Pressable key={item} onPress={() => setFrequency(item)} style={[styles.chip, frequency === item && styles.active]}><Text>{frequencyLabel(item, Number(interval) || 2)}</Text></Pressable>)}</View></View>
    {frequency === 'every-n-months' ? <View style={styles.field}><Text style={styles.label}>ทุกกี่เดือน</Text><TextInput inputMode="numeric" onChangeText={setInterval} style={styles.input} value={interval} /></View> : null}
    <View style={styles.field}><Text style={styles.label}>วันครบกำหนด (1–31)</Text><TextInput inputMode="numeric" maxLength={2} onChangeText={setDueDay} style={styles.input} value={dueDay} /></View>
    {dueHasPassed ? <View style={styles.pastDueCard}><Text style={styles.label}>วันที่นี้ผ่านไปแล้วในเดือนนี้</Text><View style={styles.options}><Pressable accessibilityRole="radio" accessibilityState={{ checked: pastDueStrategy === 'next-cycle' }} onPress={() => setPastDueStrategy('next-cycle')} style={[styles.chip, pastDueStrategy === 'next-cycle' && styles.active]}><Text>เริ่มรอบถัดไป</Text></Pressable><Pressable accessibilityRole="radio" accessibilityState={{ checked: pastDueStrategy === 'include-overdue' }} onPress={() => setPastDueStrategy('include-overdue')} style={[styles.chip, pastDueStrategy === 'include-overdue' && styles.active]}><Text>รวมเดือนนี้แบบเกินกำหนด</Text></Pressable></View></View> : null}
    <View style={styles.field}><Text style={styles.label}>ผู้รับเงิน</Text><TextInput maxLength={80} onChangeText={setPayee} style={styles.input} value={payee} /></View><View style={styles.field}><Text style={styles.label}>หมายเหตุ</Text><TextInput maxLength={160} onChangeText={setNote} style={styles.input} value={note} /></View>
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: reminders }} onPress={() => setReminders((value) => !value)} style={styles.switchRow}><Text style={styles.label}>การแจ้งเตือน</Text><Text style={styles.switchText}>{reminders ? 'เปิด' : 'ปิด'}</Text></Pressable>
    {loading ? <Text>กำลังโหลด…</Text> : null}{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}<Pressable disabled={loading || saving} onPress={() => void save()} style={styles.save}><Text style={styles.saveText}>{saving ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}</Text></Pressable>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, safeArea: { flex: 1, backgroundColor: '#F4F5EF' }, container: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, gap: 17 }, notice: { padding: 13, borderRadius: 12, color: '#704C2D', backgroundColor: '#FFF0DC', lineHeight: 20 }, field: { gap: 8 }, label: { color: '#17211B', fontSize: 15, fontWeight: '700' }, input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 13, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 16 }, amountInput: { minHeight: 64, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 14, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 27, fontWeight: '800' }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { minHeight: 42, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 999, backgroundColor: '#FFFEF9' }, active: { borderColor: '#176B48', backgroundColor: '#DCEDDF' }, pastDueCard: { padding: 14, gap: 10, borderRadius: 13, backgroundColor: '#FFF0DC' }, switchRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 13, backgroundColor: '#ECEFE8' }, switchText: { color: '#176B48', fontWeight: '800' }, error: { color: '#A93D38' }, save: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#176B48' }, saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' } });
