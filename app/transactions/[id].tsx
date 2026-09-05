import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { transactionRepository } from '@/database/transaction-store';
import type { Transaction } from '@/domain/transactions';
import { formatMoney } from '@/domain/wallets';
import { useExpenseCategories } from '@/features/expense-categories/use-expense-categories';

export default function TransactionCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { categories } = useExpenseCategories();

  useEffect(() => {
    if (!id) return;
    void transactionRepository.getTransaction(id).then((found) => {
      if (!found || found.kind !== 'expense') {
        setError('ไม่พบรายการรายจ่ายนี้');
      } else {
        setTransaction(found);
        setCategoryId(found.categoryId);
      }
      setLoading(false);
    }).catch(() => {
      setError('ไม่สามารถโหลดรายการได้');
      setLoading(false);
    });
  }, [id]);

  async function save() {
    if (!transaction) return;
    try {
      setSaving(true);
      setError(null);
      await transactionRepository.updateExpenseCategory(transaction.id, categoryId);
      router.back();
    } catch {
      setError('บันทึกหมวดไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <SafeAreaView edges={['bottom']} style={styles.center}><ActivityIndicator color="#176B48" /></SafeAreaView>;
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {transaction ? (
          <View style={styles.summaryCard}>
            <Text style={styles.note}>{transaction.note || 'รายจ่าย'}</Text>
            <Text style={styles.amount}>−{formatMoney(transaction.amount.amountMinor)}</Text>
            <Text style={styles.meta}>{transaction.walletName} · {new Date(transaction.occurredAt).toLocaleDateString('th-TH')}</Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.label}>เลือกหมวดรายจ่าย</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/categories')}>
            <Text style={styles.link}>จัดการหมวด</Text>
          </Pressable>
        </View>
        <View style={styles.options}>
          <Pressable accessibilityRole="radio" accessibilityState={{ checked: categoryId === null }} onPress={() => setCategoryId(null)} style={[styles.option, categoryId === null && styles.optionActive]}>
            <Text style={[styles.optionText, categoryId === null && styles.optionTextActive]}>ยังไม่ระบุ</Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: categoryId === category.id }} key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.option, categoryId === category.id && styles.optionActive]}>
              <Text style={[styles.optionText, categoryId === category.id && styles.optionTextActive]}>{category.name}</Text>
            </Pressable>
          ))}
          {transaction?.categoryId && !categories.some((category) => category.id === transaction.categoryId) ? (
            <View style={[styles.option, styles.archivedOption]}>
              <Text style={styles.optionText}>{transaction.categoryName} (เก็บถาวรแล้ว)</Text>
            </View>
          ) : null}
        </View>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {transaction ? (
          <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.saveButton, (pressed || saving) && styles.pressed]}>
            <Text style={styles.saveText}>{saving ? 'กำลังบันทึก…' : 'บันทึกหมวด'}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F5EF' },
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, gap: 18 },
  summaryCard: { padding: 18, borderRadius: 18, backgroundColor: '#173F2B' },
  note: { color: '#C9D8CE', fontSize: 15 },
  amount: { marginTop: 5, color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  meta: { marginTop: 7, color: '#C9D8CE', fontSize: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: '#17211B', fontSize: 16, fontWeight: '800' },
  link: { color: '#176B48', fontSize: 13, fontWeight: '700' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { minHeight: 42, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 999, backgroundColor: '#FFFEF9' },
  optionActive: { borderColor: '#B86B25', backgroundColor: '#FFF0DC' },
  archivedOption: { opacity: 0.55 },
  optionText: { color: '#66736A', fontWeight: '600' },
  optionTextActive: { color: '#7E4517' },
  saveButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#176B48' },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  error: { color: '#A93D38' },
  pressed: { opacity: 0.7 },
});
