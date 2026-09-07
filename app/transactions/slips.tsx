import { randomUUID } from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { bankSlipRepository } from '@/database/bank-slip-store';
import { canCreateSlipExpense, localDateInput, parseLocalDateInput, type SlipDraft } from '@/domain/bank-slips';
import { formatMoney, parseMoneyInput } from '@/domain/wallets';
import { scanBankSlipAsset } from '@/services/bank-slip-scanner';
import { useWallets } from '@/features/wallets/use-wallets';

function updateDraft(drafts: SlipDraft[], id: string, changes: Partial<SlipDraft>): SlipDraft[] {
  return drafts.map((draft) => draft.id === id ? { ...draft, ...changes } : draft);
}

export default function BankSlipImportScreen() {
  const { wallets } = useWallets();
  const [drafts, setDrafts] = useState<SlipDraft[]>([]);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creatableDrafts = useMemo(() => drafts.filter((draft) => canCreateSlipExpense({
    status: draft.status,
    fingerprint: draft.fingerprint,
    amountMinor: parseMoneyInput(draft.amountInput),
    walletId: draft.walletId,
    occurredAt: parseLocalDateInput(draft.dateInput),
  })), [drafts]);

  async function selectImages() {
    setError(null);
    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        orderedSelection: true,
        selectionLimit: 5,
        base64: true,
        quality: 0.8,
      });
    } catch {
      setError('เปิดคลังรูปไม่สำเร็จ กรุณาตรวจสิทธิ์เข้าถึงรูปของแอป');
      return;
    }
    if (result.canceled || !result.assets.length) return;

    const initialDrafts: SlipDraft[] = result.assets.map((asset, index) => ({
      id: randomUUID(),
      fileName: asset.fileName || `สลิป ${index + 1}`,
      uri: asset.uri,
      fingerprint: null,
      qrFound: false,
      status: 'scanning',
      amountInput: '',
      dateInput: localDateInput(),
      walletId: wallets[0]?.id ?? null,
      errorMessage: null,
    }));
    setDrafts(initialDrafts);
    setProcessing(true);
    const fingerprintsInBatch = new Set<string>();

    for (let index = 0; index < result.assets.length; index += 1) {
      const asset = result.assets[index];
      const draft = initialDrafts[index];
      try {
        const scan = await scanBankSlipAsset(asset);
        const duplicate = fingerprintsInBatch.has(scan.fingerprint) || await bankSlipRepository.hasFingerprint(scan.fingerprint);
        fingerprintsInBatch.add(scan.fingerprint);
        setDrafts((current) => updateDraft(current, draft.id, {
          fingerprint: scan.fingerprint,
          qrFound: scan.qrFound,
          status: duplicate ? 'duplicate' : 'ready',
          errorMessage: duplicate ? 'พบสลิปนี้ในรายการเดิมหรือในชุดที่เลือก' : null,
        }));
      } catch {
        setDrafts((current) => updateDraft(current, draft.id, { status: 'error', errorMessage: 'ประมวลผลรูปนี้ไม่สำเร็จ' }));
      }
    }
    setProcessing(false);
  }

  async function createExpenses() {
    if (creatableDrafts.length === 0) return setError('กรุณากรอกยอด วันที่ และเลือกกระเป๋าให้รายการที่พร้อมก่อน');
    setSaving(true);
    setError(null);
    for (const draft of creatableDrafts) {
      const amountMinor = parseMoneyInput(draft.amountInput);
      const occurredAt = parseLocalDateInput(draft.dateInput);
      if (!draft.fingerprint || !draft.walletId || amountMinor === null || occurredAt === null) continue;
      try {
        await bankSlipRepository.createExpense({
          fingerprint: draft.fingerprint,
          walletId: draft.walletId,
          amountMinor,
          occurredAt,
          note: `นำเข้าจากสลิป ${draft.fileName}`,
        });
        setDrafts((current) => updateDraft(current, draft.id, { status: 'saved', errorMessage: null }));
      } catch {
        const duplicate = await bankSlipRepository.hasFingerprint(draft.fingerprint).catch(() => false);
        setDrafts((current) => updateDraft(current, draft.id, {
          status: duplicate ? 'duplicate' : 'error',
          errorMessage: duplicate ? 'สลิปนี้ถูกบันทึกไปแล้ว' : 'สร้าง Expense ไม่สำเร็จ',
        }));
      }
    }
    setConfirming(false);
    setSaving(false);
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>รูปอยู่ในเครื่องเท่านั้น</Text>
          <Text style={styles.introText}>เลือกได้ครั้งละไม่เกิน 5 รูป แอปอ่าน QR และสร้าง fingerprint ในเครื่อง โดยไม่เก็บ QR ดิบหรือรูปลงฐานข้อมูล</Text>
        </View>
        <Pressable accessibilityRole="button" disabled={processing || saving} onPress={() => void selectImages()} style={({ pressed }) => [styles.selectButton, (pressed || processing || saving) && styles.pressed]}>
          <Text style={styles.selectText}>{processing ? 'กำลังอ่านสลิป…' : drafts.length ? 'เลือกชุดรูปใหม่' : 'เลือกรูปสลิปหลายรูป'}</Text>
        </Pressable>

        {drafts.map((draft) => {
          const amountMinor = parseMoneyInput(draft.amountInput);
          return (
            <View key={draft.id} style={[styles.draftCard, draft.status === 'duplicate' && styles.duplicateCard, draft.status === 'saved' && styles.savedCard]}>
              <View style={styles.draftHeader}>
                <Image accessibilityLabel={`ตัวอย่าง ${draft.fileName}`} source={{ uri: draft.uri }} style={styles.thumbnail} />
                <View style={styles.flex}>
                  <Text numberOfLines={1} style={styles.fileName}>{draft.fileName}</Text>
                  <Text style={styles.scanStatus}>
                    {draft.status === 'scanning' ? 'กำลังอ่าน…' : draft.status === 'saved' ? '✓ สร้าง Expense แล้ว' : draft.status === 'duplicate' ? 'สลิปซ้ำ · ไม่สร้างรายการ' : draft.status === 'error' ? 'อ่านไม่สำเร็จ' : draft.qrFound ? 'พบ QR · รอตรวจข้อมูล' : 'ไม่พบ QR · ใช้ fingerprint จากรูป'}
                  </Text>
                  {draft.status === 'ready' ? <Text style={styles.categoryText}>หมวด: ยังไม่ระบุ</Text> : null}
                </View>
              </View>

              {draft.status === 'ready' ? (
                <>
                  <View style={styles.twoColumns}>
                    <View style={styles.flex}>
                      <Text style={styles.label}>ยอดเงิน *</Text>
                      <TextInput accessibilityLabel={`ยอดเงิน ${draft.fileName}`} inputMode="decimal" onChangeText={(value) => setDrafts((current) => updateDraft(current, draft.id, { amountInput: value }))} placeholder="0.00" placeholderTextColor="#8A948C" style={styles.input} value={draft.amountInput} />
                    </View>
                    <View style={styles.dateField}>
                      <Text style={styles.label}>วันที่ *</Text>
                      <TextInput accessibilityLabel={`วันที่ ${draft.fileName}`} onChangeText={(value) => setDrafts((current) => updateDraft(current, draft.id, { dateInput: value }))} placeholder="YYYY-MM-DD" placeholderTextColor="#8A948C" style={styles.input} value={draft.dateInput} />
                    </View>
                  </View>
                  {draft.dateInput && !parseLocalDateInput(draft.dateInput) ? <Text style={styles.validation}>วันที่ต้องเป็นรูปแบบ YYYY-MM-DD และเป็นวันที่จริง</Text> : null}
                  <Text style={styles.label}>จ่ายจากกระเป๋า *</Text>
                  <View style={styles.walletOptions}>
                    {wallets.map((wallet) => (
                      <Pressable accessibilityRole="radio" accessibilityState={{ checked: draft.walletId === wallet.id }} key={wallet.id} onPress={() => setDrafts((current) => updateDraft(current, draft.id, { walletId: wallet.id }))} style={[styles.walletChip, draft.walletId === wallet.id && styles.walletActive]}>
                        <Text style={styles.walletText}>{wallet.name} · {formatMoney(wallet.balanceMinor)}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {wallets.length === 0 ? <Text style={styles.validation}>ยังไม่มีกระเป๋า กรุณาสร้างกระเป๋าก่อนนำเข้าสลิป</Text> : null}
                  {amountMinor !== null && draft.walletId ? <Text style={styles.readyText}>พร้อมสร้างเมื่อยอดมากกว่า 0 และวันที่ถูกต้อง</Text> : null}
                </>
              ) : null}
              {draft.errorMessage ? <Text style={styles.validation}>{draft.errorMessage}</Text> : null}
            </View>
          );
        })}

        {!processing && drafts.some((draft) => draft.status === 'ready') ? (
          confirming ? (
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>ยืนยันสร้าง {creatableDrafts.length} Expense?</Text>
              <Text style={styles.confirmText}>แต่ละสลิปจะเป็น Expense แยกรายการ หมวดยังไม่ระบุ และรายการที่ผิดพลาดจะไม่ขัดขวางรูปอื่น</Text>
              <View style={styles.actionRow}>
                <Pressable accessibilityRole="button" onPress={() => setConfirming(false)} style={styles.cancelButton}><Text style={styles.cancelText}>ย้อนกลับ</Text></Pressable>
                <Pressable accessibilityRole="button" disabled={saving || creatableDrafts.length === 0} onPress={() => void createExpenses()} style={styles.saveButton}><Text style={styles.saveText}>{saving ? 'กำลังสร้าง…' : 'ยืนยันสร้าง Expense'}</Text></Pressable>
              </View>
            </View>
          ) : (
            <Pressable accessibilityRole="button" disabled={creatableDrafts.length === 0} onPress={() => setConfirming(true)} style={[styles.saveButton, creatableDrafts.length === 0 && styles.disabled]}>
              <Text style={styles.saveText}>{creatableDrafts.length > 0 ? `ตรวจแล้ว · สร้าง ${creatableDrafts.length} Expense` : 'กรอกยอด วันที่ และกระเป๋าให้ครบ'}</Text>
            </Pressable>
          )
        ) : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#F4F5EF' },
  container: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, gap: 13 },
  introCard: { padding: 16, gap: 5, borderRadius: 15, backgroundColor: '#173F2B' },
  introTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  introText: { color: '#D5E3DA', fontSize: 12, lineHeight: 18 },
  selectButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#176B48' },
  selectText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  draftCard: { padding: 14, gap: 11, borderWidth: 1, borderColor: '#DFE4DA', borderRadius: 15, backgroundColor: '#FFFEF9' },
  duplicateCard: { borderColor: '#D88B84', backgroundColor: '#FFF5F3' },
  savedCard: { borderColor: '#9CC7AA', backgroundColor: '#F4FBF6' },
  draftHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  thumbnail: { width: 58, height: 72, borderRadius: 8, backgroundColor: '#E5E9E3' },
  fileName: { color: '#17211B', fontWeight: '800' },
  scanStatus: { marginTop: 4, color: '#526158', fontSize: 12 },
  categoryText: { marginTop: 4, color: '#8A4C17', fontSize: 12, fontWeight: '700' },
  twoColumns: { flexDirection: 'row', gap: 10 },
  dateField: { width: 145 },
  label: { marginBottom: 6, color: '#17211B', fontSize: 13, fontWeight: '700' },
  input: { minHeight: 46, paddingHorizontal: 11, borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 11, color: '#17211B', backgroundColor: '#FFFFFF', fontSize: 15 },
  walletOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  walletChip: { minHeight: 40, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9D0C9', borderRadius: 999 },
  walletActive: { borderColor: '#176B48', backgroundColor: '#DCEDDF' },
  walletText: { color: '#526158', fontSize: 12, fontWeight: '600' },
  readyText: { color: '#176B48', fontSize: 11 },
  validation: { color: '#A93D38', fontSize: 12, lineHeight: 17 },
  confirmCard: { padding: 15, gap: 8, borderWidth: 1, borderColor: '#D9B984', borderRadius: 14, backgroundColor: '#FFF8E9' },
  confirmTitle: { color: '#6E3C13', fontSize: 16, fontWeight: '800' },
  confirmText: { color: '#704C2D', fontSize: 13, lineHeight: 19 },
  actionRow: { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#B8C1B9', borderRadius: 13, backgroundColor: '#FFFFFF' },
  cancelText: { color: '#526158', fontWeight: '700' },
  saveButton: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#B34B43' },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  error: { color: '#A93D38', lineHeight: 20 },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.45 },
});
