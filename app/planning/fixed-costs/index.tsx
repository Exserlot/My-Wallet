import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fixedCostRepository } from '@/database/fixed-cost-store';
import { frequencyLabel, type FixedCostOccurrenceStatus } from '@/domain/fixed-costs';
import { formatMoney } from '@/domain/wallets';
import { useFixedCosts } from '@/features/fixed-costs/use-fixed-costs';

const statusText: Record<FixedCostOccurrenceStatus, string> = {
  upcoming: 'กำลังจะถึง',
  due: 'ครบกำหนดวันนี้',
  overdue: 'เกินกำหนด',
  paid: 'จ่ายแล้ว',
  skipped: 'ข้ามแล้ว',
};

export default function FixedCostListScreen() {
  const { schedules, occurrences, loading, error, refresh } = useFixedCosts(true);

  function confirmArchive(id: string, name: string) {
    Alert.alert(
      'Archive Fixed Cost?',
      `“${name}” จะหยุดสร้างกำหนดจ่ายใหม่ แต่ประวัติเดิมยังอยู่`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'Archive', style: 'destructive', onPress: () => void fixedCostRepository.archiveSchedule(id).then(refresh) },
      ],
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/planning/fixed-costs/new')} style={styles.addButton}>
          <Text style={styles.addText}>+ เพิ่ม Fixed Cost</Text>
        </Pressable>

        {loading ? <Text style={styles.muted}>กำลังโหลด…</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.sectionTitle}>กำหนดจ่าย 4 เดือนนี้</Text>
        {!loading && occurrences.length === 0 ? <Text style={styles.empty}>ยังไม่มีกำหนดจ่าย</Text> : null}
        {occurrences.map((occurrence) => (
          <Pressable
            accessibilityRole="button"
            key={occurrence.id}
            onPress={() => router.push({ pathname: '/planning/fixed-costs/[id]', params: { id: occurrence.id } })}
            style={({ pressed }) => [styles.occurrenceCard, occurrence.status === 'overdue' && styles.overdueCard, pressed && styles.pressed]}
          >
            <View style={styles.flex}>
              <Text style={styles.itemName}>{occurrence.scheduleName}</Text>
              <Text style={styles.meta}>{occurrence.categoryName} · {occurrence.walletName}</Text>
              <Text style={[styles.status, occurrence.status === 'overdue' && styles.danger]}>
                {statusText[occurrence.status]} · {new Date(occurrence.dueAt).toLocaleDateString('th-TH')}
              </Text>
            </View>
            <Text style={styles.amount}>{formatMoney(occurrence.estimatedMinor)}</Text>
          </Pressable>
        ))}

        <Text style={styles.sectionTitle}>กฎ Fixed Cost</Text>
        {!loading && schedules.length === 0 ? <Text style={styles.empty}>สร้างรายการประจำ เช่น ค่าเช่า ค่าเน็ต หรือประกัน</Text> : null}
        {schedules.map((schedule) => (
          <View key={schedule.id} style={[styles.scheduleCard, schedule.archivedAt && styles.archived]}>
            <View style={styles.flex}>
              <Text style={styles.itemName}>{schedule.name}</Text>
              <Text style={styles.meta}>{frequencyLabel(schedule.frequency, schedule.intervalMonths)} · วันที่ {schedule.dueDay} · {schedule.walletName}</Text>
              <Text style={styles.meta}>{schedule.categoryName} · ประมาณ {formatMoney(schedule.estimatedMinor)}</Text>
              {schedule.archivedAt ? <Text style={styles.archivedText}>Archive แล้ว</Text> : null}
            </View>
            {!schedule.archivedAt ? (
              <Pressable accessibilityRole="button" onPress={() => confirmArchive(schedule.id, schedule.name)} style={styles.archiveButton}>
                <Text style={styles.archiveText}>Archive</Text>
              </Pressable>
            ) : null}
          </View>
        ))}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>กำหนดจ่ายยังไม่หักเงินจริง</Text>
          <Text style={styles.muted}>เปิดแต่ละรายการเพื่อยืนยันจ่ายหรือข้าม ระบบจะหัก Wallet และสร้าง Expense เฉพาะเมื่อยืนยันจ่าย</Text>
        </View>
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
  sectionTitle: { marginTop: 6, color: '#17211B', fontSize: 18, fontWeight: '800' },
  occurrenceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 15, backgroundColor: '#FFFEF9' },
  overdueCard: { borderColor: '#D88B84', backgroundColor: '#FFF5F3' },
  scheduleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 15, backgroundColor: '#FFFEF9' },
  itemName: { color: '#17211B', fontSize: 16, fontWeight: '700' },
  meta: { marginTop: 3, color: '#66736A', fontSize: 12 },
  status: { marginTop: 6, color: '#B86B25', fontSize: 12, fontWeight: '700' },
  danger: { color: '#A93D38' },
  amount: { color: '#17211B', fontWeight: '800' },
  archiveButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FAE3E0' },
  archiveText: { color: '#A93D38', fontSize: 12, fontWeight: '700' },
  archived: { opacity: 0.58 },
  archivedText: { marginTop: 5, color: '#66736A', fontSize: 11, fontWeight: '700' },
  empty: { padding: 16, color: '#66736A', textAlign: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#B8C1B9', borderRadius: 14 },
  noteCard: { marginTop: 6, padding: 15, borderRadius: 13, backgroundColor: '#FFF0DC' },
  noteTitle: { color: '#704C2D', fontWeight: '800' },
  muted: { color: '#66736A', fontSize: 12, lineHeight: 18 },
  error: { color: '#A93D38' },
  pressed: { opacity: 0.7 },
});
