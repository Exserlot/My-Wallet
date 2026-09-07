import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NotificationPreferences } from '@/domain/preferences';
import { useNotificationPreferences } from '@/features/preferences/use-notification-preferences';
import { localNotificationService, type NotificationPermissionState } from '@/services/local-notification-service';

function SettingSwitch({ label, description, value, onChange }: Readonly<{ label: string; description: string; value: boolean; onChange(value: boolean): void }>) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={styles.settingRow}>
      <View style={styles.settingBody}><Text style={styles.settingTitle}>{label}</Text><Text style={styles.settingDescription}>{description}</Text></View>
      <View style={[styles.switchPill, value && styles.switchPillOn]}><Text style={[styles.switchText, value && styles.switchTextOn]}>{value ? 'เปิด' : 'ปิด'}</Text></View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { preferences, loading, error, save } = useNotificationPreferences();
  const [permission, setPermission] = useState<NotificationPermissionState>('unsupported');
  const [hour, setHour] = useState<string | null>(null);
  const [minute, setMinute] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => { void localNotificationService.getPermissionState().then(setPermission); }, []);
  const displayedHour = hour ?? String(preferences.reminderHour).padStart(2, '0');
  const displayedMinute = minute ?? String(preferences.reminderMinute).padStart(2, '0');

  function update(patch: Partial<NotificationPreferences>) {
    const next = { ...preferences, ...patch };
    void save(next);
    if ((!next.enabled || !next.fixedCostEnabled)) void localNotificationService.syncFixedCostReminders([], [], next);
  }

  function saveTime() {
    const nextHour = Number(displayedHour);
    const nextMinute = Number(displayedMinute);
    if (!Number.isInteger(nextHour) || nextHour < 0 || nextHour > 23 || !Number.isInteger(nextMinute) || nextMinute < 0 || nextMinute > 59) {
      setTimeError('เวลาไม่ถูกต้อง ชั่วโมง 00–23 และนาที 00–59');
      return;
    }
    setTimeError(null);
    update({ reminderHour: nextHour, reminderMinute: nextMinute });
    setHour(null);
    setMinute(null);
  }

  async function requestPermission() {
    setPermission(await localNotificationService.requestPermission());
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View><Text style={styles.title}>การแจ้งเตือนในเครื่อง</Text><Text style={styles.intro}>ไม่ใช้ server และไม่ส่งข้อมูลการเงินออกจากอุปกรณ์</Text></View>
        {loading ? <Text style={styles.muted}>กำลังโหลด…</Text> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

        <SettingSwitch label="การแจ้งเตือนทั้งหมด" description="สวิตช์หลักสำหรับ Android notification" value={preferences.enabled} onChange={(enabled) => update({ enabled })} />
        <SettingSwitch label="เตือน Budget" description="แจ้งเมื่อยอดใช้ข้าม 100%" value={preferences.budgetEnabled} onChange={(budgetEnabled) => update({ budgetEnabled })} />
        <SettingSwitch label="เตือน Fixed Cost" description="ก่อน 3 วัน วันครบกำหนด และเมื่อเกินกำหนด" value={preferences.fixedCostEnabled} onChange={(fixedCostEnabled) => update({ fixedCostEnabled })} />

        <View style={styles.card}>
          <Text style={styles.settingTitle}>เวลาแจ้งเตือน</Text>
          <Text style={styles.settingDescription}>ใช้เวลาท้องถิ่นของเครื่อง ค่าเริ่มต้น 09:00</Text>
          <View style={styles.timeRow}>
            <TextInput accessibilityLabel="ชั่วโมงแจ้งเตือน" inputMode="numeric" maxLength={2} onChangeText={setHour} style={styles.timeInput} value={displayedHour} />
            <Text style={styles.colon}>:</Text>
            <TextInput accessibilityLabel="นาทีแจ้งเตือน" inputMode="numeric" maxLength={2} onChangeText={setMinute} style={styles.timeInput} value={displayedMinute} />
            <Pressable accessibilityRole="button" onPress={saveTime} style={styles.saveTimeButton}><Text style={styles.saveTimeText}>บันทึกเวลา</Text></Pressable>
          </View>
          {timeError ? <Text accessibilityRole="alert" style={styles.error}>{timeError}</Text> : null}
        </View>

        <SettingSwitch label="แสดงรายละเอียดบนหน้าจอล็อก" description="เมื่อปิด จะแสดงเพียงจำนวนรายการ ไม่แสดงชื่อและยอดเงิน" value={preferences.showLockScreenDetails} onChange={(showLockScreenDetails) => update({ showLockScreenDetails })} />

        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>สิทธิ์แจ้งเตือนของอุปกรณ์</Text>
          <Text style={styles.permissionText}>{permission === 'granted' ? 'อนุญาตแล้ว' : permission === 'denied' ? 'ถูกปฏิเสธ แอปยังแสดงเรื่องที่ต้องจัดการภายในได้ตามปกติ' : permission === 'undetermined' ? 'ยังไม่ได้ตัดสินใจ กดด้านล่างเมื่อพร้อม' : 'เว็บไม่มี Android notification การตั้งค่าจะมีผลเมื่อติดตั้งบนมือถือ'}</Text>
          {permission === 'undetermined' ? <Pressable accessibilityRole="button" onPress={() => void requestPermission()} style={styles.primaryButton}><Text style={styles.primaryText}>ขอสิทธิ์แจ้งเตือน</Text></Pressable> : null}
          {permission === 'denied' ? <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()} style={styles.secondaryButton}><Text style={styles.secondaryText}>เปิด Settings ของเครื่อง</Text></Pressable> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: 20, gap: 13 },
  title: { color: '#17211B', fontSize: 24, fontWeight: '800' },
  intro: { marginTop: 4, color: '#66736A', lineHeight: 20 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 14, backgroundColor: '#FFFEF9' },
  settingBody: { flex: 1 },
  settingTitle: { color: '#17211B', fontSize: 15, fontWeight: '800' },
  settingDescription: { marginTop: 3, color: '#66736A', fontSize: 12, lineHeight: 18 },
  switchPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#E7EAE3' },
  switchPillOn: { backgroundColor: '#DCEDDF' },
  switchText: { color: '#66736A', fontSize: 12, fontWeight: '800' },
  switchTextOn: { color: '#176B48' },
  card: { gap: 8, padding: 15, borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 14, backgroundColor: '#FFFEF9' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { width: 58, minHeight: 44, paddingHorizontal: 10, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 10, color: '#17211B', backgroundColor: '#FFFFFF', textAlign: 'center', fontSize: 18, fontWeight: '800' },
  colon: { color: '#17211B', fontSize: 20, fontWeight: '800' },
  saveTimeButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#176B48' },
  saveTimeText: { color: '#FFFFFF', fontWeight: '800' },
  permissionCard: { gap: 8, padding: 15, borderRadius: 14, backgroundColor: '#FFF0DC' },
  permissionTitle: { color: '#6E3C13', fontWeight: '800' },
  permissionText: { color: '#704C2D', fontSize: 13, lineHeight: 19 },
  primaryButton: { minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#176B48' },
  primaryText: { color: '#FFFFFF', fontWeight: '800' },
  secondaryButton: { minHeight: 43, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#176B48', borderRadius: 11 },
  secondaryText: { color: '#176B48', fontWeight: '800' },
  muted: { color: '#66736A' },
  error: { color: '#A93D38', lineHeight: 19 },
});
