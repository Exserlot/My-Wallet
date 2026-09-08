import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { transferRepository } from '@/database/transfer-store';
import { validateWalletTransfer } from '@/domain/transfers';
import { formatMoney, parseMoneyInput } from '@/domain/wallets';
import { useWallets } from '@/features/wallets/use-wallets';

export default function NewTransferScreen() {
  const { wallets, loading } = useWallets();
  const [fromWalletId, setFromWalletId] = useState<string | null>(null);
  const [toWalletId, setToWalletId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sourceId = useMemo(() => fromWalletId && wallets.some((wallet) => wallet.id === fromWalletId) ? fromWalletId : wallets[0]?.id ?? null, [fromWalletId, wallets]);
  const destinationId = useMemo(() => toWalletId && wallets.some((wallet) => wallet.id === toWalletId) ? toWalletId : wallets.find((wallet) => wallet.id !== sourceId)?.id ?? null, [sourceId, toWalletId, wallets]);

  async function save() {
    const amountMinor = parseMoneyInput(amount);
    const validationError = validateWalletTransfer({ fromWalletId: sourceId ?? '', toWalletId: destinationId ?? '', amountMinor: amountMinor ?? 0 });
    if (validationError) return setError(validationError);
    try {
      setSaving(true); setError(null);
      await transferRepository.createTransfer({ fromWalletId: sourceId!, toWalletId: destinationId!, amountMinor: amountMinor!, occurredAt: new Date().toISOString(), note: note || null });
      router.replace('/wallets');
    } catch { setError('บันทึกการโอนไม่สำเร็จ'); }
    finally { setSaving(false); }
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}><ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {loading ? <Text style={styles.muted}>กำลังโหลดกระเป๋า…</Text> : null}
      {wallets.length < 2 && !loading ? <Text style={styles.warning}>ต้องมีอย่างน้อย 2 Wallet จึงจะโอนระหว่างกันได้</Text> : null}
      <View style={styles.field}><Text style={styles.label}>จาก Wallet</Text><View style={styles.options}>{wallets.map((wallet) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: sourceId === wallet.id }} key={wallet.id} onPress={() => { setFromWalletId(wallet.id); if (destinationId === wallet.id) setToWalletId(null); }} style={[styles.chip, sourceId === wallet.id && styles.chipActive]}><Text style={[styles.chipText, sourceId === wallet.id && styles.chipTextActive]}>{wallet.name} · {formatMoney(wallet.balanceMinor)}</Text></Pressable>)}</View></View>
      <View style={styles.arrow}><Text style={styles.arrowText}>↓</Text></View>
      <View style={styles.field}><Text style={styles.label}>ไปยัง Wallet</Text><View style={styles.options}>{wallets.filter((wallet) => wallet.id !== sourceId).map((wallet) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: destinationId === wallet.id }} key={wallet.id} onPress={() => setToWalletId(wallet.id)} style={[styles.chip, destinationId === wallet.id && styles.chipActive]}><Text style={[styles.chipText, destinationId === wallet.id && styles.chipTextActive]}>{wallet.name}</Text></Pressable>)}</View></View>
      <View style={styles.field}><Text style={styles.label}>ยอดโอน</Text><TextInput accessibilityLabel="ยอดโอน" inputMode="decimal" onChangeText={setAmount} placeholder="0.00" style={styles.amountInput} value={amount} /></View>
      <View style={styles.field}><Text style={styles.label}>หมายเหตุ (ไม่บังคับ)</Text><TextInput accessibilityLabel="หมายเหตุการโอน" maxLength={160} onChangeText={setNote} style={styles.input} value={note} /></View>
      <Text style={styles.note}>Transfer เปลี่ยนยอดของสอง Wallet แต่ไม่ถูกนับเป็น Income หรือ Expense และยอดรวมทั้งหมดไม่เปลี่ยน</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" disabled={saving || wallets.length < 2} onPress={() => void save()} style={[styles.saveButton, (saving || wallets.length < 2) && styles.disabled]}><Text style={styles.saveText}>{saving ? 'กำลังบันทึก…' : 'ยืนยันการโอน'}</Text></Pressable>
    </ScrollView></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' }, container: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, gap: 17 },
  field: { gap: 8 }, label: { color: '#17211B', fontSize: 15, fontWeight: '800' }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 42, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 999, backgroundColor: '#FFFEF9' }, chipActive: { borderColor: '#176B48', backgroundColor: '#DCEDDF' }, chipText: { color: '#66736A', fontWeight: '600' }, chipTextActive: { color: '#176B48' },
  arrow: { alignItems: 'center' }, arrowText: { color: '#176B48', fontSize: 24, fontWeight: '800' }, amountInput: { minHeight: 64, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 14, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 27, fontWeight: '800' }, input: { minHeight: 48, paddingHorizontal: 13, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 12, color: '#17211B', backgroundColor: '#FFFEF9' },
  note: { padding: 13, borderRadius: 12, color: '#526158', backgroundColor: '#ECEFE8', fontSize: 12, lineHeight: 18 }, warning: { padding: 14, borderRadius: 12, color: '#8A4C17', backgroundColor: '#FFF0DC' }, error: { color: '#A93D38' }, muted: { color: '#66736A' }, saveButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#176B48' }, saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }, disabled: { opacity: 0.45 },
});
