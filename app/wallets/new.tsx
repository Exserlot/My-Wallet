import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { walletRepository } from '@/database/wallet-store';
import { parseOpeningBalance, validateWalletName, type WalletType } from '@/domain/wallets';

const typeOptions: readonly { label: string; value: WalletType }[] = [
  { label: 'เงินสด', value: 'cash' },
  { label: 'บัญชีธนาคาร', value: 'bank-account' },
  { label: 'e-Wallet', value: 'e-wallet' },
];

export default function NewWalletScreen() {
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank-account');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const nameError = validateWalletName(name);
    if (nameError) {
      setError(nameError);
      return;
    }

    const openingBalanceMinor = parseOpeningBalance(openingBalance);
    if (openingBalanceMinor === null) {
      setError('กรุณากรอกยอดเริ่มต้นเป็นตัวเลขที่มีทศนิยมไม่เกิน 2 ตำแหน่ง');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await walletRepository.createWallet({
        name,
        type,
        openingBalanceMinor,
        occurredAt: new Date().toISOString(),
      });
      router.replace('/wallets');
    } catch {
      setError('สร้างกระเป๋าไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>ชื่อกระเป๋า</Text>
            <TextInput
              accessibilityLabel="ชื่อกระเป๋า"
              maxLength={60}
              onChangeText={setName}
              placeholder="เช่น K PLUS หรือ เงินสด"
              placeholderTextColor="#8A948C"
              style={styles.input}
              value={name}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>ประเภท</Text>
            <View style={styles.typeRow}>
              {typeOptions.map((option) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: type === option.value }}
                  key={option.value}
                  onPress={() => setType(option.value)}
                  style={[styles.typeButton, type === option.value && styles.typeButtonActive]}
                >
                  <Text style={[styles.typeText, type === option.value && styles.typeTextActive]}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>ยอดเริ่มต้น</Text>
            <TextInput
              accessibilityLabel="ยอดเริ่มต้น"
              inputMode="decimal"
              onChangeText={setOpeningBalance}
              placeholder="0.00"
              placeholderTextColor="#8A948C"
              style={styles.input}
              value={openingBalance}
            />
            <Text style={styles.hint}>Opening Balance ใช้ตั้งยอดปัจจุบันและไม่นับเป็นรายรับ</Text>
          </View>

          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => void submit()}
            style={({ pressed }) => [styles.primaryButton, (pressed || saving) && styles.pressed]}
          >
            <Text style={styles.primaryText}>{saving ? 'กำลังบันทึก…' : 'สร้างกระเป๋า'}</Text>
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
  fieldGroup: { gap: 8 },
  label: { color: '#17211B', fontSize: 15, fontWeight: '700' },
  input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 13, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 16 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeButton: { minHeight: 42, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 999, backgroundColor: '#FFFEF9' },
  typeButtonActive: { borderColor: '#176B48', backgroundColor: '#DCEDDF' },
  typeText: { color: '#66736A', fontWeight: '600' },
  typeTextActive: { color: '#176B48' },
  hint: { color: '#66736A', fontSize: 13, lineHeight: 18 },
  error: { color: '#A93D38', lineHeight: 20 },
  primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#176B48' },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
