import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { walletRepository } from '@/database/wallet-store';
import { formatMoney, parseSignedMoneyInput } from '@/domain/wallets';
import { useWallets } from '@/features/wallets/use-wallets';

export default function AdjustWalletScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { wallets, loading } = useWallets();
  const wallet = useMemo(() => wallets.find((item) => item.id === id) ?? null, [id, wallets]);
  const [targetBalance, setTargetBalance] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetBalanceValue = targetBalance ?? (wallet ? (wallet.balanceMinor / 100).toFixed(2) : '');
  const parsedTarget = parseSignedMoneyInput(targetBalanceValue);
  const deltaMinor = wallet && parsedTarget !== null ? parsedTarget - wallet.balanceMinor : null;

  async function save() {
    if (!wallet || parsedTarget === null) {
      setError('กรุณากรอกยอดจริงเป็นตัวเลขและมีทศนิยมไม่เกิน 2 ตำแหน่ง');
      return;
    }
    if (deltaMinor === 0) {
      setError('ยอดนี้ตรงกับยอดปัจจุบันอยู่แล้ว');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await walletRepository.setWalletBalance({
        walletId: wallet.id,
        targetBalanceMinor: parsedTarget,
        occurredAt: new Date().toISOString(),
        note: note || null,
      });
      router.replace('/wallets');
    } catch {
      setError('ปรับยอดไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {!loading && !wallet ? <Text accessibilityRole="alert" style={styles.error}>ไม่พบกระเป๋านี้</Text> : null}
          {wallet ? <>
            <View style={styles.currentCard}>
              <Text style={styles.currentLabel}>{wallet.name} · ยอดที่แอปคำนวณ</Text>
              <Text style={styles.currentValue}>{formatMoney(wallet.balanceMinor)}</Text>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>ยอดจริงตอนนี้</Text>
              <TextInput accessibilityLabel="ยอดจริงตอนนี้" autoFocus inputMode="decimal" onChangeText={setTargetBalance} placeholder="0.00" placeholderTextColor="#8A948C" style={styles.amountInput} value={targetBalanceValue} />
            </View>
            {deltaMinor !== null ? <View style={styles.previewCard}><Text style={styles.previewLabel}>ส่วนต่างที่จะบันทึก</Text><Text style={[styles.previewValue, deltaMinor < 0 ? styles.negative : styles.positive]}>{deltaMinor > 0 ? '+' : ''}{formatMoney(deltaMinor)}</Text></View> : null}
            <Text style={styles.explanation}>ส่วนต่างนี้ใช้ทำให้ยอด Wallet ตรงกับเงินจริง โดยไม่ถูกนับเป็น Income หรือ Expense</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>เหตุผล (ไม่บังคับ)</Text>
              <TextInput accessibilityLabel="เหตุผล" maxLength={120} onChangeText={setNote} placeholder="เช่น นับเงินสด หรือปรับตามยอดธนาคาร" placeholderTextColor="#8A948C" style={styles.input} value={note} />
            </View>
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.saveButton, (pressed || saving) && styles.pressed]}><Text style={styles.saveText}>{saving ? 'กำลังบันทึก…' : 'ยืนยันปรับยอด'}</Text></Pressable>
          </> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, gap: 18 },
  currentCard: { padding: 18, borderRadius: 18, backgroundColor: '#173F2B' },
  currentLabel: { color: '#C9D8CE' }, currentValue: { marginTop: 5, color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  fieldGroup: { gap: 8 }, label: { color: '#17211B', fontSize: 15, fontWeight: '700' },
  amountInput: { minHeight: 68, paddingHorizontal: 15, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 15, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 30, fontWeight: '800' },
  input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 13, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 16 },
  previewCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 14, borderRadius: 13, backgroundColor: '#ECEFE8' },
  previewLabel: { color: '#526158', fontWeight: '700' }, previewValue: { fontSize: 17, fontWeight: '800' }, positive: { color: '#176B48' }, negative: { color: '#A93D38' },
  explanation: { color: '#66736A', lineHeight: 21 }, error: { color: '#A93D38', lineHeight: 20 },
  saveButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#176B48' },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }, pressed: { opacity: 0.7 },
});
