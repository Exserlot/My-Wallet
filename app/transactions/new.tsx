import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { transactionRepository } from '@/database/transaction-store';
import type { CashFlowKind } from '@/domain/transactions';
import { parseMoneyInput } from '@/domain/wallets';
import { useExpenseCategories } from '@/features/expense-categories/use-expense-categories';
import { useWallets } from '@/features/wallets/use-wallets';

export default function NewTransactionScreen() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const initialKind: CashFlowKind = params.kind === 'income' ? 'income' : 'expense';
  const [kind, setKind] = useState<CashFlowKind>(initialKind);
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { wallets, loading } = useWallets();
  const { categories, loading: categoriesLoading } = useExpenseCategories();

  const selectedWalletId = useMemo(() => {
    if (walletId && wallets.some((wallet) => wallet.id === walletId)) return walletId;
    return wallets[0]?.id ?? null;
  }, [walletId, wallets]);

  async function submit() {
    const amountMinor = parseMoneyInput(amount);
    if (amountMinor === null || amountMinor <= 0) {
      setError('กรุณากรอกจำนวนเงินที่มากกว่า 0 และมีทศนิยมไม่เกิน 2 ตำแหน่ง');
      return;
    }
    if (!selectedWalletId) {
      setError('กรุณาสร้างและเลือกกระเป๋าก่อน');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await transactionRepository.createTransaction({
        walletId: selectedWalletId,
        kind,
        amountMinor,
        categoryId: kind === 'expense' ? categoryId : null,
        note: note || null,
        occurredAt: new Date().toISOString(),
      });
      router.replace('/transactions');
    } catch {
      setError('บันทึกรายการไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.kindRow}>
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: kind === 'expense' }} onPress={() => setKind('expense')} style={[styles.kindButton, kind === 'expense' && styles.expenseActive]}>
              <Text style={[styles.kindText, kind === 'expense' && styles.activeText]}>รายจ่าย</Text>
            </Pressable>
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: kind === 'income' }} onPress={() => setKind('income')} style={[styles.kindButton, kind === 'income' && styles.incomeActive]}>
              <Text style={[styles.kindText, kind === 'income' && styles.activeText]}>รายรับ</Text>
            </Pressable>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>จำนวนเงิน</Text>
            <TextInput accessibilityLabel="จำนวนเงิน" autoFocus inputMode="decimal" onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#8A948C" style={styles.amountInput} value={amount} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>กระเป๋า</Text>
            {loading ? <Text style={styles.hint}>กำลังโหลด…</Text> : null}
            {!loading && wallets.length === 0 ? (
              <Pressable accessibilityRole="button" onPress={() => router.push('/wallets/new')} style={styles.emptyWallet}>
                <Text style={styles.emptyWalletText}>ยังไม่มีกระเป๋า · กดเพื่อสร้าง</Text>
              </Pressable>
            ) : null}
            <View style={styles.walletOptions}>
              {wallets.map((wallet) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedWalletId === wallet.id }}
                  key={wallet.id}
                  onPress={() => setWalletId(wallet.id)}
                  style={[styles.walletButton, selectedWalletId === wallet.id && styles.walletActive]}
                >
                  <Text style={[styles.walletText, selectedWalletId === wallet.id && styles.walletTextActive]}>{wallet.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {kind === 'expense' ? (
            <View style={styles.fieldGroup}>
              <View style={styles.categoryHeader}>
                <Text style={styles.label}>หมวดรายจ่าย</Text>
                <Pressable accessibilityRole="button" onPress={() => router.push('/categories')}>
                  <Text style={styles.categoryLink}>จัดการหมวด</Text>
                </Pressable>
              </View>
              {categoriesLoading ? <Text style={styles.hint}>กำลังโหลด…</Text> : null}
              <View style={styles.walletOptions}>
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: categoryId === null }} onPress={() => setCategoryId(null)} style={[styles.walletButton, categoryId === null && styles.categoryActive]}>
                  <Text style={[styles.walletText, categoryId === null && styles.categoryTextActive]}>ยังไม่ระบุ</Text>
                </Pressable>
                {categories.map((category) => (
                  <Pressable accessibilityRole="radio" accessibilityState={{ checked: categoryId === category.id }} key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.walletButton, categoryId === category.id && styles.categoryActive]}>
                    <Text style={[styles.walletText, categoryId === category.id && styles.categoryTextActive]}>{category.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>รายละเอียด (ไม่บังคับ)</Text>
            <TextInput accessibilityLabel="รายละเอียด" maxLength={120} onChangeText={setNote} placeholder={kind === 'expense' ? 'เช่น ค่าอาหารกลางวัน' : 'เช่น เงินเดือน'} placeholderTextColor="#8A948C" style={styles.input} value={note} />
          </View>

          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

          <Pressable accessibilityRole="button" disabled={saving} onPress={() => void submit()} style={({ pressed }) => [styles.saveButton, kind === 'income' ? styles.incomeSave : styles.expenseSave, (pressed || saving) && styles.pressed]}>
            <Text style={styles.saveText}>{saving ? 'กำลังบันทึก…' : `บันทึก${kind === 'income' ? 'รายรับ' : 'รายจ่าย'}`}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, gap: 20 },
  kindRow: { flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: '#E5E9E3' },
  kindButton: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  expenseActive: { backgroundColor: '#B34B43' },
  incomeActive: { backgroundColor: '#176B48' },
  kindText: { color: '#66736A', fontWeight: '700' },
  activeText: { color: '#FFFFFF' },
  fieldGroup: { gap: 8 },
  label: { color: '#17211B', fontSize: 15, fontWeight: '700' },
  amountInput: { minHeight: 68, paddingHorizontal: 15, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 15, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 30, fontWeight: '800' },
  input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 13, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 16 },
  walletOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  walletButton: { minHeight: 42, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 999, backgroundColor: '#FFFEF9' },
  walletActive: { borderColor: '#176B48', backgroundColor: '#DCEDDF' },
  walletText: { color: '#66736A', fontWeight: '600' },
  walletTextActive: { color: '#176B48' },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryLink: { color: '#176B48', fontSize: 13, fontWeight: '700' },
  categoryActive: { borderColor: '#B86B25', backgroundColor: '#FFF0DC' },
  categoryTextActive: { color: '#7E4517' },
  emptyWallet: { padding: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#176B48', borderRadius: 13 },
  emptyWalletText: { color: '#176B48', textAlign: 'center', fontWeight: '700' },
  hint: { color: '#66736A' },
  error: { color: '#A93D38', lineHeight: 20 },
  saveButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  expenseSave: { backgroundColor: '#B34B43' },
  incomeSave: { backgroundColor: '#176B48' },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
