import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { walletRepository } from '@/database/wallet-store';
import { validateWalletName, type WalletType } from '@/domain/wallets';
import { useWallets } from '@/features/wallets/use-wallets';

const typeOptions: readonly Readonly<{ id: WalletType; label: string }>[] = [
  { id: 'cash', label: 'เงินสด' },
  { id: 'bank-account', label: 'บัญชีธนาคาร' },
  { id: 'e-wallet', label: 'e-Wallet' },
];

function WalletEditForm({ wallet }: Readonly<{ wallet: { id: string; name: string; type: WalletType } }>) {
  const [name, setName] = useState(wallet.name);
  const [type, setType] = useState<WalletType>(wallet.type);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const nameError = validateWalletName(name);
    if (nameError) { setError(nameError); return; }
    try {
      setSaving(true);
      setError(null);
      await walletRepository.updateWallet({ id: wallet.id, name, type });
      router.replace('/wallets');
    } catch {
      setError('แก้ไขกระเป๋าไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  return <>
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>ชื่อกระเป๋า</Text>
      <TextInput accessibilityLabel="ชื่อกระเป๋า" autoFocus maxLength={60} onChangeText={setName} placeholder="เช่น K PLUS หรือ เงินสด" placeholderTextColor="#8A948C" style={styles.input} value={name} />
    </View>
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>ประเภท</Text>
      <View style={styles.options}>{typeOptions.map((option) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: type === option.id }} key={option.id} onPress={() => setType(option.id)} style={[styles.option, type === option.id && styles.optionActive]}><Text style={[styles.optionText, type === option.id && styles.optionTextActive]}>{option.label}</Text></Pressable>)}</View>
    </View>
    <Text style={styles.hint}>การแก้ชื่อหรือประเภทไม่เปลี่ยนยอดและประวัติรายการของ Wallet</Text>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.saveButton, (pressed || saving) && styles.pressed]}><Text style={styles.saveText}>{saving ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}</Text></Pressable>
  </>;
}

export default function EditWalletScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { wallets, loading } = useWallets();
  const wallet = useMemo(() => wallets.find((item) => item.id === id) ?? null, [id, wallets]);
  return <SafeAreaView edges={['bottom']} style={styles.safeArea}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    {!loading && !wallet ? <Text accessibilityRole="alert" style={styles.error}>ไม่พบกระเป๋านี้</Text> : null}
    {wallet ? <WalletEditForm key={wallet.id} wallet={wallet} /> : null}
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safeArea: { flex: 1, backgroundColor: '#F4F5EF' }, container: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, gap: 20 },
  fieldGroup: { gap: 8 }, label: { color: '#17211B', fontSize: 15, fontWeight: '700' }, input: { minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 13, color: '#17211B', backgroundColor: '#FFFEF9', fontSize: 16 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, option: { minHeight: 42, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 999, backgroundColor: '#FFFEF9' },
  optionActive: { borderColor: '#176B48', backgroundColor: '#DCEDDF' }, optionText: { color: '#66736A', fontWeight: '600' }, optionTextActive: { color: '#176B48' }, hint: { padding: 12, borderRadius: 12, color: '#526158', backgroundColor: '#ECEFE8', lineHeight: 20 },
  error: { color: '#A93D38', lineHeight: 20 }, saveButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#176B48' }, saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }, pressed: { opacity: 0.7 },
});
