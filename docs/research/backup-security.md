# วิจัยมาตรฐานความปลอดภัย Backup และ Export

> สถานะ: ข้อเสนอสำหรับ MVP (Android แบบ offline-first)  
> วันที่ค้นคว้า: 2026-09-03

## คำตัดสินแบบย่อ

MVP ควรเก็บฐานข้อมูลการเงินแบบเข้ารหัสในพื้นที่ส่วนตัวของแอป, ใช้กุญแจที่สุ่มและเก็บใน Android Keystore ผ่าน `expo-secure-store`, ไม่พึ่ง Android Auto Backup, และให้ผู้ใช้สร้าง **Backup ที่เข้ารหัสด้วยรหัสผ่าน** เอง ส่วน CSV เป็นไฟล์อ่านได้ทั่วไปสำหรับวิเคราะห์ข้อมูล ไม่ใช่ไฟล์กู้คืน และต้องเตือนก่อนส่งออกทุกครั้ง

## ขอบเขตภัยคุกคามและหลักที่ใช้

ข้อมูลธุรกรรม ยอดเงิน ชื่อบัญชี และสลิปเป็นข้อมูลอ่อนไหว เป้าหมายของ MVP คือป้องกันข้อมูลจากแอปอื่น ผู้พบโทรศัพท์ ไฟล์ backup/export ที่หลุด และภาพสลิปที่ค้างโดยไม่จำเป็น แต่ไม่รับประกันความปลอดภัยบนเครื่องที่ root, ถูกฝังมัลแวร์ หรือขณะผู้ใช้ปลดล็อกแอปอยู่แล้ว

OWASP MASVS กำหนดให้แอปเก็บข้อมูลอ่อนไหวอย่างปลอดภัย และแยกข้อมูลดังกล่าวออกจาก backup ที่ไม่เหมาะสม ([MASVS-STORAGE-1](https://mas.owasp.org/MASVS/controls/MASVS-STORAGE-1/), [MASWE-0006](https://mas.owasp.org/MASWE/MASVS-STORAGE/MASWE-0006/)) ขณะที่ Android แนะนำให้เก็บข้อมูลส่วนตัวใน internal storage ที่ถูก sandbox ต่อแอป ([Android security best practices](https://developer.android.com/privacy-and-security/security-best-practices))

## ข้อเสนอการเก็บข้อมูลในเครื่อง

1. ใช้ `expo-sqlite` ร่วมกับ SQLCipher สำหรับฐานข้อมูลธุรกรรม โดยเปิด `useSQLCipher` และสร้าง development/release build ด้วย `expo prebuild`; SQLCipher ใช้ไม่ได้ใน Expo Go ([Expo SQLite: SQLCipher](https://docs.expo.dev/versions/latest/sdk/sqlite/#sqlcipher))
2. สุ่ม database key 256 บิตด้วย CSPRNG แล้วเก็บเฉพาะกุญแจใน `expo-secure-store`; ห้าม hard-code, ใส่ `.env`, log หรือรวมใน backup. SecureStore เหมาะกับค่า key-value ขนาดเล็กและใช้ที่เก็บปลอดภัยของระบบปฏิบัติการ ([Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html))
3. อย่าเก็บฐานข้อมูลทั้งก้อนใน SecureStore และอย่าใช้ AsyncStorage เก็บข้อมูลการเงินหรือกุญแจ
4. ปิด log ของ OCR, จำนวนเงิน, ชื่อผู้รับ, เลขบัญชี และเนื้อหา backup; crash report ในอนาคตต้อง redact ค่าเหล่านี้

### ข้อจำกัดสำคัญ

`requireAuthentication` ของ SecureStore อาจทำให้กุญแจใช้ไม่ได้เมื่อผู้ใช้เพิ่ม/เปลี่ยนข้อมูลชีวมิติ และข้อมูล SecureStore บน Android หายเมื่อถอนการติดตั้ง ([Expo SecureStore: data persistence](https://docs.expo.dev/versions/latest/sdk/securestore/#data-persistence)) ดังนั้น MVP ควรเก็บ database key ใน SecureStore **โดยไม่ผูกกุญแจกับ biometric enrollment** และใช้ app lock เป็นด่าน UI แยกต่างหาก วิธีนี้ลดความเสี่ยงล็อกตัวเองออกจากฐานข้อมูล แต่ encrypted backup ยังคงเป็นช่องทางกู้คืนที่จำเป็น

## App lock และความเป็นส่วนตัวบนหน้าจอ

- เสนอให้ผู้ใช้เปิด App Lock ระหว่าง onboarding และเปิดได้ภายหลัง ใช้ `expo-local-authentication`, ขอ Android biometric ระดับ `strong` และอนุญาต fallback เป็น PIN/pattern/password ของเครื่อง หากเครื่องไม่รองรับให้แอปยังใช้งานได้ ([Expo LocalAuthentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/), [Android BiometricPrompt](https://developer.android.com/identity/sign-in/biometric-auth))
- ล็อกเมื่อเปิดแอปใหม่ และเมื่อลง background เกิน 30 วินาที; ค่า timeout ปรับได้ การผ่าน biometric เป็นการปลดล็อก session ในหน่วยความจำ ไม่ใช่การ login ออนไลน์
- ป้องกัน preview ใน recent-apps/app switcher และ screen capture บนหน้าสลิป, ยอดเงิน และ export ด้วย `expo-screen-capture`; Android ใช้ `FLAG_SECURE` และ iOS รองรับ privacy overlay ([Expo ScreenCapture](https://docs.expo.dev/versions/latest/sdk/screen-capture/)) ไม่ต้องขอสิทธิ์อ่านรูปเพียงเพื่อ “ตรวจจับ” screenshot

## สลิปและความยินยอม

ค่าเริ่มต้นต้องเป็น on-device OCR และให้ผู้ใช้ตรวจแก้ก่อนบันทึก Google ระบุว่า ML Kit ประมวลผล input/output บนอุปกรณ์ แม้ SDK อาจส่ง metrics ด้านการใช้งานและประสิทธิภาพซึ่งต้องเปิดเผยตามกฎหมาย ([ML Kit Terms & Privacy](https://developers.google.com/ml-kit/terms), [ML Kit data disclosure](https://developers.google.com/ml-kit/android-data-disclosure))

- ใช้ system photo picker เพื่อให้สิทธิ์เฉพาะรูปที่เลือก แทนการขออ่านคลังรูปทั้งหมด ([Android Photo Picker](https://developer.android.com/training/data-storage/shared/photo-picker), [Android permission minimization](https://developer.android.com/privacy-and-security/minimize-permission-requests))
- คัดลอกรูปเข้า cache เฉพาะระหว่าง OCR, ไม่อ่าน/เก็บ EXIF, และลบไฟล์ชั่วคราวเมื่อสำเร็จ ยกเลิก error หรือเปิดแอปครั้งถัดไป
- MVP ไม่เก็บภาพสลิปถาวร เก็บเพียงค่าที่ผู้ใช้ยืนยันและ hash สำหรับช่วยตรวจรายการซ้ำ หากอนาคตจะเก็บภาพ ต้องมีสวิตช์ opt-in, การเข้ารหัสไฟล์ และนโยบายลบ
- External OCR เป็น fallback ที่ปิดโดยค่าเริ่มต้น ก่อนส่งแต่ละครั้งต้องแสดงชื่อผู้ให้บริการ ข้อมูลที่จะส่ง วัตถุประสงค์ และลิงก์นโยบาย retention แล้วให้ผู้ใช้กดยืนยัน ห้าม upload ล่วงหน้า ห้ามใช้เพื่อโฆษณาหรือฝึกโมเดลโดยไม่มีความยินยอมใหม่ และต้องส่งผ่าน TLS

## Backup/Restore กับ CSV Export

| เรื่อง | Backup/Restore | CSV Export |
| --- | --- | --- |
| เป้าหมาย | กู้ข้อมูลทั้งแอป | อ่าน/วิเคราะห์รายการภายนอก |
| เนื้อหา | wallets, categories, transactions, budgets, fixed costs, settings ที่ไม่ใช่ secret และ schema version | เฉพาะคอลัมน์ที่ผู้ใช้เลือกตามช่วงวันที่ |
| การป้องกัน | เข้ารหัสและตรวจความถูกต้อง | plaintext พร้อมคำเตือนชัดเจน |
| ไม่รวม | database key, biometric state, token, cache และรูปสลิป | secret, รูปสลิป และเลขบัญชีเต็ม |

### รูปแบบ backup ที่แนะนำ

- Container มี `formatVersion`, `createdAt`, KDF parameters, salt, nonce, ciphertext และ authentication tag
- สร้าง DEK แบบสุ่มและเข้ารหัสข้อมูลด้วย AES-256-GCM; derive KEK จาก passphrase ด้วย Argon2id หรือ PBKDF2-HMAC-SHA-256 ที่ค่าความยากผ่านการ benchmark บนอุปกรณ์จริง การใช้ authenticated encryption และแยก KEK/DEK สอดคล้องกับ [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) ห้ามคิดอัลกอริทึมเอง
- รหัสผ่าน backup ไม่ถูกเก็บในแอปและกู้คืนไม่ได้ ต้องยืนยันรหัสผ่านสองครั้งและเตือนให้เก็บไว้ปลอดภัย
- Restore ต้องอ่านเข้า temporary database, ตรวจ format/schema version, tag, referential integrity และยอดเงินก่อน แล้วจึงสลับฐานข้อมูลแบบ atomic หลังผู้ใช้ยืนยัน เก็บ rollback copy ใน internal cache จน restore สำเร็จและลบทันที
- ทดสอบ round-trip, wrong password, corrupted/truncated file, schema เก่า, พื้นที่ไม่พอ และการยกเลิกกลางทาง

CSV ต้องสร้างใน cache และเปิด OS share sheet ผ่าน `expo-sharing`; หลัง share/cancel ให้ลบทันทีและ cleanup ซ้ำเมื่อเปิดแอปครั้งถัดไป Expo ระบุว่าการแชร์ local file URI ใช้ได้บน Android/iOS แต่เว็บต้องใช้วิธี download/upload อื่น ([Expo Sharing](https://docs.expo.dev/versions/latest/sdk/sharing/)) ชื่อบัญชีแสดงได้ตามที่ผู้ใช้เลือก แต่เลขบัญชีให้ masked โดยค่าเริ่มต้น

## Android Backup และค่าปลอดภัยสำหรับ MVP

Android Auto Backup รวม app data ส่วนใหญ่โดยปริยาย และต้องกำหนด `full-backup-content` สำหรับ Android 11 หรือต่ำกว่า กับ `data-extraction-rules` สำหรับ Android 12+; สามารถบังคับ cloud backup ให้ทำงานเฉพาะเมื่ออุปกรณ์รองรับ encryption ได้ ([Android Auto Backup](https://developer.android.com/identity/data/autobackup)) อย่างไรก็ตาม SecureStore ระบุว่าข้อมูลที่ restore กลับมาหลังถอนติดตั้งถอดรหัสไม่ได้ เพราะกุญแจใน Android Keystore ถูกลบ และจึงต้อง exclude SecureStore จาก backup ([Expo SecureStore: Android Auto Backup](https://docs.expo.dev/versions/latest/sdk/securestore/#android-auto-backup))

ข้อเสนอ MVP คือ:

1. ไม่ใช้ system Auto Backup เป็นช่องทางกู้ข้อมูลการเงิน และกำหนด native backup rules ให้ exclude database, SecureStore, cache, export และ slip temp จากทั้ง cloud backup และ device transfer
2. ใช้ manual encrypted backup เป็นช่องทางที่ผู้ใช้เห็นและควบคุมได้; แสดงวันที่ backup สำเร็จล่าสุดและเตือนเป็นระยะโดยไม่บังคับ
3. ก่อน release APK ให้ตรวจ generated Android manifest/rules จริง เพราะค่า config ระดับ native อาจต้องใช้ config plugin และ development build

## Acceptance criteria ด้านความปลอดภัย

- ถอน/ติดตั้งใหม่แล้วไม่มีการ restore ฐานข้อมูลที่ถอดรหัสไม่ได้จาก Android Auto Backup
- APK/repository/log ไม่มี database key, passphrase, รูปสลิป หรือข้อมูลเงินจริง
- แอปทำงานได้โดยไม่ให้สิทธิ์อ่านคลังรูปทั้งหมดและโดยไม่ใช้ external OCR
- การส่ง external OCR, backup และ CSV เกิดจากการกระทำพร้อมคำอธิบายของผู้ใช้เท่านั้น
- ไฟล์ชั่วคราวถูกลบทั้ง success, cancel, error และหลัง crash/relaunch
- restore ที่รหัสผ่านผิดหรือไฟล์เสียไม่แตะฐานข้อมูลเดิม
- CSV เปิดได้แต่ไม่สามารถใช้ restore และ UI ระบุความต่างนี้ชัดเจน

## การตัดสินใจที่ยังต้องถามผู้ใช้

1. App Lock: เปิดเป็นค่าเริ่มต้นหลังผู้ใช้ยืนยันตอน onboarding หรือเพียงแนะนำให้เปิด? และ timeout ต้องเป็นทันที, 30 วินาที หรือค่ากำหนดเอง
2. Screen capture: ปิดทุกหน้าการเงิน หรือเฉพาะสลิป/รายละเอียดบัญชี/export (ข้อเสนอ: เฉพาะหน้าที่อ่อนไหวเพื่อไม่รบกวนการใช้งาน)
3. CSV: อนุญาตชื่อ Wallet/ผู้รับเต็มหรือ masked โดยค่าเริ่มต้น และต้องมีรูปแบบคอลัมน์ใด
4. Backup passphrase: ยอมรับภาระที่ “ลืมแล้วกู้ไม่ได้” หรือเลื่อน encrypted backup จนมี cloud account/key recovery
5. External OCR: ต้องการรองรับใน MVP จริงหรือคงไว้เป็น phase ถัดไป; หากรองรับต้องเลือกผู้ให้บริการและตรวจ retention/region/data-use terms ก่อน
6. ระยะเวลาเตือน backup ล่าสุด เช่น 7, 14 หรือ 30 วัน

## แหล่งอ้างอิงหลัก

- [OWASP MASVS](https://mas.owasp.org/MASVS/)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Expo LocalAuthentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [Android Auto Backup](https://developer.android.com/identity/data/autobackup)
- [Android security best practices](https://developer.android.com/privacy-and-security/security-best-practices)
- [ML Kit Terms & Privacy](https://developers.google.com/ml-kit/terms)
