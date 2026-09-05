import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const overviewItems = [
  { label: 'งบเดือนนี้', value: 'ยังไม่ได้กำหนด' },
  { label: 'รายจ่ายเดือนนี้', value: '฿0.00' },
  { label: 'เงินคงเหลือ', value: '฿0.00' },
];

const quickActions = ['เพิ่มรายรับ', 'เพิ่มรายจ่าย', 'นำเข้าสลิป', 'จัดการกระเป๋า'];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>กันยายน 2569</Text>
            <Text style={styles.title}>ภาพรวมการเงิน</Text>
          </View>
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>พร้อมใช้ Offline</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          {overviewItems.map((item) => (
            <View key={item.label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>ทำรายการ</Text>
        <View style={styles.actionGrid}>
          {quickActions.map((action) => (
            <Pressable
              accessibilityRole="button"
              key={action}
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
            >
              <Text style={styles.actionText}>{action}</Text>
              <Text style={styles.actionHint}>เร็ว ๆ นี้</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>ฐานแอปพร้อมแล้ว</Text>
          <Text style={styles.noteText}>
            หน้านี้เป็นโครงชั่วคราวสำหรับเชื่อม Budget, Wallet, Expense และการนำเข้าสลิป ไม่ใช่ดีไซน์สุดท้าย
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  eyebrow: { color: '#66736A', fontSize: 14 },
  title: { color: '#17211B', fontSize: 30, fontWeight: '800' },
  offlineBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#DCEDDF' },
  offlineText: { color: '#176B48', fontSize: 12, fontWeight: '700' },
  summaryCard: { padding: 18, gap: 14, borderRadius: 20, backgroundColor: '#173F2B' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  summaryLabel: { color: '#C9D8CE', fontSize: 15 },
  summaryValue: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  sectionTitle: { color: '#17211B', fontSize: 19, fontWeight: '800' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionButton: { width: '48%', minWidth: 150, flexGrow: 1, padding: 16, borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 16, backgroundColor: '#FFFEF9' },
  actionPressed: { opacity: 0.7 },
  actionText: { color: '#17211B', fontSize: 16, fontWeight: '700' },
  actionHint: { marginTop: 5, color: '#7A857D', fontSize: 12 },
  noteCard: { padding: 16, borderLeftWidth: 4, borderLeftColor: '#B86B25', borderRadius: 12, backgroundColor: '#FFF0DC' },
  noteTitle: { color: '#6E3C13', fontWeight: '800' },
  noteText: { marginTop: 5, color: '#704C2D', lineHeight: 21 },
});

