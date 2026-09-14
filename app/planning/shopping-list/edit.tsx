import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text, TextInput } from '@/components/typography';
import { plannedPurchaseRepository } from '@/database/planned-purchase-store';
import { validatePlannedPurchase, type PlannedPurchasePriority } from '@/domain/planned-purchases';
import { parseMoneyInput } from '@/domain/wallets';
import { useExpenseCategories } from '@/features/expense-categories/use-expense-categories';

const priorities: { value: PlannedPurchasePriority; label: string }[] = [
  { value: 'high', label: 'สำคัญมาก' }, { value: 'normal', label: 'ปกติ' }, { value: 'low', label: 'ไว้ก่อน' },
];

export default function EditPlannedPurchaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { categories } = useExpenseCategories();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<PlannedPurchasePriority>('normal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void plannedPurchaseRepository.getMany([id]).then(([item]) => {
      if (!item || item.status !== 'active') return setError('ไม่พบรายการที่แก้ไขได้');
      setName(item.name); setQuantity(String(item.quantity)); setEstimatedPrice(item.estimatedUnitMinor === null ? '' : (item.estimatedUnitMinor / 100).toFixed(2));
      setCategoryId(item.categoryId); setMerchant(item.merchant ?? ''); setNote(item.note ?? ''); setPriority(item.priority);
    }).catch(() => setError('ไม่สามารถโหลดรายการได้')).finally(() => setLoading(false));
  }, [id]);

  async function save() {
    if (!id) return;
    const parsedQuantity = Number(quantity);
    const estimatedUnitMinor = estimatedPrice.trim() ? parseMoneyInput(estimatedPrice) : null;
    const validationError = validatePlannedPurchase({ name, quantity: parsedQuantity, estimatedUnitMinor });
    if (validationError || (estimatedPrice.trim() && estimatedUnitMinor === null)) return setError(validationError ?? 'ราคาประมาณไม่ถูกต้อง');
    try {
      setSaving(true); setError(null);
      await plannedPurchaseRepository.update(id, { name, quantity: parsedQuantity, estimatedUnitMinor, categoryId, merchant, note, priority });
      router.dismissTo('/planning/shopping-list');
    } catch { setError('บันทึกการแก้ไขไม่สำเร็จ'); } finally { setSaving(false); }
  }

  return <SafeAreaView edges={['bottom']} style={styles.safeArea}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    <View style={styles.field}><Text style={styles.label}>ชื่อสินค้า *</Text><TextInput accessibilityLabel="ชื่อสินค้า" maxLength={80} onChangeText={setName} style={styles.input} value={name} /></View>
    <View style={styles.row}><View style={styles.quantity}><Text style={styles.label}>จำนวน</Text><TextInput accessibilityLabel="จำนวนสินค้า" inputMode="numeric" onChangeText={setQuantity} style={styles.input} value={quantity} /></View><View style={styles.flex}><Text style={styles.label}>ราคาประมาณต่อชิ้น</Text><TextInput accessibilityLabel="ราคาประมาณต่อชิ้น" inputMode="decimal" onChangeText={setEstimatedPrice} style={styles.input} value={estimatedPrice} /></View></View>
    <View style={styles.field}><Text style={styles.label}>ความสำคัญ</Text><View style={styles.options}>{priorities.map((item) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: priority === item.value }} key={item.value} onPress={() => setPriority(item.value)} style={[styles.chip, priority === item.value && styles.active]}><Text>{item.label}</Text></Pressable>)}</View></View>
    <View style={styles.field}><Text style={styles.label}>หมวดรายจ่าย</Text><View style={styles.options}><Pressable onPress={() => setCategoryId(null)} style={[styles.chip, categoryId === null && styles.active]}><Text>ยังไม่ระบุ</Text></Pressable>{categories.map((category) => <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.chip, categoryId === category.id && styles.active]}><Text>{category.name}</Text></Pressable>)}</View></View>
    <View style={styles.field}><Text style={styles.label}>ร้านค้า</Text><TextInput accessibilityLabel="ร้านค้า" maxLength={80} onChangeText={setMerchant} style={styles.input} value={merchant} /></View>
    <View style={styles.field}><Text style={styles.label}>หมายเหตุ</Text><TextInput accessibilityLabel="หมายเหตุ" maxLength={120} onChangeText={setNote} style={styles.input} value={note} /></View>
    {loading ? <Text style={styles.hint}>กำลังโหลด…</Text> : null}{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <Pressable accessibilityRole="button" disabled={saving || loading} onPress={() => void save()} style={styles.save}><Text style={styles.saveText}>{saving ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}</Text></Pressable>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safeArea: { flex: 1, backgroundColor: '#F4F5EF' }, container: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, gap: 17 }, field: { gap: 8 }, row: { flexDirection: 'row', gap: 12 }, quantity: { width: 105, gap: 8 },
  label: { color: '#17211B', fontSize: 15, fontWeight: '700' }, input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 13, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 16 }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { minHeight: 42, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 999, backgroundColor: '#FFFEF9' }, active: { borderColor: '#176B48', backgroundColor: '#DCEDDF' }, hint: { color: '#66736A' }, error: { color: '#A93D38' }, save: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#176B48' }, saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
