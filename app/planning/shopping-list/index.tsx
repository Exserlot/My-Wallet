import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { plannedPurchaseRepository } from '@/database/planned-purchase-store';
import { estimatedPurchaseTotalMinor, priorityLabel } from '@/domain/planned-purchases';
import { formatMoney } from '@/domain/wallets';
import { usePlannedPurchases } from '@/features/planned-purchases/use-planned-purchases';

export default function ShoppingListScreen() {
  const { items, loading, error, refresh } = usePlannedPurchases(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const activeItems = items.filter((item) => item.status === 'active');
  const purchasedItems = items.filter((item) => item.status === 'purchased');
  const selectedItems = activeItems.filter((item) => selectedIds.includes(item.id));
  const knownEstimateMinor = selectedItems.reduce((sum, item) => sum + (estimatedPurchaseTotalMinor(item) ?? 0), 0);
  const hasUnknownEstimate = selectedItems.some((item) => item.estimatedUnitMinor === null);

  function toggle(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]);
  }

  function archive(id: string, name: string) {
    Alert.alert('นำออกจากรายการ?', `“${name}” จะถูกเก็บถาวรและไม่แสดงในรายการหลัก`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'เก็บถาวร', style: 'destructive', onPress: () => void plannedPurchaseRepository.archive(id).then(() => { setSelectedIds((current) => current.filter((itemId) => itemId !== id)); return refresh(); }) },
    ]);
  }

  function checkout() {
    router.push({ pathname: '/planning/shopping-list/checkout', params: { ids: selectedIds.join(',') } });
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/planning/shopping-list/new')} style={styles.addButton}>
          <Text style={styles.addText}>+ เพิ่มของที่อยากได้</Text>
        </Pressable>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>รายการนี้ไม่หักงบ</Text>
          <Text style={styles.muted}>ราคาประมาณใช้ช่วยตัดสินใจเท่านั้น งบและ Wallet จะเปลี่ยนเมื่อคุณยืนยันว่าซื้อแล้ว</Text>
        </View>

        {loading ? <Text style={styles.muted}>กำลังโหลด…</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && activeItems.length === 0 ? (
          <Text style={styles.empty}>{purchasedItems.length > 0 ? 'ตอนนี้ไม่มีรายการที่รอซื้อ' : 'ยังไม่มีของที่อยากได้ กดปุ่มด้านบนเพื่อเพิ่มรายการแรก'}</Text>
        ) : null}

        {activeItems.map((item) => {
          const selected = selectedIds.includes(item.id);
          const estimatedTotal = estimatedPurchaseTotalMinor(item);
          return (
            <View key={item.id} style={[styles.itemCard, selected && styles.itemSelected]}>
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => toggle(item.id)} style={styles.itemMain}>
                <View style={[styles.checkbox, selected && styles.checkboxActive]}><Text style={styles.checkmark}>{selected ? '✓' : ''}</Text></View>
                <View style={styles.flex}>
                  <Text style={styles.itemName}>{item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ''}</Text>
                  <Text style={styles.meta}>{priorityLabel(item.priority)}{item.categoryName ? ` · ${item.categoryName}` : ''}{item.merchant ? ` · ${item.merchant}` : ''}</Text>
                </View>
                <Text style={styles.amount}>{estimatedTotal === null ? 'ยังไม่ใส่ราคา' : formatMoney(estimatedTotal)}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => archive(item.id, item.name)} style={styles.archiveButton}><Text style={styles.archiveText}>เก็บถาวร</Text></Pressable>
            </View>
          );
        })}

        {selectedItems.length > 0 ? (
          <View style={styles.checkoutCard}>
            <View style={styles.flex}>
              <Text style={styles.checkoutTitle}>เลือก {selectedItems.length} รายการ</Text>
              <Text style={styles.muted}>รวมราคาประมาณ {formatMoney(knownEstimateMinor)}{hasUnknownEstimate ? ' + รายการที่ยังไม่ใส่ราคา' : ''}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={checkout} style={styles.checkoutButton}><Text style={styles.checkoutText}>ซื้อรายการที่เลือก</Text></Pressable>
          </View>
        ) : null}

        {purchasedItems.length > 0 ? <Text style={styles.sectionTitle}>ซื้อแล้ว</Text> : null}
        {purchasedItems.map((item) => (
          <View key={item.id} style={styles.purchasedCard}>
            <Text style={styles.purchasedName}>✓ {item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ''}</Text>
            <Text style={styles.muted}>{item.purchasedAt ? new Date(item.purchasedAt).toLocaleDateString('th-TH') : ''}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, gap: 12 },
  addButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#176B48' },
  addText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  noteCard: { padding: 15, gap: 4, borderRadius: 14, backgroundColor: '#FFF0DC' },
  noteTitle: { color: '#704C2D', fontWeight: '800' },
  itemCard: { overflow: 'hidden', borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 15, backgroundColor: '#FFFEF9' },
  itemSelected: { borderColor: '#176B48', backgroundColor: '#F4FBF6' },
  itemMain: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14 },
  checkbox: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#B8C1B9', borderRadius: 7 },
  checkboxActive: { borderColor: '#176B48', backgroundColor: '#176B48' },
  checkmark: { color: '#FFFFFF', fontWeight: '900' },
  itemName: { color: '#17211B', fontSize: 16, fontWeight: '800' },
  meta: { marginTop: 4, color: '#66736A', fontSize: 12 },
  amount: { maxWidth: 120, color: '#526158', fontSize: 12, fontWeight: '700', textAlign: 'right' },
  archiveButton: { alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 8 },
  archiveText: { color: '#A93D38', fontSize: 12, fontWeight: '700' },
  checkoutCard: { marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: 15, backgroundColor: '#173F2B' },
  checkoutTitle: { color: '#FFFFFF', fontWeight: '800' },
  checkoutButton: { minHeight: 42, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#FFFFFF' },
  checkoutText: { color: '#176B48', fontWeight: '800' },
  sectionTitle: { marginTop: 8, color: '#17211B', fontSize: 18, fontWeight: '800' },
  purchasedCard: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, padding: 13, borderRadius: 13, backgroundColor: '#E7ECE6' },
  purchasedName: { flex: 1, color: '#526158', fontWeight: '700' },
  muted: { color: '#66736A', fontSize: 12, lineHeight: 18 },
  error: { color: '#A93D38' },
  empty: { padding: 18, color: '#66736A', textAlign: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#B8C1B9', borderRadius: 14 },
});
