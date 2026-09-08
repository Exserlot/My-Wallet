import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { transactionRepository } from '@/database/transaction-store';
import { localDateInput, occurredAtFromLocalDateInput, type CashFlowKind, type Transaction } from '@/domain/transactions';
import { parseMoneyInput } from '@/domain/wallets';
import { useExpenseCategories } from '@/features/expense-categories/use-expense-categories';
import { useWallets } from '@/features/wallets/use-wallets';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [kind, setKind] = useState<CashFlowKind>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { wallets } = useWallets();
  const { categories } = useExpenseCategories();

  useEffect(() => {
    if (!id) return;
    void transactionRepository.getTransaction(id).then((found) => {
      if (!found || found.kind === 'opening-balance') {
        setError('ไม่พบรายการรายรับหรือรายจ่ายนี้');
      } else {
        setTransaction(found);
        setKind(found.kind);
        setAmount((found.amount.amountMinor / 100).toFixed(2));
        setWalletId(found.walletId);
        setCategoryId(found.categoryId);
        setDate(localDateInput(found.occurredAt));
        setNote(found.note ?? '');
      }
      setLoading(false);
    }).catch(() => {
      setError('ไม่สามารถโหลดรายการได้');
      setLoading(false);
    });
  }, [id]);

  const selectedWalletId = useMemo(() => {
    if (walletId && wallets.some((wallet) => wallet.id === walletId)) return walletId;
    return wallets[0]?.id ?? null;
  }, [walletId, wallets]);

  async function save() {
    if (!transaction) return;
    const amountMinor = parseMoneyInput(amount);
    if (amountMinor === null || amountMinor <= 0) {
      setError('กรุณากรอกจำนวนเงินที่มากกว่า 0 และมีทศนิยมไม่เกิน 2 ตำแหน่ง');
      return;
    }
    const occurredAt = occurredAtFromLocalDateInput(date, transaction.occurredAt);
    if (!occurredAt) {
      setError('กรุณากรอกวันที่จริงในรูปแบบ YYYY-MM-DD เช่น 2026-09-08');
      return;
    }
    if (!selectedWalletId) {
      setError('กรุณาเลือกกระเป๋า');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await transactionRepository.updateTransaction(transaction.id, {
        walletId: selectedWalletId,
        kind,
        amountMinor,
        categoryId: kind === 'expense' ? categoryId : null,
        note: note || null,
        occurredAt,
      });
      router.back();
    } catch {
      setError('บันทึกการแก้ไขไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  function deleteCurrentTransaction() {
    if (!transaction || transaction.kindLocked) return;
    setSaving(true);
    setError(null);
    void transactionRepository.deleteTransaction(transaction.id).then(() => {
      router.replace('/transactions');
    }).catch(() => {
      setError('ลบรายการไม่สำเร็จ กรุณาลองใหม่');
      setSaving(false);
    });
  }

  function confirmDelete() {
    if (!transaction || transaction.kindLocked) return;
    if (Platform.OS === 'web') {
      if (window.confirm('ลบรายการนี้?\nยอดของกระเป๋าและสรุปรายเดือนจะถูกคำนวณใหม่ การลบไม่สามารถย้อนกลับได้')) {
        deleteCurrentTransaction();
      }
      return;
    }
    Alert.alert(
      'ลบรายการนี้?',
      'ยอดของกระเป๋าและสรุปรายเดือนจะถูกคำนวณใหม่ การลบไม่สามารถย้อนกลับได้',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบรายการ',
          style: 'destructive',
          onPress: deleteCurrentTransaction,
        },
      ],
    );
  }

  if (loading) {
    return <SafeAreaView edges={['bottom']} style={styles.center}><ActivityIndicator color="#176B48" /></SafeAreaView>;
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {transaction ? (
            <>
              <View style={styles.kindRow}>
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: kind === 'expense', disabled: transaction.kindLocked }} disabled={transaction.kindLocked} onPress={() => setKind('expense')} style={[styles.kindButton, kind === 'expense' && styles.expenseActive, transaction.kindLocked && styles.kindDisabled]}>
                  <Text style={[styles.kindText, kind === 'expense' && styles.activeText]}>รายจ่าย</Text>
                </Pressable>
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: kind === 'income', disabled: transaction.kindLocked }} disabled={transaction.kindLocked} onPress={() => setKind('income')} style={[styles.kindButton, kind === 'income' && styles.incomeActive, transaction.kindLocked && styles.kindDisabled]}>
                  <Text style={[styles.kindText, kind === 'income' && styles.activeText]}>รายรับ</Text>
                </Pressable>
              </View>
              {transaction.kindLocked ? <Text style={styles.hint}>รายการนี้เชื่อมกับสลิป, Fixed Cost หรือของที่ซื้อ จึงเปลี่ยนชนิดรายรับ–รายจ่ายไม่ได้</Text> : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>จำนวนเงิน</Text>
                <TextInput accessibilityLabel="จำนวนเงิน" inputMode="decimal" onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#8A948C" style={styles.amountInput} value={amount} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>กระเป๋า</Text>
                <View style={styles.options}>
                  {wallets.map((wallet) => (
                    <Pressable accessibilityRole="radio" accessibilityState={{ checked: selectedWalletId === wallet.id }} key={wallet.id} onPress={() => setWalletId(wallet.id)} style={[styles.option, selectedWalletId === wallet.id && styles.walletActive]}>
                      <Text style={[styles.optionText, selectedWalletId === wallet.id && styles.walletTextActive]}>{wallet.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {kind === 'expense' ? (
                <View style={styles.fieldGroup}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.label}>หมวดรายจ่าย</Text>
                    <Pressable accessibilityRole="button" onPress={() => router.push('/categories')}><Text style={styles.link}>จัดการหมวด</Text></Pressable>
                  </View>
                  <View style={styles.options}>
                    <Pressable accessibilityRole="radio" accessibilityState={{ checked: categoryId === null }} onPress={() => setCategoryId(null)} style={[styles.option, categoryId === null && styles.categoryActive]}>
                      <Text style={[styles.optionText, categoryId === null && styles.categoryTextActive]}>ยังไม่ระบุ</Text>
                    </Pressable>
                    {categories.map((category) => (
                      <Pressable accessibilityRole="radio" accessibilityState={{ checked: categoryId === category.id }} key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.option, categoryId === category.id && styles.categoryActive]}>
                        <Text style={[styles.optionText, categoryId === category.id && styles.categoryTextActive]}>{category.name}</Text>
                      </Pressable>
                    ))}
                    {transaction.categoryId && !categories.some((category) => category.id === transaction.categoryId) ? (
                      <View style={[styles.option, styles.archivedOption]}><Text style={styles.optionText}>{transaction.categoryName} (เก็บถาวรแล้ว)</Text></View>
                    ) : null}
                  </View>
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>วันที่</Text>
                <TextInput accessibilityLabel="วันที่" autoCapitalize="none" inputMode="numeric" maxLength={10} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor="#8A948C" style={styles.input} value={date} />
                <Text style={styles.hint}>ตัวอย่าง: 2026-09-08</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>รายละเอียด (ไม่บังคับ)</Text>
                <TextInput accessibilityLabel="รายละเอียด" maxLength={120} onChangeText={setNote} placeholder="รายละเอียดรายการ" placeholderTextColor="#8A948C" style={styles.input} value={note} />
              </View>

              {transaction.source === 'bank-slip' ? <Text style={styles.sourceHint}>รายการนี้นำเข้าจากสลิป คุณแก้ข้อมูลที่อ่านคลาดเคลื่อนได้</Text> : null}
            </>
          ) : null}

          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {transaction ? (
            <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.saveButton, kind === 'income' ? styles.incomeSave : styles.expenseSave, (pressed || saving) && styles.pressed]}>
              <Text style={styles.saveText}>{saving ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}</Text>
            </Pressable>
          ) : null}
          {transaction && !transaction.kindLocked ? (
            <Pressable accessibilityRole="button" disabled={saving} onPress={confirmDelete} style={({ pressed }) => [styles.deleteButton, (pressed || saving) && styles.pressed]}>
              <Text style={styles.deleteText}>ลบรายการนี้</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F5EF' },
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, gap: 20 },
  kindRow: { flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: '#E5E9E3' },
  kindButton: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  expenseActive: { backgroundColor: '#B34B43' },
  incomeActive: { backgroundColor: '#176B48' },
  kindText: { color: '#66736A', fontWeight: '700' },
  activeText: { color: '#FFFFFF' },
  kindDisabled: { opacity: 0.65 },
  fieldGroup: { gap: 8 },
  label: { color: '#17211B', fontSize: 15, fontWeight: '700' },
  amountInput: { minHeight: 68, paddingHorizontal: 15, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 15, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 30, fontWeight: '800' },
  input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 13, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { color: '#176B48', fontSize: 13, fontWeight: '700' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { minHeight: 42, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 999, backgroundColor: '#FFFEF9' },
  optionText: { color: '#66736A', fontWeight: '600' },
  walletActive: { borderColor: '#176B48', backgroundColor: '#DCEDDF' },
  walletTextActive: { color: '#176B48' },
  categoryActive: { borderColor: '#B86B25', backgroundColor: '#FFF0DC' },
  categoryTextActive: { color: '#7E4517' },
  archivedOption: { opacity: 0.55 },
  hint: { color: '#66736A', fontSize: 12 },
  sourceHint: { padding: 12, borderRadius: 12, color: '#5C4A25', backgroundColor: '#FFF0DC', lineHeight: 20 },
  error: { color: '#A93D38', lineHeight: 20 },
  saveButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  expenseSave: { backgroundColor: '#B34B43' },
  incomeSave: { backgroundColor: '#176B48' },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  deleteButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C85A52', borderRadius: 14, backgroundColor: '#FFF8F7' },
  deleteText: { color: '#A93D38', fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
