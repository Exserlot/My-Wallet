import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { plannedPurchaseRepository } from '@/database/planned-purchase-store';
import { validatePlannedPurchase, type PlannedPurchasePriority } from '@/domain/planned-purchases';
import { parseMoneyInput } from '@/domain/wallets';
import { useExpenseCategories } from '@/features/expense-categories/use-expense-categories';

const priorities: { value: PlannedPurchasePriority; label: string }[] = [
  { value: 'high', label: 'สำคัญมาก' },
  { value: 'normal', label: 'ปกติ' },
  { value: 'low', label: 'ไว้ก่อน' },
];

export default function NewPlannedPurchaseScreen() {
  const { categories } = useExpenseCategories();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<PlannedPurchasePriority>('normal');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const parsedQuantity = Number(quantity);
    const estimatedUnitMinor = estimatedPrice.trim() ? parseMoneyInput(estimatedPrice) : null;
    const validationError = validatePlannedPurchase({ name, quantity: parsedQuantity, estimatedUnitMinor });
    if (validationError) return setError(validationError);
    if (estimatedPrice.trim() && estimatedUnitMinor === null) return setError('ราคาประมาณต้องเป็นตัวเลขและมีทศนิยมไม่เกิน 2 ตำแหน่ง');
    try {
      setSaving(true);
      setError(null);
      await plannedPurchaseRepository.create({ name, quantity: parsedQuantity, estimatedUnitMinor, categoryId, merchant, note, priority });
      router.replace('/planning/shopping-list');
    } catch {
      setError('เพิ่มรายการไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={styles.label}>ชื่อสินค้า *</Text>
            <TextInput accessibilityLabel="ชื่อสินค้า" autoFocus maxLength={80} onChangeText={setName} placeholder="เช่น หูฟังไร้สาย" placeholderTextColor="#8A948C" style={styles.input} value={name} />
          </View>

          <View style={styles.twoColumns}>
            <View style={styles.smallField}>
              <Text style={styles.label}>จำนวน</Text>
              <TextInput accessibilityLabel="จำนวนสินค้า" inputMode="numeric" onChangeText={setQuantity} style={styles.input} value={quantity} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>ราคาประมาณต่อชิ้น</Text>
              <TextInput accessibilityLabel="ราคาประมาณต่อชิ้น" inputMode="decimal" onChangeText={setEstimatedPrice} placeholder="ไม่บังคับ" placeholderTextColor="#8A948C" style={styles.input} value={estimatedPrice} />
            </View>
          </View>
          <Text style={styles.notice}>ราคานี้ไม่กันเงินและไม่หักงบ</Text>

          <View style={styles.field}>
            <Text style={styles.label}>ความสำคัญ</Text>
            <View style={styles.options}>
              {priorities.map((item) => (
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: priority === item.value }} key={item.value} onPress={() => setPriority(item.value)} style={[styles.chip, priority === item.value && styles.chipActive]}>
                  <Text style={[styles.chipText, priority === item.value && styles.chipTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>หมวดรายจ่าย (ไม่บังคับ)</Text>
            <View style={styles.options}>
              <Pressable accessibilityRole="radio" accessibilityState={{ checked: categoryId === null }} onPress={() => setCategoryId(null)} style={[styles.chip, categoryId === null && styles.categoryActive]}><Text style={styles.chipText}>ยังไม่ระบุ</Text></Pressable>
              {categories.map((category) => (
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: categoryId === category.id }} key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.chip, categoryId === category.id && styles.categoryActive]}><Text style={styles.chipText}>{category.name}</Text></Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>ร้านค้า (ไม่บังคับ)</Text>
            <TextInput accessibilityLabel="ร้านค้า" maxLength={80} onChangeText={setMerchant} placeholder="เช่น ร้านออนไลน์" placeholderTextColor="#8A948C" style={styles.input} value={merchant} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>หมายเหตุ (ไม่บังคับ)</Text>
            <TextInput accessibilityLabel="หมายเหตุ" maxLength={120} onChangeText={setNote} placeholder="สี รุ่น หรือลิงก์อ้างอิง" placeholderTextColor="#8A948C" style={styles.input} value={note} />
          </View>

          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.saveButton, (pressed || saving) && styles.pressed]}>
            <Text style={styles.saveText}>{saving ? 'กำลังเพิ่ม…' : 'เพิ่มในรายการ'}</Text>
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
  field: { gap: 8 },
  smallField: { width: 105, gap: 8 },
  twoColumns: { flexDirection: 'row', gap: 12 },
  label: { color: '#17211B', fontSize: 15, fontWeight: '700' },
  input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 13, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 16 },
  notice: { marginTop: -8, color: '#8A4C17', fontSize: 12 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 42, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 999, backgroundColor: '#FFFEF9' },
  chipActive: { borderColor: '#176B48', backgroundColor: '#DCEDDF' },
  categoryActive: { borderColor: '#B86B25', backgroundColor: '#FFF0DC' },
  chipText: { color: '#66736A', fontWeight: '600' },
  chipTextActive: { color: '#176B48' },
  error: { color: '#A93D38', lineHeight: 20 },
  saveButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#176B48' },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.65 },
});
