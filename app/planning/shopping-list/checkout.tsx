import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { plannedPurchaseRepository } from '@/database/planned-purchase-store';
import { estimatedPurchaseTotalMinor, type PlannedPurchase } from '@/domain/planned-purchases';
import { formatMoney, parseMoneyInput } from '@/domain/wallets';
import { useExpenseCategories } from '@/features/expense-categories/use-expense-categories';
import { useWallets } from '@/features/wallets/use-wallets';

export default function PlannedPurchaseCheckoutScreen() {
  const { ids = '' } = useLocalSearchParams<{ ids?: string }>();
  const itemIds = useMemo(() => ids.split(',').filter(Boolean), [ids]);
  const { wallets } = useWallets();
  const { categories } = useExpenseCategories();
  const [items, setItems] = useState<PlannedPurchase[]>([]);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void plannedPurchaseRepository.getMany(itemIds).then((found) => {
      const active = found.filter((item) => item.status === 'active');
      setItems(active);
      const estimates = active.map(estimatedPurchaseTotalMinor);
      if (estimates.length > 0 && estimates.every((estimate) => estimate !== null)) {
        setAmount((estimates.reduce<number>((sum, estimate) => sum + (estimate ?? 0), 0) / 100).toFixed(2));
      }
      const categoryIds = [...new Set(active.map((item) => item.categoryId))];
      if (categoryIds.length === 1) setCategoryId(categoryIds[0] ?? null);
      setNote(active.map((item) => item.name).join(', ').slice(0, 120));
    }).catch(() => setError('ไม่สามารถโหลดรายการที่เลือกได้')).finally(() => setLoading(false));
  }, [itemIds]);

  const selectedWalletId = walletId ?? wallets[0]?.id ?? null;
  const selectedWallet = wallets.find((wallet) => wallet.id === selectedWalletId) ?? null;
  const actualMinor = parseMoneyInput(amount);
  const insufficientBalance = Boolean(selectedWallet && actualMinor && selectedWallet.balanceMinor < actualMinor);

  async function purchase() {
    if (items.length === 0) return setError('ไม่มีรายการที่พร้อมซื้อ');
    if (!selectedWalletId) return setError('กรุณาสร้างและเลือกกระเป๋าก่อน');
    if (actualMinor === null || actualMinor <= 0) return setError('กรุณากรอกยอดจ่ายจริงที่มากกว่า 0');
    try {
      setSaving(true);
      setError(null);
      await plannedPurchaseRepository.purchase({ itemIds: items.map((item) => item.id), walletId: selectedWalletId, actualMinor, categoryId, note, occurredAt: new Date().toISOString() });
      router.replace('/planning/shopping-list');
    } catch {
      setError('บันทึกการซื้อไม่สำเร็จ รายการอาจถูกจัดการไปแล้ว');
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SafeAreaView edges={['bottom']} style={styles.center}><ActivityIndicator color="#176B48" /></SafeAreaView>;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>ซื้อ {items.length} รายการพร้อมกัน</Text>
          {items.map((item) => <Text key={item.id} style={styles.summaryItem}>• {item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ''}</Text>)}
          <Text style={styles.summaryHint}>จะสร้าง Expense เพียง 1 รายการ</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>ยอดจ่ายจริง *</Text>
          <TextInput accessibilityLabel="ยอดจ่ายจริง" inputMode="decimal" onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#8A948C" style={styles.amountInput} value={amount} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>จ่ายจากกระเป๋า *</Text>
          <View style={styles.options}>
            {wallets.map((wallet) => (
              <Pressable accessibilityRole="radio" accessibilityState={{ checked: selectedWalletId === wallet.id }} key={wallet.id} onPress={() => setWalletId(wallet.id)} style={[styles.chip, selectedWalletId === wallet.id && styles.walletActive]}>
                <Text style={styles.chipText}>{wallet.name} · {formatMoney(wallet.balanceMinor)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>หมวดรายจ่าย</Text>
          <View style={styles.options}>
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: categoryId === null }} onPress={() => setCategoryId(null)} style={[styles.chip, categoryId === null && styles.categoryActive]}><Text style={styles.chipText}>ยังไม่ระบุ</Text></Pressable>
            {categories.map((category) => (
              <Pressable accessibilityRole="radio" accessibilityState={{ checked: categoryId === category.id }} key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.chip, categoryId === category.id && styles.categoryActive]}><Text style={styles.chipText}>{category.name}</Text></Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>รายละเอียด Expense</Text>
          <TextInput accessibilityLabel="รายละเอียด Expense" maxLength={120} onChangeText={setNote} style={styles.input} value={note} />
        </View>
        <Text style={styles.dateText}>วันที่บันทึก: {new Date().toLocaleDateString('th-TH')}</Text>
        <Text style={styles.slipText}>สลิป: ยังไม่แนบ · จะเชื่อมกับระบบอ่านสลิปในขั้นถัดไป</Text>
        {insufficientBalance ? <Text style={styles.warning}>ยอดในกระเป๋าไม่พอ แต่ยังยืนยันได้และยอดกระเป๋าจะติดลบ</Text> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

        {confirming ? (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>ยืนยันว่าซื้อแล้ว?</Text>
            <Text style={styles.confirmText}>สร้าง Expense {formatMoney(actualMinor ?? 0)} จาก {selectedWallet?.name} และย้ายสินค้าที่เลือกไป “ซื้อแล้ว”</Text>
            <View style={styles.actionRow}>
              <Pressable accessibilityRole="button" onPress={() => setConfirming(false)} style={styles.cancelButton}><Text style={styles.cancelText}>ย้อนกลับ</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={saving} onPress={() => void purchase()} style={styles.buyButton}><Text style={styles.buyText}>{saving ? 'กำลังบันทึก…' : 'ยืนยันการซื้อ'}</Text></Pressable>
            </View>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setConfirming(true)} style={styles.buyButton}><Text style={styles.buyText}>ตรวจแล้ว · บันทึกว่าซื้อแล้ว</Text></Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F5EF' },
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, gap: 17 },
  summaryCard: { padding: 17, gap: 5, borderRadius: 15, backgroundColor: '#173F2B' },
  summaryTitle: { marginBottom: 4, color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  summaryItem: { color: '#E4EEE7' },
  summaryHint: { marginTop: 5, color: '#C9D8CE', fontSize: 12 },
  field: { gap: 8 },
  label: { color: '#17211B', fontSize: 15, fontWeight: '700' },
  amountInput: { minHeight: 64, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 14, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 27, fontWeight: '800' },
  input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 13, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 16 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 42, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 999, backgroundColor: '#FFFEF9' },
  chipText: { color: '#526158', fontSize: 13, fontWeight: '600' },
  walletActive: { borderColor: '#176B48', backgroundColor: '#DCEDDF' },
  categoryActive: { borderColor: '#B86B25', backgroundColor: '#FFF0DC' },
  dateText: { color: '#526158', fontSize: 13 },
  slipText: { padding: 12, borderRadius: 11, color: '#66736A', backgroundColor: '#ECEFE8', fontSize: 12 },
  warning: { padding: 13, borderRadius: 12, color: '#8A4C17', backgroundColor: '#FFF0DC', lineHeight: 19 },
  error: { color: '#A93D38' },
  buyButton: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#176B48' },
  buyText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  confirmCard: { padding: 15, gap: 9, borderWidth: 1, borderColor: '#D9B984', borderRadius: 14, backgroundColor: '#FFF8E9' },
  confirmTitle: { color: '#6E3C13', fontSize: 16, fontWeight: '800' },
  confirmText: { color: '#704C2D', fontSize: 13, lineHeight: 19 },
  actionRow: { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#B8C1B9', borderRadius: 13, backgroundColor: '#FFFFFF' },
  cancelText: { color: '#526158', fontWeight: '700' },
});
