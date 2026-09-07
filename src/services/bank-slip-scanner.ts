import { scanFromURLAsync } from 'expo-camera';
import * as Crypto from 'expo-crypto';
import type { ImagePickerAsset } from 'expo-image-picker';

export type BankSlipScanResult = Readonly<{
  fingerprint: string;
  qrFound: boolean;
}>;

export async function scanBankSlipAsset(asset: ImagePickerAsset): Promise<BankSlipScanResult> {
  let qrPayload: string | null = null;
  try {
    const results = await scanFromURLAsync(asset.uri, ['qr']);
    qrPayload = results.find((result) => result.data)?.data ?? null;
  } catch {
    // Image fingerprint still provides duplicate protection when QR scanning is unavailable.
  }

  if (!qrPayload && !asset.base64) throw new Error('Cannot create a stable slip fingerprint');
  const fingerprintSource = qrPayload ? `qr:${qrPayload}` : `image:${asset.base64}`;
  const fingerprint = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, fingerprintSource);
  return { fingerprint, qrFound: Boolean(qrPayload) };
}
