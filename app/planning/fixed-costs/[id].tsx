import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fixedCostRepository } from '@/database/fixed-cost-store';
import { canResolveFixedCostOccurrence, type FixedCostOccurrence } from '@/domain/fixed-costs';
import { formatMoney, parseMoneyInput } from '@/domain/wallets';
import { useWallets } from '@/features/wallets/use-wallets';

const statusText = {
  upcoming: 'กำลังจะถึง',
  due: 'ครบกำหนดวันนี้',
  overdue: 'เกินกำหนด',
  paid: 'จ่ายแล้ว',
  skipped: 'ข้ามแล้ว',
} as const;

export default function FixedCostOccurrenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { wallets } = useWallets();
  const [occurrence, setOccurrence] = useState<FixedCostOccurrence | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [actualAmount, setActualAmount] = useState('');
  const [updateScheduleWallet, setUpdateScheduleWallet] = useState(false);
  const [confirming, setConfirming] = useState<'pay' | 'skip' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void fixedCostRepository.getOccurrence(id).then((found) => {
      if (!found) {
        setError('ไม่พบกำหนดจ่ายนี้');
      } else {
        setOccurrence(found);
        setWalletId(found.walletId);
        setActualAmount(((found.actualMinor ?? found.estimatedMinor) / 100).toFixed(2));
      }
      setLoading(false);
    }).catch(() => {
      setError('ไม่สามารถโหลดกำหนดจ่ายได้');
      setLoading(false);
    });
  }, [id]);

  const selectedWallet = useMemo(() => wallets.find((wallet) => wallet.id === walletId) ?? null, [walletId, wallets]);
  const parsedActualMinor = parseMoneyInput(actualAmount);
  const insufficientBalance = Boolean(selectedWallet && parsedActualMinor && selectedWallet.balanceMinor < parsedActualMinor);
  const isOpen = occurrence ? canResolveFixedCostOccurrence(occurrence.status) : false;

  async function pay() {
    if (!occurrence || !selectedWallet) return setError('กรุณาเลือกกระเป๋าที่จะจ่าย');
    if (parsedActualMinor === null || parsedActualMinor <= 0) return setError('กรุณากรอกยอดจ่ายจริงที่มากกว่า 0');
    try {
      setSaving(true);
      setError(null);
      await fixedCostRepository.payOccurrence({
        occurrenceId: occurrence.id,
        walletId: selectedWallet.id,
        actualMinor: parsedActualMinor,
        occurredAt: new Date().toISOString(),
        updateScheduleWallet,
      });
      router.replace('/planning/fixed-costs');
    } catch {
      setError('ยืนยันจ่ายไม่สำเร็จ รายการอาจถูกจัดการไปแล้ว');
      setConfirming(null);
    } finally {
      setSaving(false);
    }
  }

  async function skip() {
    if (!occurrence) return;
    try {
      setSaving(true);
      setError(null);
      await fixedCostRepository.skipOccurrence(occurrence.id);
      router.replace('/planning/fixed-costs');
    } catch {
      setError('ข้ามรายการไม่สำเร็จ รายการอาจถูกจัดการไปแล้ว');
      setConfirming(null);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SafeAreaView edges={['bottom']} style={styles.center}><ActivityIndicator color="#176B48" /></SafeAreaView>;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {occurrence ? (
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>{statusText[occurrence.status]} · {new Date(occurrence.dueAt).toLocaleDateString('th-TH')}</Text>
            <Text style={styles.title}>{occurrence.scheduleName}</Text>
            <Text style={styles.estimate}>ประมาณ {formatMoney(occurrence.estimatedMinor)}</Text>
            <Text style={styles.heroMeta}>{occurrence.categoryName} · {occurrence.walletName}</Text>
          </View>
        ) : null}

        {occurrence && isOpen ? (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>ยอดจ่ายจริง</Text>
              <TextInput accessibilityLabel="ยอดจ่ายจริง" inputMode="decimal" onChangeText={setActualAmount} style={styles.amountInput} value={actualAmount} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>จ่ายจากกระเป๋า</Text>
              <View style={styles.options}>
                {wallets.map((wallet) => (
                  <Pressable accessibilityRole="radio" accessibilityState={{ checked: walletId === wallet.id }} key={wallet.id} onPress={() => { setWalletId(wallet.id); setUpdateScheduleWallet(false); }} style={[styles.chip, walletId === wallet.id && styles.chipActive]}>
                    <Text style={[styles.chipText, walletId === wallet.id && styles.chipTextActive]}>{wallet.name} · {formatMoney(wallet.balanceMinor)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            {walletId !== occurrence.walletId ? (
              <Pressable accessibilityRole="switch" accessibilityState={{ checked: updateScheduleWallet }} onPress={() => setUpdateScheduleWallet((value) => !value)} style={styles.switchRow}>
                <Text style={styles.switchLabel}>ใช้กระเป๋านี้เป็นค่าเริ่มต้นครั้งถัดไป</Text>
                <Text style={styles.switchValue}>{updateScheduleWallet ? 'ใช่' : 'ไม่'}</Text>
              </Pressable>
            ) : null}
            {insufficientBalance ? <Text style={styles.warning}>ยอดในกระเป๋าไม่พอ แต่ยังยืนยันจ่ายได้ ยอดกระเป๋าจะติดลบ</Text> : null}

            {confirming === 'pay' ? (
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>ยืนยันบันทึก Expense?</Text>
                <Text style={styles.confirmText}>ระบบจะหัก {formatMoney(parsedActualMinor ?? 0)} จาก {selectedWallet?.name} และปิดกำหนดจ่ายนี้</Text>
                <View style={styles.actionRow}>
                  <Pressable accessibilityRole="button" onPress={() => setConfirming(null)} style={styles.cancelButton}><Text style={styles.cancelText}>ย้อนกลับ</Text></Pressable>
                  <Pressable accessibilityRole="button" disabled={saving} onPress={() => void pay()} style={styles.payButton}><Text style={styles.payText}>{saving ? 'กำลังบันทึก…' : 'ยืนยันจ่าย'}</Text></Pressable>
                </View>
              </View>
            ) : confirming === 'skip' ? (
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>ข้ามรายการนี้?</Text>
                <Text style={styles.confirmText}>จะไม่สร้าง Expense และจะคืนยอดที่กันไว้ในงบรอบนี้</Text>
                <View style={styles.actionRow}>
                  <Pressable accessibilityRole="button" onPress={() => setConfirming(null)} style={styles.cancelButton}><Text style={styles.cancelText}>ย้อนกลับ</Text></Pressable>
                  <Pressable accessibilityRole="button" disabled={saving} onPress={() => void skip()} style={styles.skipConfirmButton}><Text style={styles.skipConfirmText}>{saving ? 'กำลังบันทึก…' : 'ยืนยันข้าม'}</Text></Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.actionRow}>
                <Pressable accessibilityRole="button" onPress={() => setConfirming('skip')} style={styles.skipButton}><Text style={styles.skipText}>ข้ามครั้งนี้</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => setConfirming('pay')} style={styles.payButton}><Text style={styles.payText}>ยืนยันจ่าย</Text></Pressable>
              </View>
            )}
          </>
        ) : null}

        {occurrence && !isOpen ? (
          <View style={styles.resolvedCard}>
            <Text style={styles.resolvedTitle}>{occurrence.status === 'paid' ? 'จ่ายและสร้าง Expense แล้ว' : 'ข้ามรายการนี้แล้ว'}</Text>
            {occurrence.actualMinor !== null ? <Text style={styles.confirmText}>ยอดจริง {formatMoney(occurrence.actualMinor)}</Text> : null}
          </View>
        ) : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F5EF' },
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, gap: 18 },
  heroCard: { padding: 19, borderRadius: 18, backgroundColor: '#173F2B' },
  heroLabel: { color: '#D5E3DA', fontSize: 13, fontWeight: '700' },
  title: { marginTop: 7, color: '#FFFFFF', fontSize: 25, fontWeight: '800' },
  estimate: { marginTop: 5, color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  heroMeta: { marginTop: 8, color: '#C9D8CE', fontSize: 12 },
  field: { gap: 8 },
  label: { color: '#17211B', fontSize: 15, fontWeight: '700' },
  amountInput: { minHeight: 64, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 14, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 27, fontWeight: '800' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 42, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 999, backgroundColor: '#FFFEF9' },
  chipActive: { borderColor: '#176B48', backgroundColor: '#DCEDDF' },
  chipText: { color: '#66736A', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#176B48' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 14, borderRadius: 13, backgroundColor: '#ECEFE8' },
  switchLabel: { flex: 1, color: '#17211B', fontWeight: '700' },
  switchValue: { color: '#176B48', fontWeight: '800' },
  warning: { padding: 13, borderRadius: 12, color: '#8A4C17', backgroundColor: '#FFF0DC', lineHeight: 19 },
  actionRow: { flexDirection: 'row', gap: 10 },
  skipButton: { flex: 1, minHeight: 49, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#B34B43', borderRadius: 13 },
  skipText: { color: '#A93D38', fontWeight: '800' },
  payButton: { flex: 1, minHeight: 49, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#176B48' },
  payText: { color: '#FFFFFF', fontWeight: '800' },
  confirmCard: { padding: 15, gap: 8, borderWidth: 1, borderColor: '#D9B984', borderRadius: 14, backgroundColor: '#FFF8E9' },
  confirmTitle: { color: '#6E3C13', fontSize: 16, fontWeight: '800' },
  confirmText: { color: '#704C2D', fontSize: 13, lineHeight: 19 },
  cancelButton: { flex: 1, minHeight: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#B8C1B9', borderRadius: 12, backgroundColor: '#FFFFFF' },
  cancelText: { color: '#526158', fontWeight: '700' },
  skipConfirmButton: { flex: 1, minHeight: 45, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#B34B43' },
  skipConfirmText: { color: '#FFFFFF', fontWeight: '800' },
  resolvedCard: { padding: 17, gap: 5, borderRadius: 14, backgroundColor: '#DCEDDF' },
  resolvedTitle: { color: '#176B48', fontSize: 16, fontWeight: '800' },
  error: { color: '#A93D38', lineHeight: 20 },
});
