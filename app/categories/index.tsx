import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { expenseCategoryRepository } from '@/database/expense-category-store';
import { useExpenseCategories } from '@/features/expense-categories/use-expense-categories';

export default function CategoryListScreen() {
  const { categories, loading, error, refresh } = useExpenseCategories(true);

  function confirmArchive(id: string, name: string) {
    Alert.alert(
      'เก็บหมวดไว้ในรายการย้อนหลัง?',
      `หมวด “${name}” จะไม่แสดงตอนเพิ่มรายจ่ายใหม่ แต่รายการเก่ายังเห็นชื่อหมวดนี้`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'เก็บถาวร',
          style: 'destructive',
          onPress: () => void expenseCategoryRepository.archiveCategory(id).then(refresh),
        },
      ],
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/categories/new')} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ สร้างหมวดรายจ่าย</Text>
        </Pressable>

        {loading ? <Text style={styles.muted}>กำลังโหลด…</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && categories.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>ยังไม่มีหมวดรายจ่าย</Text>
            <Text style={styles.muted}>สร้างเฉพาะหมวดที่คุณใช้จริง เช่น อาหาร หรือ เดินทาง</Text>
          </View>
        ) : null}

        {categories.map((category) => (
          <View key={category.id} style={[styles.categoryCard, category.archivedAt && styles.archivedCard]}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.muted}>{category.archivedAt ? 'เก็บถาวรแล้ว · ยังแสดงในรายการเก่า' : 'พร้อมเลือกกับรายจ่าย'}</Text>
            </View>
            {!category.archivedAt ? (
              <Pressable accessibilityRole="button" onPress={() => confirmArchive(category.id, category.name)} style={styles.archiveButton}>
                <Text style={styles.archiveText}>เก็บถาวร</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, gap: 12 },
  addButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#176B48' },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  categoryCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 15, backgroundColor: '#FFFEF9' },
  archivedCard: { opacity: 0.62 },
  categoryInfo: { flex: 1 },
  categoryName: { color: '#17211B', fontSize: 16, fontWeight: '700' },
  archiveButton: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FAE3E0' },
  archiveText: { color: '#A93D38', fontSize: 12, fontWeight: '700' },
  emptyCard: { padding: 22, alignItems: 'center', gap: 5, borderWidth: 1, borderStyle: 'dashed', borderColor: '#B8C1B9', borderRadius: 16 },
  emptyTitle: { color: '#17211B', fontWeight: '700' },
  muted: { color: '#66736A', fontSize: 12 },
  error: { color: '#A93D38' },
});
