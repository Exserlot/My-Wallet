import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { expenseCategoryRepository } from '@/database/expense-category-store';
import { isValidExpenseCategoryName } from '@/domain/expense-categories';

export default function NewCategoryScreen() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!isValidExpenseCategoryName(name)) {
      setError('กรุณากรอกชื่อหมวด 1–40 ตัวอักษร');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await expenseCategoryRepository.createCategory(name);
      router.back();
    } catch (caught) {
      setError(caught instanceof Error && caught.message.includes('already exists') ? 'มีชื่อหมวดนี้แล้ว' : 'สร้างหมวดไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <Text style={styles.label}>ชื่อหมวดรายจ่าย</Text>
        <TextInput accessibilityLabel="ชื่อหมวดรายจ่าย" autoFocus maxLength={40} onChangeText={setName} onSubmitEditing={() => void submit()} placeholder="เช่น อาหาร" placeholderTextColor="#8A948C" style={styles.input} value={name} />
        <Text style={styles.hint}>หมวดนี้ใช้กับรายจ่ายเท่านั้น</Text>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => void submit()} style={({ pressed }) => [styles.saveButton, (pressed || saving) && styles.pressed]}>
          <Text style={styles.saveText}>{saving ? 'กำลังบันทึก…' : 'สร้างหมวด'}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, gap: 10 },
  label: { color: '#17211B', fontSize: 15, fontWeight: '700' },
  input: { minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 13, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 16 },
  hint: { color: '#66736A', fontSize: 12 },
  error: { color: '#A93D38' },
  saveButton: { minHeight: 50, marginTop: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#176B48' },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
